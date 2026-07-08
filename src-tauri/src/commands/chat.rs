use serde::{Deserialize, Serialize};
use std::process::Stdio;
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter};
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader, BufWriter};
use tokio::process::{Command as TokioCommand, ChildStdin};
use tokio::sync::Mutex as TokioMutex;
use crate::commands::cli::find_claude_cli;
use crate::commands::permissions::PermissionMode;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PluginSkillInfo {
    pub name: String,
    pub description: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PluginInfo {
    pub name: String,
    pub path: String,
    pub skills: Vec<PluginSkillInfo>,
}

fn parse_skill_frontmatter(content: &str) -> (String, String) {
    let mut name = String::new();
    let mut description = String::new();

    if content.starts_with("---") {
        if let Some(end_pos) = content[3..].find("\n---") {
            let frontmatter = &content[3..end_pos + 3];
            for line in frontmatter.lines() {
                let line = line.trim();
                if let Some(val) = line.strip_prefix("name:") {
                    name = val.trim().to_string();
                } else if let Some(val) = line.strip_prefix("description:") {
                    description = val.trim().to_string();
                }
            }
        }
    }

    (name, description)
}

async fn scan_plugin_skills(plugin_path: &str) -> Vec<PluginSkillInfo> {
    let mut skills = Vec::new();
    let path = std::path::Path::new(plugin_path);

    // Check skills/ directory first
    let skills_dir = path.join("skills");
    if let Ok(mut dir_entries) = tokio::fs::read_dir(&skills_dir).await {
        while let Ok(Some(entry)) = dir_entries.next_entry().await {
            let skill_md = entry.path().join("SKILL.md");
            if tokio::fs::metadata(&skill_md).await.is_ok() {
                if let Ok(content) = tokio::fs::read_to_string(&skill_md).await {
                    let (name, description) = parse_skill_frontmatter(&content);
                    if !name.is_empty() {
                        skills.push(PluginSkillInfo {
                            name: if name.starts_with('/') { name } else { format!("/{}", name) },
                            description,
                        });
                    }
                }
            }
        }
    }

    // Fall back to root SKILL.md for single-skill plugins
    if skills.is_empty() {
        let root_skill_md = path.join("SKILL.md");
        if tokio::fs::metadata(&root_skill_md).await.is_ok() {
            if let Ok(content) = tokio::fs::read_to_string(&root_skill_md).await {
                let (name, description) = parse_skill_frontmatter(&content);
                if !name.is_empty() {
                    skills.push(PluginSkillInfo {
                        name: if name.starts_with('/') { name } else { format!("/{}", name) },
                        description,
                    });
                }
            }
        }
    }

    skills
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct StreamEvent {
    pub event_type: String,
    pub content: Option<String>,
    pub tool_name: Option<String>,
    pub thinking_status: Option<String>,
    pub tool_input: Option<serde_json::Value>,
    pub input_tokens: Option<u64>,
    pub output_tokens: Option<u64>,
}

lazy_static::lazy_static! {
    static ref CLAUDE_PROCESS: Arc<Mutex<Option<tokio::process::Child>>> = Arc::new(Mutex::new(None));
    static ref PERMISSIONS_APPROVED: Arc<Mutex<bool>> = Arc::new(Mutex::new(false));
    static ref AWAITING_PERMISSION: Arc<Mutex<bool>> = Arc::new(Mutex::new(false));
    static ref TEMPORARY_APPROVAL: Arc<Mutex<bool>> = Arc::new(Mutex::new(false));
    static ref PERMISSION_MODE: Arc<Mutex<PermissionMode>> = Arc::new(Mutex::new(PermissionMode::AcceptEdits));
    static ref PROCESS_STDIN: Arc<TokioMutex<Option<BufWriter<ChildStdin>>>> = Arc::new(TokioMutex::new(None));
}

#[tauri::command]
pub async fn send_message(
    app: AppHandle,
    message: String,
    project_path: String,
    model: String,
    _skip_permissions: bool, // Kept for API compatibility but ignored
) -> Result<(), String> {
    println!("[CHAT] send_message called");
    println!("[CHAT] Message: {}", message);
    println!("[CHAT] Project path: {}", project_path);
    println!("[CHAT] Model: {}", model);

    // Build command
    let mut args = vec![
        "--continue".to_string(),
        "--output-format".to_string(),
        "stream-json".to_string(),
        "--input-format".to_string(),
        "stream-json".to_string(),
        "--verbose".to_string(),
        "--model".to_string(),
        model.clone(),
    ];

    // Get permission mode - now maps 1:1 with CLI flags
    let permission_mode_str = {
        let mode = PERMISSION_MODE.lock().unwrap().clone();
        println!("[CHAT] Permission mode: {:?}", mode);

        match mode {
            PermissionMode::Default => "default",
            PermissionMode::AcceptEdits => "acceptEdits",
            PermissionMode::BypassPermissions => "bypassPermissions",
            PermissionMode::Plan => "plan",
            PermissionMode::Auto => "auto",
            PermissionMode::DontAsk => "dontAsk",
        }
    };

    println!("[CHAT] Using permission mode: {}", permission_mode_str);

    // Add permission mode flags
    args.push("--permission-mode".to_string());
    args.push(permission_mode_str.to_string());

    // Enable stdio-based permission prompts (bidirectional protocol)
    args.push("--permission-prompt-tool".to_string());
    args.push("stdio".to_string());

    // Set PERMISSIONS_APPROVED based on mode (for backwards compat with output suppression logic)
    *PERMISSIONS_APPROVED.lock().unwrap() = permission_mode_str == "bypassPermissions";

    // DO NOT push message as argument when using --input-format stream-json
    // Message will be sent to stdin after spawn

    println!("[CHAT] Command: claude {:?}", args);

    // Spawn Claude process
    let claude_path = find_claude_cli();
    println!("[CHAT] Using Claude CLI at: {}", claude_path);
    println!("[CHAT] Spawning Claude CLI process...");
    let mut cmd = TokioCommand::new(&claude_path);
    cmd.args(&args)
        .current_dir(&project_path)
        .stdin(Stdio::piped())      // NEW: Enable stdin for bidirectional protocol
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    // Suppress the console window on Windows
    #[cfg(windows)]
    cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW

    let mut child = cmd.spawn().map_err(|e| {
        let error = format!("Failed to spawn Claude CLI: {}", e);
        println!("[CHAT ERROR] {}", error);
        error
    })?;

    println!("[CHAT] Process spawned successfully");

    // Get stdin and stdout handles BEFORE storing child
    let stdin = child.stdin.take().ok_or_else(|| {
        println!("[CHAT ERROR] Failed to capture stdin");
        "Failed to capture stdin".to_string()
    })?;

    let stdout = child.stdout.take().ok_or_else(|| {
        println!("[CHAT ERROR] Failed to capture stdout");
        "Failed to capture stdout".to_string()
    })?;

    let stderr = child.stderr.take().ok_or_else(|| {
        println!("[CHAT ERROR] Failed to capture stderr");
        "Failed to capture stderr".to_string()
    })?;

    // Store process reference
    {
        let mut process = CLAUDE_PROCESS.lock().unwrap();
        *process = Some(child);
    }

    // Store stdin writer for sending control responses (using async lock)
    {
        let mut stdin_writer = PROCESS_STDIN.lock().await;
        *stdin_writer = Some(BufWriter::new(stdin));
        println!("[CHAT] stdin writer stored for bidirectional communication");
    }

    // Send initial user message to stdin (required for --input-format stream-json)
    {
        use uuid::Uuid;
        let user_uuid = Uuid::new_v4().to_string();
        let payload = serde_json::json!({
            "type": "user",
            "uuid": user_uuid,
            "message": {
                "role": "user",
                "content": message
            }
        });

        let mut line = serde_json::to_string(&payload).map_err(|e| {
            let error = format!("Failed to serialize user message: {}", e);
            println!("[CHAT ERROR] {}", error);
            error
        })?;
        line.push('\n');

        println!("[CHAT] Writing user message to stdin: {}", &line.trim());

        let mut stdin_opt = PROCESS_STDIN.lock().await;
        if let Some(stdin_writer) = stdin_opt.as_mut() {
            stdin_writer.write_all(line.as_bytes()).await.map_err(|e| {
                let error = format!("Failed to write user message to stdin: {}", e);
                println!("[CHAT ERROR] {}", error);
                error
            })?;
            stdin_writer.flush().await.map_err(|e| {
                let error = format!("Failed to flush stdin after user message: {}", e);
                println!("[CHAT ERROR] {}", error);
                error
            })?;
            println!("[CHAT] User message sent to stdin successfully");
        } else {
            let error = "stdin writer not available after storing";
            println!("[CHAT ERROR] {}", error);
            return Err(error.to_string());
        }
    }

    let reader = BufReader::new(stdout);
    let mut lines = reader.lines();

    // Spawn a task to read stderr and log it
    let stderr_reader = BufReader::new(stderr);
    let mut stderr_lines = stderr_reader.lines();
    tokio::spawn(async move {
        while let Ok(Some(line)) = stderr_lines.next_line().await {
            println!("[CHAT STDERR] {}", line);
        }
    });

    // Process streaming output
    println!("[CHAT] Starting to read output lines...");
    let mut line_count = 0;
    let mut session_emitted_text = false; // tracks if a previous assistant turn emitted text
    while let Ok(Some(line)) = lines.next_line().await {
        line_count += 1;
        println!("[CHAT] Received line {}: {}", line_count, line);

        if let Ok(event) = serde_json::from_str::<serde_json::Value>(&line) {
            if let Some(event_type) = event.get("type").and_then(|t| t.as_str()) {
                println!("[CHAT] Event type: {}", event_type);
                match event_type {
                    "control_request" => {
                        // CLI is requesting permission via stdio protocol
                        if let Some(request_obj) = event.get("request") {
                            if let Some(subtype) = request_obj.get("subtype").and_then(|s| s.as_str()) {
                                if subtype == "can_use_tool" {
                                    println!("[CHAT] Received can_use_tool control_request from CLI");

                                    let request_id = event.get("request_id")
                                        .and_then(|id| id.as_str())
                                        .unwrap_or("unknown")
                                        .to_string();

                                    let tool_name = request_obj.get("tool_name")
                                        .and_then(|n| n.as_str())
                                        .unwrap_or("Unknown");

                                    let tool_input = request_obj.get("input")
                                        .and_then(|i| serde_json::to_string_pretty(i).ok())
                                        .unwrap_or_else(|| "{}".to_string());

                                    // Emit permission request to frontend
                                    let permission_data = serde_json::json!({
                                        "requestId": request_id,
                                        "toolName": tool_name,
                                        "input": tool_input,
                                    });

                                    let _ = app.emit("chat:permission-request", permission_data);

                                    // Set awaiting flag to suppress output until approved
                                    let mut awaiting = AWAITING_PERMISSION.lock().unwrap();
                                    *awaiting = true;

                                    println!("[CHAT] Permission request emitted, waiting for user response");
                                }
                            }
                        }
                    }
                    "assistant" => {
                        // Parse: event.message.content[0]
                        // Content can be text, thinking, or tool_use
                        if let Some(message) = event.get("message") {
                            if let Some(content_array) = message.get("content").and_then(|c| c.as_array()) {
                                // Check if we're awaiting permission (set by control_request handler)
                                let awaiting_permission = {
                                    let flag = AWAITING_PERMISSION.lock().unwrap();
                                    *flag
                                };

                                // If a previous assistant turn already emitted text and this one
                                // also has text, finalize the previous bubble first
                                let this_event_has_text = content_array.iter().any(|item| {
                                    item.get("type").and_then(|t| t.as_str()) == Some("text")
                                });
                                if session_emitted_text && this_event_has_text && !awaiting_permission {
                                    println!("[CHAT] New assistant text turn - emitting turn-complete");
                                    let _ = app.emit("chat:turn-complete", StreamEvent {
                                        event_type: "turn-complete".to_string(),
                                        content: None,
                                        tool_name: None,
                                        thinking_status: None,
                                        tool_input: None,
                                        input_tokens: None,
                                        output_tokens: None,
                                    });
                                    session_emitted_text = false;
                                }

                                // SECOND PASS: Process content items
                                for content_item in content_array {
                                    if let Some(content_type) = content_item.get("type").and_then(|t| t.as_str()) {
                                        match content_type {
                                            "text" => {
                                                // Check if we're awaiting permission - if so, suppress output
                                                let awaiting = {
                                                    let flag = AWAITING_PERMISSION.lock().unwrap();
                                                    *flag
                                                };

                                                if awaiting {
                                                    println!("[CHAT] Suppressing text chunk (awaiting permission)");
                                                } else {
                                                    // Emit text chunks
                                                    if let Some(text) = content_item.get("text").and_then(|t| t.as_str()) {
                                                        println!("[CHAT] Emitting text chunk: {}", &text[..text.len().min(50)]);
                                                        let _ = app.emit("chat:chunk", StreamEvent {
                                                            event_type: "assistant".to_string(),
                                                            content: Some(text.to_string()),
                                                            tool_name: None,
                                                            thinking_status: None,
                                                            tool_input: None,
                                                            input_tokens: None,
                                                            output_tokens: None,
                                                        });
                                                        session_emitted_text = true;
                                                    }
                                                }
                                            }
                                            "tool_use" => {
                                                // Tool use detected - emit tool event (permission already handled by control_request)
                                                if let Some(tool_name) = content_item.get("name").and_then(|n| n.as_str()) {
                                                    println!("[CHAT] Tool use detected: {}", tool_name);

                                                    // Extract tool input
                                                    let tool_input = content_item.get("input").cloned();

                                                    // Check if we're awaiting permission
                                                    let awaiting = {
                                                        let flag = AWAITING_PERMISSION.lock().unwrap();
                                                        *flag
                                                    };

                                                    if !awaiting {
                                                        // Permissions already approved or CLI handled it - emit tool event
                                                        let _ = app.emit("chat:tool", StreamEvent {
                                                            event_type: "tool_use".to_string(),
                                                            content: None,
                                                            tool_name: Some(tool_name.to_string()),
                                                            thinking_status: None,
                                                            tool_input,
                                                            input_tokens: None,
                                                            output_tokens: None,
                                                        });
                                                    } else {
                                                        println!("[CHAT] Suppressing tool event (awaiting permission approval)");
                                                    }
                                                }
                                            }
                                            "thinking" => {
                                                if let Some(text) = content_item.get("thinking").and_then(|t| t.as_str()) {
                                                    println!("[CHAT] Emitting thought block ({} chars)", text.len());
                                                    let _ = app.emit("chat:thought", StreamEvent {
                                                        event_type: "thought".to_string(),
                                                        content: Some(text.to_string()),
                                                        tool_name: None,
                                                        thinking_status: None,
                                                        tool_input: None,
                                                        input_tokens: None,
                                                        output_tokens: None,
                                                    });
                                                }
                                            }
                                            _ => {
                                                println!("[CHAT] Unknown content type: {}", content_type);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    "thinking" => {
                        if let Some(status) = event.get("status").and_then(|s| s.as_str()) {
                            let _ = app.emit("chat:thinking", StreamEvent {
                                event_type: "thinking".to_string(),
                                content: None,
                                tool_name: None,
                                thinking_status: Some(status.to_string()),
                                tool_input: None,
                                input_tokens: None,
                                output_tokens: None,
                            });
                        }
                    }
                    "result" => {
                        // Check if we're awaiting permission - if so, suppress result
                        let awaiting = {
                            let flag = AWAITING_PERMISSION.lock().unwrap();
                            *flag
                        };

                        if awaiting {
                            println!("[CHAT] Suppressing result event (awaiting permission)");
                        } else {
                            println!("[CHAT] Emitting result event");

                            // Extract token usage from result event
                            let input_tokens = event.get("usage")
                                .and_then(|u| u.get("input_tokens"))
                                .and_then(|t| t.as_u64());
                            let output_tokens = event.get("usage")
                                .and_then(|u| u.get("output_tokens"))
                                .and_then(|t| t.as_u64());

                            if let (Some(input), Some(output)) = (input_tokens, output_tokens) {
                                println!("[CHAT] Token usage - Input: {}, Output: {}, Total: {}",
                                    input, output, input + output);
                            }

                            let _ = app.emit("chat:result", StreamEvent {
                                event_type: "result".to_string(),
                                content: None,
                                tool_name: None,
                                thinking_status: None,
                                tool_input: None,
                                input_tokens,
                                output_tokens,
                            });

                            // Note: We do NOT reset temporary approvals here anymore
                            // Temporary approval means "for this session" not "for one tool use"
                            // It will persist until page reload or manual reset button click
                        }
                    }
                    "system" => {
                        // Extract session_id and plugins from init event
                        if let Some(subtype) = event.get("subtype").and_then(|s| s.as_str()) {
                            if subtype == "init" {
                                if let Some(session_id) = event.get("session_id").and_then(|id| id.as_str()) {
                                    println!("[CHAT] Session started: {}", session_id);
                                    let _ = app.emit("chat:session-id", session_id);
                                }

                                // Scan plugins and emit plugin info to frontend
                                if let Some(plugins_array) = event.get("plugins").and_then(|p| p.as_array()) {
                                    let app_clone = app.clone();
                                    let plugin_entries: Vec<(String, String)> = plugins_array.iter()
                                        .filter_map(|p| {
                                            let name = p.get("name")?.as_str()?.to_string();
                                            let path = p.get("path")?.as_str()?.to_string();
                                            Some((name, path))
                                        })
                                        .collect();

                                    tokio::spawn(async move {
                                        let mut plugin_infos: Vec<PluginInfo> = Vec::new();
                                        for (name, path) in plugin_entries {
                                            println!("[CHAT] Scanning plugin: {} at {}", name, path);
                                            let skills = scan_plugin_skills(&path).await;
                                            println!("[CHAT] Found {} skills in plugin {}", skills.len(), name);
                                            plugin_infos.push(PluginInfo { name, path, skills });
                                        }
                                        let _ = app_clone.emit("chat:plugins-loaded", plugin_infos);
                                        println!("[CHAT] Emitted chat:plugins-loaded");
                                    });
                                }
                            }
                        }

                        // Handle system events (like rate limits and context compression)
                        if let Some(message_type) = event.get("message").and_then(|m| m.get("type")).and_then(|t| t.as_str()) {
                            if message_type == "api_retry" {
                                if let Some(retry) = event.get("message").and_then(|m| m.get("retry_count")).and_then(|r| r.as_u64()) {
                                    if let Some(delay) = event.get("message").and_then(|m| m.get("retry_delay_ms")).and_then(|d| d.as_u64()) {
                                        let status = format!("Rate limit hit - retrying in {}s (attempt {}/10)", delay / 1000, retry);
                                        let _ = app.emit("chat:thinking", StreamEvent {
                                            event_type: "thinking".to_string(),
                                            content: None,
                                            tool_name: None,
                                            thinking_status: Some(status),
                                            tool_input: None,
                                            input_tokens: None,
                                            output_tokens: None,
                                        });
                                    }
                                }
                            } else if message_type == "context_compression" || message_type == "compacting" {
                                // Show compression indicator when CLI is managing context window
                                let status = "Compressing conversation context...".to_string();
                                println!("[CHAT] Context compression in progress");
                                let _ = app.emit("chat:thinking", StreamEvent {
                                    event_type: "thinking".to_string(),
                                    content: None,
                                    tool_name: None,
                                    thinking_status: Some(status),
                                    tool_input: None,
                                    input_tokens: None,
                                    output_tokens: None,
                                });
                            }
                        }
                    }
                    "error" => {
                        if let Some(error_msg) = event.get("error").and_then(|e| e.as_str()) {
                            let _ = app.emit("chat:error", error_msg.to_string());
                        }
                    }
                    _ => {
                        println!("[CHAT] Unknown event type: {}", event_type);
                    }
                }
            }
        } else {
            println!("[CHAT] Failed to parse JSON: {}", line);
        }
    }

    println!("[CHAT] Finished reading output. Total lines: {}", line_count);

    // Wait for process to complete
    println!("[CHAT] Waiting for process to complete...");
    let child_option = {
        let mut process_guard = CLAUDE_PROCESS.lock().unwrap();
        process_guard.take()
    }; // Lock is dropped here

    if let Some(mut child) = child_option {
        let status = child.wait().await.map_err(|e| {
            let error = format!("Error waiting for process: {}", e);
            println!("[CHAT ERROR] {}", error);
            error
        })?;

        println!("[CHAT] Process exited with status: {:?}", status);

        if !status.success() {
            let error = format!("Claude CLI process failed with status: {:?}", status);
            println!("[CHAT ERROR] {}", error);
            return Err(error);
        }
    }

    println!("[CHAT] send_message completed successfully");
    Ok(())
}

#[tauri::command]
pub fn kill_claude_process() -> Result<(), String> {
    let mut process = CLAUDE_PROCESS.lock().unwrap();

    if let Some(mut child) = process.take() {
        let _ = child.start_kill();
    }

    Ok(())
}

/// Called by frontend after user confirms close (saved or discarded all dirty files).
/// Kills any running Claude process then destroys the window.
#[tauri::command]
pub fn confirm_close(window: tauri::WebviewWindow) -> Result<(), String> {
    println!("[APP] confirm_close called - killing Claude process and closing window");

    // Kill any in-flight Claude process
    let mut process = CLAUDE_PROCESS.lock().unwrap();
    if let Some(mut child) = process.take() {
        println!("[APP] Killing active Claude process before close");
        let _ = child.start_kill();
    }

    // Destroy the window — bypasses CloseRequested so no infinite loop
    window.destroy().map_err(|e| format!("Failed to close window: {}", e))
}

#[tauri::command]
pub fn get_permission_status() -> Result<bool, String> {
    let status = PERMISSIONS_APPROVED.lock().unwrap();
    println!("[CHAT] get_permission_status called, returning: {}", *status);
    Ok(*status)
}

#[tauri::command]
pub fn approve_permissions(temporary: bool) -> Result<(), String> {
    println!("[CHAT] approve_permissions called (temporary: {})", temporary);
    let mut status = PERMISSIONS_APPROVED.lock().unwrap();
    println!("[CHAT] Setting PERMISSIONS_APPROVED from {} to true", *status);
    *status = true;

    // Clear the awaiting permission flag so retry output shows
    let mut awaiting = AWAITING_PERMISSION.lock().unwrap();
    println!("[CHAT] Setting AWAITING_PERMISSION from {} to false", *awaiting);
    *awaiting = false;

    // Track if this is a temporary approval (from modal) or persistent (from button)
    let mut temp = TEMPORARY_APPROVAL.lock().unwrap();
    *temp = temporary;
    println!("[CHAT] TEMPORARY_APPROVAL set to {}", temporary);

    println!("[CHAT] Permissions approved successfully");
    Ok(())
}

#[tauri::command]
pub fn reset_permissions() -> Result<(), String> {
    println!("[CHAT] reset_permissions called");
    let mut status = PERMISSIONS_APPROVED.lock().unwrap();
    println!("[CHAT] Setting PERMISSIONS_APPROVED from {} to false", *status);
    *status = false;

    // Also clear awaiting flag
    let mut awaiting = AWAITING_PERMISSION.lock().unwrap();
    println!("[CHAT] Setting AWAITING_PERMISSION from {} to false", *awaiting);
    *awaiting = false;

    // Clear temporary approval flag
    let mut temp = TEMPORARY_APPROVAL.lock().unwrap();
    println!("[CHAT] Setting TEMPORARY_APPROVAL from {} to false", *temp);
    *temp = false;

    println!("[CHAT] Permissions reset successfully");
    Ok(())
}

/// Set the permission mode (maps 1:1 to CLI --permission-mode flag)
#[tauri::command]
pub fn set_permission_mode(mode: PermissionMode) -> Result<(), String> {
    println!("[CHAT] set_permission_mode called: {:?}", mode);

    let mut current_mode = PERMISSION_MODE.lock().unwrap();
    *current_mode = mode;

    println!("[CHAT] Permission mode set successfully");
    Ok(())
}

/// Get the current permission mode
#[tauri::command]
pub fn get_permission_mode() -> Result<PermissionMode, String> {
    let mode = PERMISSION_MODE.lock().unwrap().clone();
    println!("[CHAT] get_permission_mode called, returning: {:?}", mode);
    Ok(mode)
}

/// Deprecated: Session approval is now handled by CLI internally
#[tauri::command]
pub fn approve_session() -> Result<(), String> {
    println!("[CHAT] approve_session called (deprecated - CLI handles session approval)");
    Ok(())
}

/// Send permission response to Claude CLI via stdin (bidirectional protocol)
#[tauri::command]
pub async fn send_permission_response(
    request_id: String,
    approved: bool,
    updated_permissions: Option<serde_json::Value>,
) -> Result<(), String> {
    println!("[CHAT] send_permission_response: request_id={}, approved={}", request_id, approved);

    // Build control_response JSON in the format CLI expects
    // Structure: {"type": "control_response", "response": {"subtype": "success", "request_id": "...", "response": {...}}}
    // For "allow": response MUST include "updatedInput" (object, not null)
    // For "deny": response MUST include "message" (string)
    let response_inner = if approved {
        serde_json::json!({
            "behavior": "allow",
            "updatedInput": updated_permissions.unwrap_or_else(|| serde_json::json!({}))
        })
    } else {
        serde_json::json!({
            "behavior": "deny",
            "message": "User denied permission"
        })
    };

    let response = serde_json::json!({
        "type": "control_response",
        "response": {
            "subtype": "success",
            "request_id": request_id,
            "response": response_inner
        }
    });

    // Serialize to JSON string
    let json_str = serde_json::to_string(&response)
        .map_err(|e| format!("Failed to serialize control_response: {}", e))?;

    println!("[CHAT] Writing control_response to stdin: {}", json_str);

    // Write to stdin using Tokio mutex (which is Send)
    let mut stdin_opt = PROCESS_STDIN.lock().await;
    let stdin = stdin_opt.as_mut()
        .ok_or_else(|| "No stdin available (process not running)".to_string())?;

    // Write JSON + newline
    stdin.write_all(json_str.as_bytes()).await
        .map_err(|e| format!("Failed to write to stdin: {}", e))?;
    stdin.write_all(b"\n").await
        .map_err(|e| format!("Failed to write newline to stdin: {}", e))?;
    stdin.flush().await
        .map_err(|e| format!("Failed to flush stdin: {}", e))?;

    println!("[CHAT] Control response sent successfully, CLI will continue execution");

    // Clear AWAITING_PERMISSION flag to resume output emission
    {
        let mut awaiting = AWAITING_PERMISSION.lock().unwrap();
        *awaiting = false;
    }

    Ok(())
}

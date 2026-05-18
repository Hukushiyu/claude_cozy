use serde::{Deserialize, Serialize};
use std::process::Stdio;
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command as TokioCommand;
use crate::commands::cli::find_claude_cli;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct StreamEvent {
    pub event_type: String,
    pub content: Option<String>,
    pub tool_name: Option<String>,
    pub thinking_status: Option<String>,
}

lazy_static::lazy_static! {
    static ref CLAUDE_PROCESS: Arc<Mutex<Option<tokio::process::Child>>> = Arc::new(Mutex::new(None));
    static ref PERMISSIONS_APPROVED: Arc<Mutex<bool>> = Arc::new(Mutex::new(false));
    static ref AWAITING_PERMISSION: Arc<Mutex<bool>> = Arc::new(Mutex::new(false));
    static ref TEMPORARY_APPROVAL: Arc<Mutex<bool>> = Arc::new(Mutex::new(false));
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
        "--verbose".to_string(),
        "--model".to_string(),
        model.clone(),
    ];

    // Check if permissions are approved
    let permissions_approved = {
        let status = PERMISSIONS_APPROVED.lock().unwrap();
        println!("[CHAT] Reading PERMISSIONS_APPROVED state: {}", *status);
        *status
    };

    println!("[CHAT] Permissions approved: {}", permissions_approved);

    if permissions_approved {
        println!("[CHAT] Adding --dangerously-skip-permissions flag");
        args.push("--dangerously-skip-permissions".to_string());
    } else {
        println!("[CHAT] NOT adding --dangerously-skip-permissions flag (will prompt on tool use)");
    }

    args.push(message.clone());

    println!("[CHAT] Command: claude {:?}", args);

    // Spawn Claude process
    let claude_path = find_claude_cli();
    println!("[CHAT] Using Claude CLI at: {}", claude_path);
    println!("[CHAT] Spawning Claude CLI process...");
    let mut child = TokioCommand::new(&claude_path)
        .args(&args)
        .current_dir(&project_path)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| {
            let error = format!("Failed to spawn Claude CLI: {}", e);
            println!("[CHAT ERROR] {}", error);
            error
        })?;

    println!("[CHAT] Process spawned successfully");

    // Get stdout handle BEFORE storing child
    let stdout = child.stdout.take().ok_or_else(|| {
        println!("[CHAT ERROR] Failed to capture stdout");
        "Failed to capture stdout".to_string()
    })?;

    // Store process reference
    {
        let mut process = CLAUDE_PROCESS.lock().unwrap();
        *process = Some(child);
    }
    let reader = BufReader::new(stdout);
    let mut lines = reader.lines();

    // Process streaming output
    println!("[CHAT] Starting to read output lines...");
    let mut line_count = 0;
    while let Ok(Some(line)) = lines.next_line().await {
        line_count += 1;
        println!("[CHAT] Received line {}: {}", line_count, line);

        if let Ok(event) = serde_json::from_str::<serde_json::Value>(&line) {
            if let Some(event_type) = event.get("type").and_then(|t| t.as_str()) {
                println!("[CHAT] Event type: {}", event_type);
                match event_type {
                    "assistant" => {
                        // Parse: event.message.content[0]
                        // Content can be text, thinking, or tool_use
                        if let Some(message) = event.get("message") {
                            if let Some(content_array) = message.get("content").and_then(|c| c.as_array()) {
                                // FIRST PASS: Check if content array contains tool_use that needs permission
                                let permissions_approved_now = {
                                    let status = PERMISSIONS_APPROVED.lock().unwrap();
                                    *status
                                };

                                let mut contains_unpermitted_tool = false;
                                if !permissions_approved_now {
                                    for content_item in content_array {
                                        if let Some(content_type) = content_item.get("type").and_then(|t| t.as_str()) {
                                            if content_type == "tool_use" {
                                                contains_unpermitted_tool = true;
                                                println!("[CHAT] Content array contains tool_use and permissions not approved - will suppress output");
                                                break;
                                            }
                                        }
                                    }
                                }

                                // If we found an unpermitted tool, set the flag NOW before processing content
                                if contains_unpermitted_tool {
                                    let mut awaiting = AWAITING_PERMISSION.lock().unwrap();
                                    *awaiting = true;
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
                                                        });
                                                    }
                                                }
                                            }
                                            "tool_use" => {
                                                // Tool use detected - check permissions
                                                if let Some(tool_name) = content_item.get("name").and_then(|n| n.as_str()) {
                                                    println!("[CHAT] Tool use detected: {}", tool_name);

                                                    if contains_unpermitted_tool {
                                                        println!("[CHAT] Permissions not approved - requesting permission");

                                                        let tool_input = content_item.get("input")
                                                            .and_then(|i| serde_json::to_string_pretty(i).ok())
                                                            .unwrap_or_else(|| "{}".to_string());

                                                        let permission_data = serde_json::json!({
                                                            "toolName": tool_name,
                                                            "input": tool_input
                                                        });

                                                        let _ = app.emit("chat:permission-request", permission_data);

                                                        // Kill the current process - it will be retried after approval
                                                        println!("[CHAT] Killing current process (will retry after approval)");
                                                        let child_option = {
                                                            let mut process = CLAUDE_PROCESS.lock().unwrap();
                                                            process.take()
                                                        };

                                                        if let Some(mut child) = child_option {
                                                            println!("[CHAT] Waiting for process to terminate...");
                                                            let _ = child.kill().await;
                                                            println!("[CHAT] Process terminated");
                                                        }

                                                        // Exit this function early - process is killed
                                                        println!("[CHAT] Exiting send_message after permission request");
                                                        return Ok(());
                                                    } else {
                                                        // Permissions approved - emit tool event
                                                        let _ = app.emit("chat:tool", StreamEvent {
                                                            event_type: "tool_use".to_string(),
                                                            content: None,
                                                            tool_name: Some(tool_name.to_string()),
                                                            thinking_status: None,
                                                        });
                                                    }
                                                }
                                            }
                                            "thinking" => {
                                                // Ignore thinking blocks (extended thinking)
                                                println!("[CHAT] Ignoring thinking block");
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
                            let _ = app.emit("chat:result", StreamEvent {
                                event_type: "result".to_string(),
                                content: None,
                                tool_name: None,
                                thinking_status: None,
                            });

                            // Note: We do NOT reset temporary approvals here anymore
                            // Temporary approval means "for this session" not "for one tool use"
                            // It will persist until page reload or manual reset button click
                        }
                    }
                    "system" => {
                        // Handle system events (like rate limits)
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
                                        });
                                    }
                                }
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

use serde::{Deserialize, Serialize};
use std::fs::{self, File};
use std::io::{BufRead, BufReader};
use std::path::{Path, PathBuf};
use std::process::Command;

// Structs for parsing .jsonl transcript format

#[derive(Debug, Deserialize)]
struct TranscriptLine {
    #[serde(rename = "type")]
    entry_type: String,
    message: Option<TranscriptMessage>,
    timestamp: Option<String>,
    uuid: Option<String>,
}

#[derive(Debug, Deserialize)]
struct TranscriptMessage {
    #[allow(dead_code)] // Field exists in .jsonl but we don't need it (we determine role from entry type)
    role: String,
    content: serde_json::Value,
}

#[derive(Debug, Serialize, Clone)]
pub struct DisplayMessage {
    pub role: String, // "user" or "assistant"
    pub content: String,
    pub timestamp: String,
    pub id: String,
}

#[derive(Debug, Serialize)]
pub struct SessionInfo {
    pub session_id: String,
    pub message_count: usize,
    pub first_timestamp: String,
    pub last_timestamp: String,
}

// Path encoding functions

/// Encodes a project path the same way Claude CLI does
/// Example: "C:\Users\name\project" → "C--Users-name-project"
fn encode_project_path(path: &str) -> String {
    let mut result = path.to_string();

    // First, handle the Windows drive letter special case
    // Replace "C:\" or "C:/" with "C--" to avoid triple dashes
    result = result.replace(":\\", "--");
    result = result.replace(":/", "--");

    // Now handle any remaining colons (shouldn't be any, but just in case)
    result = result.replace(":", "--");

    // Replace all path separators, spaces, and periods with single dash
    result = result.replace("\\", "-");
    result = result.replace("/", "-");
    result = result.replace(" ", "-");
    result = result.replace(".", "-");

    // Trim any leading dashes
    result = result.trim_start_matches('-').to_string();

    result
}

/// Gets the Claude CLI projects directory (~/.claude/projects)
fn get_claude_projects_dir() -> Result<PathBuf, String> {
    // Use environment variables instead of dirs crate to enable cross-compilation
    let home = if cfg!(windows) {
        std::env::var("USERPROFILE")
    } else {
        std::env::var("HOME")
    }.map_err(|_| "Cannot find home directory".to_string())?;

    Ok(PathBuf::from(home).join(".claude").join("projects"))
}

/// Gets the project directory for a given project path
fn get_project_dir(project_path: &str) -> Result<PathBuf, String> {
    let encoded = encode_project_path(project_path);
    let projects_dir = get_claude_projects_dir()?;
    Ok(projects_dir.join(encoded))
}

// Message extraction functions

/// Extracts text content from user message
fn extract_user_content(content: &serde_json::Value) -> String {
    match content {
        // Simple string content
        serde_json::Value::String(s) => s.clone(),
        // Array of content blocks (tool results)
        serde_json::Value::Array(blocks) => {
            blocks
                .iter()
                .filter_map(|block| {
                    // Skip tool_result blocks, only show original user text
                    if let Some(obj) = block.as_object() {
                        if obj.get("type")?.as_str()? == "tool_result" {
                            return None;
                        }
                        obj.get("content")?.as_str().map(|s| s.to_string())
                    } else {
                        None
                    }
                })
                .collect::<Vec<_>>()
                .join("\n")
        }
        _ => String::new(),
    }
}

/// Extracts text content from assistant message
fn extract_assistant_text(content: &serde_json::Value) -> String {
    if let serde_json::Value::Array(blocks) = content {
        blocks
            .iter()
            .filter_map(|block| {
                if let Some(obj) = block.as_object() {
                    match obj.get("type")?.as_str()? {
                        "text" => obj.get("text")?.as_str().map(|s| s.to_string()),
                        // Skip thinking blocks and tool_use blocks
                        _ => None,
                    }
                } else {
                    None
                }
            })
            .collect::<Vec<_>>()
            .join("\n\n")
    } else {
        String::new()
    }
}

// Public Tauri commands

/// Lists all sessions for a project
#[tauri::command]
pub fn list_sessions(project_path: String) -> Result<Vec<SessionInfo>, String> {
    let project_dir = get_project_dir(&project_path)?;

    println!("[HISTORY] list_sessions called for: {}", project_path);
    println!("[HISTORY] Looking in directory: {}", project_dir.display());

    if !project_dir.exists() {
        println!("[HISTORY] Project directory does not exist yet");
        return Ok(Vec::new()); // No sessions yet
    }

    let mut sessions = Vec::new();

    // Read all .jsonl files in the project directory
    for entry in fs::read_dir(&project_dir).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();

        // Only process .jsonl files (not subdirectories)
        if path.is_file() && path.extension().and_then(|s| s.to_str()) == Some("jsonl") {
            if let Ok(info) = get_session_info(&path) {
                sessions.push(info);
            }
        }
    }

    // Sort by last timestamp (most recent first)
    sessions.sort_by(|a, b| b.last_timestamp.cmp(&a.last_timestamp));

    println!("[HISTORY] Found {} session(s)", sessions.len());
    for session in &sessions {
        println!("[HISTORY]   - {} ({} messages)", session.session_id, session.message_count);
    }

    Ok(sessions)
}

/// Gets metadata about a session file
fn get_session_info(file_path: &Path) -> Result<SessionInfo, String> {
    let session_id = file_path
        .file_stem()
        .and_then(|s| s.to_str())
        .ok_or("Invalid filename")?
        .to_string();

    let file = File::open(file_path).map_err(|e| e.to_string())?;
    let reader = BufReader::new(file);

    let mut message_count = 0;
    let mut first_timestamp = String::new();
    let mut last_timestamp = String::new();

    for line in reader.lines() {
        let line = line.map_err(|e| e.to_string())?;

        if let Ok(entry) = serde_json::from_str::<TranscriptLine>(&line) {
            // Count user and assistant messages
            if matches!(entry.entry_type.as_str(), "user" | "assistant") {
                message_count += 1;

                if let Some(ts) = entry.timestamp {
                    if first_timestamp.is_empty() {
                        first_timestamp = ts.clone();
                    }
                    last_timestamp = ts;
                }
            }
        }
    }

    Ok(SessionInfo {
        session_id,
        message_count,
        first_timestamp,
        last_timestamp,
    })
}

/// Loads messages from a specific session
#[tauri::command]
pub fn load_session(project_path: String, session_id: String) -> Result<Vec<DisplayMessage>, String> {
    let project_dir = get_project_dir(&project_path)?;
    let session_file = project_dir.join(format!("{}.jsonl", session_id));

    if !session_file.exists() {
        return Err(format!("Session file not found: {}", session_id));
    }

    parse_session(&session_file)
}

/// Loads the most recent session for a project (used on project selection)
#[tauri::command]
pub fn load_current_session(project_path: String) -> Result<Vec<DisplayMessage>, String> {
    let sessions = list_sessions(project_path.clone())?;

    if sessions.is_empty() {
        return Ok(Vec::new());
    }

    // Load the most recent session
    let latest_session = &sessions[0];
    load_session(project_path, latest_session.session_id.clone())
}

/// Parses a session file and extracts display messages
fn parse_session(file_path: &Path) -> Result<Vec<DisplayMessage>, String> {
    let file = File::open(file_path).map_err(|e| e.to_string())?;
    let reader = BufReader::new(file);
    let mut messages = Vec::new();

    for line in reader.lines() {
        let line = line.map_err(|e| e.to_string())?;

        // Parse the JSON line
        let entry: TranscriptLine = match serde_json::from_str(&line) {
            Ok(e) => e,
            Err(_) => continue, // Skip malformed lines
        };

        // Extract user and assistant messages
        match entry.entry_type.as_str() {
            "user" => {
                if let Some(msg) = entry.message {
                    let content = extract_user_content(&msg.content);

                    // Only add non-empty messages
                    if !content.trim().is_empty() {
                        messages.push(DisplayMessage {
                            role: "user".to_string(),
                            content,
                            timestamp: entry.timestamp.unwrap_or_default(),
                            id: entry.uuid.unwrap_or_default(),
                        });
                    }
                }
            }
            "assistant" => {
                if let Some(msg) = entry.message {
                    let content = extract_assistant_text(&msg.content);

                    // Only add non-empty messages
                    if !content.trim().is_empty() {
                        messages.push(DisplayMessage {
                            role: "assistant".to_string(),
                            content,
                            timestamp: entry.timestamp.unwrap_or_default(),
                            id: entry.uuid.unwrap_or_default(),
                        });
                    }
                }
            }
            _ => continue, // Skip metadata events
        }
    }

    Ok(messages)
}

/// Clears all history for a project using claude project purge
#[tauri::command]
pub async fn clear_history(project_path: String) -> Result<String, String> {
    let output = Command::new("claude")
        .args(&["project", "purge", &project_path, "-y"])
        .output()
        .map_err(|e| format!("Failed to execute claude command: {}", e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

/// Deletes a specific session by ID
#[tauri::command]
pub fn delete_session(project_path: String, session_id: String) -> Result<String, String> {
    let project_dir = get_project_dir(&project_path)?;
    let session_file = project_dir.join(format!("{}.jsonl", session_id));

    if !session_file.exists() {
        return Err(format!("Session file not found: {}", session_id));
    }

    fs::remove_file(&session_file).map_err(|e| format!("Failed to delete session: {}", e))?;

    Ok(format!("Session {} deleted successfully", session_id))
}

/// Archives current history before clearing
#[tauri::command]
pub async fn archive_history(project_path: String, archive_name: String) -> Result<String, String> {
    let project_dir = get_project_dir(&project_path)?;

    if !project_dir.exists() {
        return Err("No history to archive".to_string());
    }

    // Create archive directory in project folder
    let project_root = Path::new(&project_path);
    let archive_dir = project_root
        .join(".claude-desktop")
        .join("archives")
        .join(archive_name);

    fs::create_dir_all(&archive_dir).map_err(|e| format!("Failed to create archive directory: {}", e))?;

    // Copy all .jsonl files to archive
    let mut archived_count = 0;
    for entry in fs::read_dir(&project_dir).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();

        if path.is_file() && path.extension().and_then(|s| s.to_str()) == Some("jsonl") {
            let file_name = path.file_name().unwrap();
            let dest = archive_dir.join(file_name);
            fs::copy(&path, &dest).map_err(|e| format!("Failed to copy {}: {}", file_name.to_string_lossy(), e))?;
            archived_count += 1;
        }
    }

    // Now clear the history
    clear_history(project_path).await?;

    Ok(format!("Archived {} session(s) to {}", archived_count, archive_dir.display()))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encode_project_path() {
        assert_eq!(
            encode_project_path("C:\\Users\\name\\project"),
            "C--Users-name-project"
        );
        assert_eq!(
            encode_project_path("C:/Users/name/project"),
            "C--Users-name-project"
        );
        assert_eq!(
            encode_project_path("/home/user/project"),
            "home-user-project"
        );
        // Test with spaces, dots, and mixed separators (real-world example)
        assert_eq!(
            encode_project_path("C:\\Users\\joshua.gates\\Dev Projects\\Claude Terminal Project\\claude-desktop-app\\Tauri Builds"),
            "C--Users-joshua-gates-Dev-Projects-Claude-Terminal-Project-claude-desktop-app-Tauri-Builds"
        );
    }
}

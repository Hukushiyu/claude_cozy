use serde::{Deserialize, Serialize};
use std::process::Command;
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize)]
pub struct ClaudeStatus {
    pub installed: bool,
    pub authenticated: bool,
    pub error: Option<String>,
}

/// Find the Claude CLI executable in common locations
/// Returns the full path or "claude" as fallback
pub fn find_claude_cli() -> String {
    // Common installation paths for Claude CLI
    let possible_paths = vec![
        "/usr/local/bin/claude",
        "/opt/homebrew/bin/claude",
        "/opt/local/bin/claude",
        "~/.local/bin/claude",
        "/usr/bin/claude",
    ];

    // Check each path
    for path_str in possible_paths {
        let path = if path_str.starts_with('~') {
            // Expand ~ to home directory
            if let Ok(home) = std::env::var("HOME") {
                PathBuf::from(path_str.replacen("~", &home, 1))
            } else {
                continue;
            }
        } else {
            PathBuf::from(path_str)
        };

        if path.exists() {
            return path.to_string_lossy().to_string();
        }
    }

    // Fallback to just "claude" and hope it's in PATH
    "claude".to_string()
}

#[tauri::command]
pub fn check_claude_status() -> Result<ClaudeStatus, String> {
    let claude_path = find_claude_cli();

    // Check if Claude CLI is installed
    let version_check = Command::new(&claude_path)
        .arg("--version")
        .output();

    if version_check.is_err() {
        return Ok(ClaudeStatus {
            installed: false,
            authenticated: false,
            error: Some("Claude CLI not found. Please install it first.".to_string()),
        });
    }

    // Check authentication status
    let auth_check = Command::new(&claude_path)
        .args(&["auth", "status", "--output-format", "json"])
        .output();

    match auth_check {
        Ok(output) => {
            let stdout = String::from_utf8_lossy(&output.stdout);
            let stderr = String::from_utf8_lossy(&output.stderr);

            println!("[CLI] Auth check stdout: {}", stdout);
            println!("[CLI] Auth check stderr: {}", stderr);

            // Check if the command succeeded
            if !output.status.success() {
                println!("[CLI] Auth check command failed with status: {:?}", output.status);
                return Ok(ClaudeStatus {
                    installed: true,
                    authenticated: false,
                    error: Some(format!("Auth check failed: {}", stderr)),
                });
            }

            if let Ok(json) = serde_json::from_str::<serde_json::Value>(&stdout) {
                println!("[CLI] Parsed JSON: {:?}", json);
                let authenticated = json.get("authenticated")
                    .and_then(|v| v.as_bool())
                    .unwrap_or(false);

                Ok(ClaudeStatus {
                    installed: true,
                    authenticated,
                    error: if authenticated { None } else { Some("Not authenticated".to_string()) },
                })
            } else {
                println!("[CLI] Failed to parse JSON. Raw output: '{}'", stdout);
                // If we can't parse but the command succeeded, assume authenticated
                // This is more graceful than showing an error when the app works fine
                Ok(ClaudeStatus {
                    installed: true,
                    authenticated: true,
                    error: None,
                })
            }
        }
        Err(e) => Ok(ClaudeStatus {
            installed: true,
            authenticated: false,
            error: Some(format!("Error checking auth status: {}", e)),
        }),
    }
}

#[tauri::command]
pub fn open_terminal_for_auth() -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        Command::new("cmd")
            .args(&["/c", "start", "cmd.exe"])
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    #[cfg(target_os = "macos")]
    {
        Command::new("osascript")
            .args(&["-e", "tell application \"Terminal\" to activate"])
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    #[cfg(target_os = "linux")]
    {
        // Try common terminal emulators
        let terminals = ["gnome-terminal", "konsole", "xterm"];
        let mut success = false;

        for terminal in &terminals {
            if Command::new(terminal).spawn().is_ok() {
                success = true;
                break;
            }
        }

        if !success {
            return Err("Could not open terminal".to_string());
        }
    }

    Ok(())
}

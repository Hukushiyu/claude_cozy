use serde::{Deserialize, Serialize};
use std::process::Command;

#[derive(Debug, Serialize, Deserialize)]
pub struct ClaudeStatus {
    pub installed: bool,
    pub authenticated: bool,
    pub error: Option<String>,
}

#[tauri::command]
pub fn check_claude_status() -> Result<ClaudeStatus, String> {
    // Check if Claude CLI is installed
    let version_check = Command::new("claude")
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
    let auth_check = Command::new("claude")
        .args(&["auth", "status", "--output-format", "json"])
        .output();

    match auth_check {
        Ok(output) => {
            let stdout = String::from_utf8_lossy(&output.stdout);
            
            if let Ok(json) = serde_json::from_str::<serde_json::Value>(&stdout) {
                let authenticated = json.get("authenticated")
                    .and_then(|v| v.as_bool())
                    .unwrap_or(false);

                Ok(ClaudeStatus {
                    installed: true,
                    authenticated,
                    error: if authenticated { None } else { Some("Not authenticated".to_string()) },
                })
            } else {
                Ok(ClaudeStatus {
                    installed: true,
                    authenticated: false,
                    error: Some("Could not parse auth status".to_string()),
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

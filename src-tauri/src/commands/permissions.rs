use serde::{Deserialize, Serialize};
use std::path::PathBuf;

/// Permission modes that map 1:1 with Claude CLI's --permission-mode flag
/// Using exact CLI names for direct pass-through
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum PermissionMode {
    #[serde(rename = "default")]
    Default,              // Ask once per session
    #[serde(rename = "acceptEdits")]
    AcceptEdits,          // Auto-approve file ops, ask for others
    #[serde(rename = "bypassPermissions")]
    BypassPermissions,    // Auto-approve all
    #[serde(rename = "plan")]
    Plan,                 // Read-only mode
    #[serde(rename = "auto")]
    Auto,                 // Claude decides
    #[serde(rename = "dontAsk")]
    DontAsk,              // Deny all
}

#[derive(Serialize, Deserialize)]
struct ProjectPermissions {
    tools_approved: bool,
}

/// Check if tools are approved for a specific project
pub fn check_project_approval(project_path: &str) -> bool {
    let config_path = PathBuf::from(project_path)
        .join(".claude-cozy")
        .join("permissions.json");

    if let Ok(content) = std::fs::read_to_string(&config_path) {
        if let Ok(perms) = serde_json::from_str::<ProjectPermissions>(&content) {
            return perms.tools_approved;
        }
    }

    false
}

/// Save project-specific tool approval setting
pub fn save_project_approval(project_path: &str, approved: bool) -> Result<(), String> {
    let config_dir = PathBuf::from(project_path).join(".claude-cozy");
    std::fs::create_dir_all(&config_dir)
        .map_err(|e| format!("Failed to create config dir: {}", e))?;

    let config_path = config_dir.join("permissions.json");
    let perms = ProjectPermissions {
        tools_approved: approved,
    };
    let json = serde_json::to_string_pretty(&perms)
        .map_err(|e| format!("Failed to serialize: {}", e))?;

    std::fs::write(&config_path, json)
        .map_err(|e| format!("Failed to write config: {}", e))?;

    Ok(())
}

/// Tauri command to set project approval
#[tauri::command]
pub fn set_project_approval(project_path: String, approved: bool) -> Result<(), String> {
    save_project_approval(&project_path, approved)
}

/// Tauri command to check project approval
#[tauri::command]
pub fn get_project_approval(project_path: String) -> Result<bool, String> {
    Ok(check_project_approval(&project_path))
}

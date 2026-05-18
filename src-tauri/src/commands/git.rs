use std::collections::HashMap;
use std::process::Command;

#[tauri::command]
pub fn get_git_status(project_path: String) -> Result<HashMap<String, String>, String> {
    let output = Command::new("git")
        .args(&["status", "--porcelain"])
        .current_dir(&project_path)
        .output()
        .map_err(|e| format!("Failed to run git: {}", e))?;

    if !output.status.success() {
        return Err("Git command failed".to_string());
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut status_map = HashMap::new();

    for line in stdout.lines() {
        if line.len() < 4 {
            continue;
        }

        let status_code = &line[0..2];
        let file_path = line[3..].trim().to_string();

        let status = match status_code.trim() {
            "M" | " M" | "MM" => "M",
            "A" | "AM" => "A",
            "D" | " D" => "D",
            "R" | "RM" => "R",
            "??" => "U",
            _ => continue,
        };

        status_map.insert(file_path, status.to_string());
    }

    Ok(status_map)
}

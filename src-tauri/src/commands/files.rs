use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use ignore::WalkBuilder;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FileNode {
    pub name: String,
    pub path: String,
    pub is_directory: bool,
    pub children: Option<Vec<FileNode>>,
}

#[tauri::command]
pub fn read_file(file_path: String) -> Result<String, String> {
    fs::read_to_string(&file_path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn read_file_base64(file_path: String) -> Result<String, String> {
    use base64::{Engine as _, engine::general_purpose};

    let bytes = fs::read(&file_path).map_err(|e| e.to_string())?;
    Ok(general_purpose::STANDARD.encode(&bytes))
}

#[tauri::command]
pub fn write_file(file_path: String, content: String) -> Result<(), String> {
    fs::write(&file_path, content).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn load_file_tree(path: String) -> Result<Vec<FileNode>, String> {
    let root_path = Path::new(&path);
    
    if !root_path.exists() {
        return Err("Path does not exist".to_string());
    }

    let mut nodes = Vec::new();
    
    // Use ignore crate to respect .gitignore
    let walker = WalkBuilder::new(&path)
        .max_depth(Some(1))
        .hidden(false)
        .git_ignore(true)
        .build();

    for entry in walker {
        match entry {
            Ok(entry) => {
                let entry_path = entry.path();
                
                // Skip the root directory itself
                if entry_path == root_path {
                    continue;
                }

                let file_name = entry_path
                    .file_name()
                    .and_then(|n| n.to_str())
                    .unwrap_or("")
                    .to_string();

                // Skip common patterns
                if should_ignore(&file_name) {
                    continue;
                }

                let is_dir = entry_path.is_dir();
                let relative_path = entry_path
                    .strip_prefix(root_path)
                    .unwrap_or(entry_path)
                    .to_string_lossy()
                    .to_string();

                nodes.push(FileNode {
                    name: file_name,
                    path: relative_path,
                    is_directory: is_dir,
                    children: if is_dir { Some(Vec::new()) } else { None },
                });
            }
            Err(_) => continue,
        }
    }

    // Sort: directories first, then alphabetically
    nodes.sort_by(|a, b| {
        match (a.is_directory, b.is_directory) {
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
            _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
        }
    });

    Ok(nodes)
}

fn should_ignore(name: &str) -> bool {
    let ignore_patterns = [
        "node_modules",
        ".git",
        ".vscode",
        ".idea",
        "dist",
        "build",
        "target",
        ".DS_Store",
        "Thumbs.db",
    ];

    ignore_patterns.contains(&name)
}

#[tauri::command]
pub fn create_file(file_path: String) -> Result<(), String> {
    fs::write(&file_path, "").map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_folder(folder_path: String) -> Result<(), String> {
    fs::create_dir_all(&folder_path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn rename_file(old_path: String, new_path: String) -> Result<(), String> {
    fs::rename(&old_path, &new_path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_file(file_path: String) -> Result<(), String> {
    let path = Path::new(&file_path);
    
    if path.is_dir() {
        fs::remove_dir_all(path).map_err(|e| e.to_string())
    } else {
        fs::remove_file(path).map_err(|e| e.to_string())
    }
}

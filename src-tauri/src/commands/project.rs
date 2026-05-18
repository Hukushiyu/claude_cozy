use tauri_plugin_dialog::DialogExt;

#[tauri::command]
pub async fn select_project(app: tauri::AppHandle) -> Result<Option<String>, String> {
    let file_path = app.dialog()
        .file()
        .set_title("Select Project Folder")
        .blocking_pick_folder();

    match file_path {
        Some(path) => Ok(Some(path.to_string())),
        None => Ok(None)
    }
}

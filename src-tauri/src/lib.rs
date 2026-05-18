// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_shell::init())
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;

        // DevTools can be opened manually with F12 or by adding devtools feature flag
        // Commenting out auto-open to avoid build errors when devtools feature is not enabled
        // let window = app.get_webview_window("main").unwrap();
        // #[cfg(debug_assertions)]
        // window.open_devtools();
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      commands::project::select_project,
      commands::files::read_file,
      commands::files::read_file_base64,
      commands::files::write_file,
      commands::files::load_file_tree,
      commands::files::create_file,
      commands::files::create_folder,
      commands::files::rename_file,
      commands::files::delete_file,
      commands::chat::send_message,
      commands::chat::kill_claude_process,
      commands::chat::get_permission_status,
      commands::chat::approve_permissions,
      commands::chat::reset_permissions,
      commands::history::list_sessions,
      commands::history::load_session,
      commands::history::load_current_session,
      commands::history::clear_history,
      commands::history::archive_history,
      commands::git::get_git_status,
      commands::cli::check_claude_status,
      commands::cli::open_terminal_for_auth,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

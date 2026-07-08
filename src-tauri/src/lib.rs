// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;

use tauri::{Emitter, Manager};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_shell::init())
    .plugin(tauri_plugin_updater::Builder::new().build())
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      // Intercept window close so frontend can prompt about unsaved files
      let window = app.get_webview_window("main").unwrap();
      let window_clone = window.clone();
      window.on_window_event(move |event| {
        if let tauri::WindowEvent::CloseRequested { api, .. } = event {
          println!("[APP] CloseRequested intercepted - preventing default, emitting to frontend");
          api.prevent_close();
          window_clone.emit("app:close-requested", ()).unwrap_or_else(|e| {
            println!("[APP] Failed to emit close-requested: {}", e);
          });
        }
      });

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
      commands::chat::set_permission_mode,
      commands::chat::get_permission_mode,
      commands::chat::approve_session,
      commands::chat::send_permission_response,
      commands::chat::confirm_close,
      commands::permissions::set_project_approval,
      commands::permissions::get_project_approval,
      commands::history::list_sessions,
      commands::history::load_session,
      commands::history::load_current_session,
      commands::history::delete_session,
      commands::history::clear_history,
      commands::history::archive_history,
      commands::git::get_git_status,
      commands::cli::check_claude_status,
      commands::cli::open_terminal_for_auth,
      commands::cli::get_claude_usage,
      commands::skills::list_custom_skills,
      commands::skills::create_custom_skill,
      commands::skills::update_custom_skill,
      commands::skills::delete_custom_skill,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

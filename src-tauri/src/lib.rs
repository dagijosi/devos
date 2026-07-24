mod migrations;

#[tauri::command]
async fn open_terminal() -> Result<(), String> {
  #[cfg(target_os = "windows")]
  {
    std::process::Command::new("cmd")
      .args(["/c", "start", "cmd"])
      .spawn()
      .map_err(|e| format!("Failed to open terminal: {}", e))?;
  }

  #[cfg(target_os = "macos")]
  {
    std::process::Command::new("open")
      .args(["-a", "Terminal"])
      .spawn()
      .map_err(|e| format!("Failed to open terminal: {}", e))?;
  }

  #[cfg(target_os = "linux")]
  {
    std::process::Command::new("x-terminal-emulator")
      .spawn()
      .map_err(|e| format!("Failed to open terminal: {}", e))?;
  }

  Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(
      tauri_plugin_sql::Builder::default()
        .add_migrations("sqlite:developer_os.db", crate::migrations::migrations())
        .build(),
    )
    .plugin(tauri_plugin_shell::init())
    .plugin(tauri_plugin_opener::init())
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_updater::Builder::new().build())
    .invoke_handler(tauri::generate_handler![open_terminal])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

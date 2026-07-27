mod migrations;
mod tray;
mod watcher;
mod context_menu;
mod ipc;

use tauri::{Emitter, Manager};
use tauri_plugin_global_shortcut::GlobalShortcutExt;

fn hosts_path() -> &'static str {
  if cfg!(target_os = "windows") {
    r"C:\Windows\System32\drivers\etc\hosts"
  } else {
    "/etc/hosts"
  }
}

#[tauri::command]
async fn read_hosts_file() -> Result<String, String> {
  let path = hosts_path();
  std::fs::read_to_string(path).map_err(|e| format!("Failed to read hosts file: {}", e))
}

#[tauri::command]
async fn write_hosts_file(content: String) -> Result<(), String> {
  let path = hosts_path();
  std::fs::write(path, &content).map_err(|e| format!("Failed to write hosts file: {}", e))
}

#[tauri::command]
async fn open_terminal() -> Result<(), String> {
  let (program, args): (&str, &[&str]) = if cfg!(target_os = "windows") {
    ("cmd", &["/c", "start", "cmd"] as &[&str])
  } else if cfg!(target_os = "macos") {
    ("open", &["-a", "Terminal"] as &[&str])
  } else {
    ("x-terminal-emulator", &[] as &[&str])
  };
  std::process::Command::new(program)
    .args(args)
    .spawn()
    .map_err(|e| format!("Failed to open terminal: {}", e))?;
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
    .plugin(tauri_plugin_http::init())
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_updater::Builder::new().build())
    .plugin(
      tauri_plugin_global_shortcut::Builder::new()
        .with_handler(move |app, shortcut, event| {
          use tauri_plugin_global_shortcut::ShortcutState;
          if event.state == ShortcutState::Pressed {
            let shortcut_str = shortcut.to_string();
            let _ = app.emit("global-shortcut", shortcut_str);
          }
        })
        .build(),
    )
    .invoke_handler(tauri::generate_handler![
      open_terminal,
      read_hosts_file,
      write_hosts_file,
      watcher::start_watching,
      watcher::stop_watching,
      context_menu::install_context_menu,
      context_menu::uninstall_context_menu,
      context_menu::is_context_menu_installed,
    ])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      // Register global shortcuts
      let shortcuts = [
        "Ctrl+Shift+K",
        "Ctrl+Shift+N",
        "Ctrl+Shift+C",
      ];
      for s in shortcuts {
        if let Err(e) = app.global_shortcut().register(s) {
          log::warn!("Failed to register shortcut {}: {}", s, e);
        }
      }

      // Initialize watcher state
      app.manage(std::sync::Mutex::new(watcher::WatcherState {
        watchers: std::collections::HashMap::new(),
      }));

      // Build system tray
      tray::build_tray(app.handle())?;

      // Start IPC listener for CLI commands
      ipc::start_ipc_listener(app.handle());

      // Auto-install Windows context menu on first run
      if cfg!(target_os = "windows") {
        let installed = app
          .path()
          .app_data_dir()
          .map(|p| p.join(".context_menu_installed"))
          .ok();
        if let Some(marker) = installed {
          if !marker.exists() {
            if let Err(e) = context_menu::install_context_menu() {
              log::warn!("Failed to auto-install context menu: {}", e);
            } else if let Err(e) = std::fs::write(&marker, "1") {
              log::warn!("Failed to write context menu marker: {}", e);
            }
          }
        }
      }

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

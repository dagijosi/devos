mod migrations;

use tauri::Emitter;
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
    .invoke_handler(tauri::generate_handler![open_terminal, read_hosts_file, write_hosts_file])
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

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

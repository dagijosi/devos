use std::collections::HashMap;
use std::sync::Mutex;
use notify::{Config, Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use tauri::{AppHandle, Emitter, Manager};

pub struct WatcherState {
  pub watchers: HashMap<String, RecommendedWatcher>,
}

#[tauri::command]
pub fn start_watching(app: AppHandle, path: String) -> Result<(), String> {
  let app_clone = app.clone();
  let mut watcher = RecommendedWatcher::new(
    move |res: Result<Event, notify::Error>| {
      if let Ok(event) = res {
        if matches!(
          event.kind,
          EventKind::Create(_) | EventKind::Modify(_) | EventKind::Remove(_)
        ) {
          let paths: Vec<String> = event
            .paths
            .iter()
            .filter_map(|p| p.to_str().map(|s| s.to_string()))
            .collect();
          if !paths.is_empty() {
            let _ = app_clone.emit("fs-change", paths);
          }
        }
      }
    },
    Config::default(),
  )
  .map_err(|e| format!("Failed to create watcher: {}", e))?;

  watcher
    .watch(&std::path::Path::new(&path), RecursiveMode::Recursive)
    .map_err(|e| format!("Failed to watch path: {}", e))?;

  let state = app.state::<Mutex<WatcherState>>();
  let mut s = state.lock().map_err(|e| e.to_string())?;
  s.watchers.insert(path, watcher);

  Ok(())
}

#[tauri::command]
pub fn stop_watching(app: AppHandle, path: String) -> Result<(), String> {
  let state = app.state::<Mutex<WatcherState>>();
  let mut s = state.lock().map_err(|e| e.to_string())?;
  s.watchers.remove(&path);
  Ok(())
}

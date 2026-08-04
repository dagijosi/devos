use std::collections::HashMap;
use std::process::Command;
use std::sync::Mutex;
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager};

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

pub struct GitTrackerState {
  pub heads: Mutex<HashMap<String, String>>,
  pub running: Mutex<HashMap<String, bool>>,
}

impl Default for GitTrackerState {
  fn default() -> Self {
    Self {
      heads: Mutex::new(HashMap::new()),
      running: Mutex::new(HashMap::new()),
    }
  }
}

fn git(args: &[&str], cwd: &str) -> Option<String> {
  #[cfg(target_os = "windows")]
  let mut cmd = {
    let mut c = Command::new("git");
    // CREATE_NO_WINDOW: prevents a console window from flashing on each poll
    c.creation_flags(0x08000000);
    c
  };
  #[cfg(not(target_os = "windows"))]
  let mut cmd = Command::new("git");

  let out = cmd.args(args).current_dir(cwd).output().ok()?;
  if !out.status.success() {
    return None;
  }
  Some(String::from_utf8_lossy(&out.stdout).trim().to_string())
}

fn spawn_poller(app: AppHandle, path: String) {
  std::thread::spawn(move || loop {
    {
      let state = app.state::<GitTrackerState>();
      let running = state.running.lock().unwrap();
      if !running.get(&path).copied().unwrap_or(false) {
        break;
      }
    }

    if let Some(head) = git(&["rev-parse", "HEAD"], &path) {
      let state = app.state::<GitTrackerState>();
      let mut heads = state.heads.lock().unwrap();
      if let Some(prev) = heads.get(&path) {
        if prev != &head {
          let new_commits = git(
            &["log", "--format=%h|%s", &format!("{}..{}", prev, head)],
            &path,
          )
          .unwrap_or_default();
          let commits: Vec<String> = new_commits.lines().map(|l| l.to_string()).collect();
          if !commits.is_empty() {
            let _ = app.emit(
              "git-commits",
              serde_json::json!({
                "path": path,
                "commits": commits,
              }),
            );
          }
        }
      }
      heads.insert(path.clone(), head);
    }

    std::thread::sleep(Duration::from_secs(60));
  });
}

#[tauri::command]
pub fn start_git_tracking(app: AppHandle, path: String) -> Result<(), String> {
  let state = app.state::<GitTrackerState>();
  {
    let mut running = state.running.lock().unwrap();
    if running.get(&path).copied().unwrap_or(false) {
      return Ok(());
    }
    running.insert(path.clone(), true);
  }

  if let Some(head) = git(&["rev-parse", "HEAD"], &path) {
    state.heads.lock().unwrap().insert(path.clone(), head);
  }

  spawn_poller(app, path);
  Ok(())
}

#[tauri::command]
pub fn stop_git_tracking(app: AppHandle, path: String) -> Result<(), String> {
  let state = app.state::<GitTrackerState>();
  state.running.lock().unwrap().insert(path, false);
  Ok(())
}

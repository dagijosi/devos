use std::sync::Mutex;
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager};

pub struct IpcState {
    last_content: Mutex<Option<String>>,
}

impl IpcState {
    pub fn new() -> Self {
        Self {
            last_content: Mutex::new(None),
        }
    }
}

pub fn start_ipc_listener(app: &AppHandle) {
    let handle = app.clone();
    let ipc_path = std::env::temp_dir().join("devos_ipc.json");

    app.manage(IpcState::new());

    // Process any pending IPC file on startup
    if let Ok(content) = std::fs::read_to_string(&ipc_path) {
        let trimmed = content.trim().to_string();
        if !trimmed.is_empty() {
            let _ = handle.emit("ipc-command", &trimmed);
            let _ = std::fs::write(&ipc_path, "");
            if let Some(state) = handle.try_state::<IpcState>() {
                if let Ok(mut last) = state.last_content.lock() {
                    *last = Some(trimmed);
                }
            }
        }
    }

    // Poll the IPC file every second for new commands
    std::thread::spawn(move || {
        loop {
            std::thread::sleep(Duration::from_secs(1));
            if let Ok(content) = std::fs::read_to_string(&ipc_path) {
                let trimmed = content.trim().to_string();
                if trimmed.is_empty() {
                    continue;
                }
                let handle = handle.clone();
                if let Some(state) = handle.try_state::<IpcState>() {
                    if let Ok(mut last) = state.last_content.lock() {
                        if last.as_deref() != Some(&trimmed) {
                            *last = Some(trimmed.clone());
                            let _ = handle.emit("ipc-command", &trimmed);
                            let _ = std::fs::write(&ipc_path, "");
                        }
                    }
                }
            }
        }
    });
}

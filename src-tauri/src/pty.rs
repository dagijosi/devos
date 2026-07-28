use portable_pty::{Child, CommandBuilder, NativePtySystem, PtySize, PtySystem};
use std::collections::HashMap;
use std::io::{Read, Write};
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter};

pub struct PtyState {
    next_id: Mutex<u64>,
    sessions: Mutex<HashMap<String, Arc<PtySession>>>,
}

struct PtySession {
    child: Mutex<Option<Box<dyn Child + Send + Sync>>>,
    writer: Mutex<Box<dyn Write + Send>>,
}

impl Default for PtyState {
    fn default() -> Self {
        Self {
            next_id: Mutex::new(0),
            sessions: Mutex::new(HashMap::new()),
        }
    }
}

#[tauri::command]
pub async fn create_pty(
    app: AppHandle,
    state: tauri::State<'_, PtyState>,
    cwd: Option<String>,
) -> Result<serde_json::Value, String> {
    let pty_system = NativePtySystem::default();
    let pair = pty_system
        .openpty(PtySize {
            rows: 24,
            cols: 80,
            pixel_width: 0,
            pixel_height: 0,
        })
        .map_err(|e| format!("Failed to create PTY: {}", e))?;

    let (shell, arg) = if cfg!(target_os = "windows") {
        ("powershell", "-NoLogo")
    } else {
        ("bash", "--login")
    };

    let mut cmd = CommandBuilder::new(shell);
    cmd.arg(arg);
    if let Some(ref cwd) = cwd {
        cmd.cwd(cwd);
    }

    let child = pair
        .slave
        .spawn_command(cmd)
        .map_err(|e| format!("Failed to spawn shell: {}", e))?;

    let reader = pair
        .master
        .try_clone_reader()
        .map_err(|e| format!("Failed to get reader: {}", e))?;
    let writer = pair
        .master
        .take_writer()
        .map_err(|e| format!("Failed to get writer: {}", e))?;

    let mut next_id = state.next_id.lock().map_err(|e| e.to_string())?;
    *next_id += 1;
    let id = format!("pty-{}", next_id);
    drop(next_id);

    let session = Arc::new(PtySession {
        child: Mutex::new(Some(child)),
        writer: Mutex::new(writer),
    });

    let sid = id.clone();
    let ah = app.clone();
    let sess = session.clone();
    std::thread::spawn(move || {
        let mut buf = [0u8; 65536];
        let mut reader = reader;
        loop {
            match reader.read(&mut buf) {
                Ok(0) | Err(_) => break,
                Ok(n) => {
                    let data = String::from_utf8_lossy(&buf[..n]).to_string();
                    let _ = ah.emit(
                        "pty-output",
                        serde_json::json!({
                            "session_id": sid,
                            "data": data,
                        }),
                    );
                }
            }
        }
        let _ = ah.emit(
            "pty-exit",
            serde_json::json!({
                "session_id": sid,
            }),
        );
        if let Ok(mut child) = sess.child.lock() {
            if let Some(ref mut c) = *child {
                let _ = c.kill();
                let _ = c.wait();
            }
        }
    });

    state
        .sessions
        .lock()
        .map_err(|e| e.to_string())?
        .insert(id.clone(), session);

    Ok(serde_json::json!({ "session_id": id }))
}

#[tauri::command]
pub async fn write_pty(
    state: tauri::State<'_, PtyState>,
    session_id: String,
    data: String,
) -> Result<(), String> {
    let sessions = state.sessions.lock().map_err(|e| e.to_string())?;
    let session = sessions
        .get(&session_id)
        .ok_or_else(|| "PTY session not found".to_string())?;
    let mut writer = session.writer.lock().map_err(|e| e.to_string())?;
    writer
        .write_all(data.as_bytes())
        .map_err(|e| format!("Write error: {}", e))?;
    writer
        .flush()
        .map_err(|e| format!("Flush error: {}", e))?;
    Ok(())
}

#[tauri::command]
pub async fn resize_pty(
    state: tauri::State<'_, PtyState>,
    session_id: String,
    _cols: u16,
    _rows: u16,
) -> Result<(), String> {
    let _sessions = state.sessions.lock().map_err(|e| e.to_string())?;
    _sessions
        .get(&session_id)
        .ok_or_else(|| "PTY session not found".to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn close_pty(
    state: tauri::State<'_, PtyState>,
    session_id: String,
) -> Result<(), String> {
    let mut sessions = state.sessions.lock().map_err(|e| e.to_string())?;
    if let Some(session) = sessions.remove(&session_id) {
        if let Ok(mut child) = session.child.lock() {
            if let Some(ref mut c) = *child {
                let _ = c.kill();
                let _ = c.wait();
            }
            *child = None;
        }
    }
    Ok(())
}

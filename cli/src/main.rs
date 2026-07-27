use clap::{Parser, Subcommand};
use serde::Serialize;
use std::process::Command as ProcessCmd;

#[derive(Parser)]
#[command(name = "devos-cli", about = "CLI tool for controlling DevOS")]
struct Cli {
    #[command(subcommand)]
    action: Action,
}

#[derive(Subcommand)]
enum Action {
    /// Open DevOS (optionally with a project path)
    Open {
        /// Path to project to open
        path: Option<String>,
    },
    /// Open a new terminal window
    Terminal,
    /// Open the clipboard manager
    Clipboard,
    /// Trigger a search
    Search {
        /// Search query
        query: Option<String>,
    },
    /// Show DevOS status
    Status,
}

#[derive(Serialize)]
struct IpcMessage {
    action: String,
    payload: String,
}

fn ipc_path() -> std::path::PathBuf {
    std::env::temp_dir().join("devos_ipc.json")
}

fn is_devos_running() -> bool {
    let output = ProcessCmd::new("tasklist")
        .args(["/FI", "IMAGENAME eq DevOS.exe", "/NH"])
        .output();
    match output {
        Ok(out) => {
            let s = String::from_utf8_lossy(&out.stdout);
            s.contains("DevOS.exe")
        }
        Err(_) => false,
    }
}

fn send_ipc(action: &str, payload: &str) -> Result<(), String> {
    let msg = IpcMessage {
        action: action.to_string(),
        payload: payload.to_string(),
    };
    let json = serde_json::to_string(&msg)
        .map_err(|e| format!("serialization failed: {}", e))?;
    std::fs::write(ipc_path(), &json)
        .map_err(|e| format!("write failed: {}", e))
}

fn launch_devos() -> Result<(), String> {
    let candidates = [
        r"C:\Program Files\DevOS\DevOS.exe",
        r"C:\Program Files (x86)\DevOS\DevOS.exe",
    ];
    for path in &candidates {
        if std::path::Path::new(path).exists() {
            ProcessCmd::new(path)
                .spawn()
                .map_err(|e| format!("launch failed: {}", e))?;
            return Ok(());
        }
    }
    Err("DevOS executable not found in Program Files".into())
}

fn main() {
    let cli = Cli::parse();

    match cli.action {
        Action::Open { path } => {
            let running = is_devos_running();
            if !running {
                if let Some(p) = &path {
                    let _ = send_ipc("open", p);
                }
                launch_devos().unwrap_or_else(|e| {
                    eprintln!("Error: {e}");
                    std::process::exit(1);
                });
                println!("Launching DevOS...");
            } else if let Some(p) = path {
                send_ipc("open", &p).unwrap_or_else(|e| {
                    eprintln!("Error: {e}");
                    std::process::exit(1);
                });
                println!("Opened project: {p}");
            } else {
                send_ipc("focus", "").unwrap_or_else(|e| {
                    eprintln!("Error: {e}");
                    std::process::exit(1);
                });
                println!("Focused DevOS window");
            }
        }
        Action::Terminal => {
            if !is_devos_running() {
                launch_devos().unwrap_or_else(|e| {
                    eprintln!("Error: {e}");
                    std::process::exit(1);
                });
                println!("Launching DevOS...");
            }
            send_ipc("terminal", "").unwrap_or_else(|e| {
                eprintln!("Error: {e}");
                std::process::exit(1);
            });
            println!("Opening terminal");
        }
        Action::Clipboard => {
            if !is_devos_running() {
                launch_devos().unwrap_or_else(|e| {
                    eprintln!("Error: {e}");
                    std::process::exit(1);
                });
                println!("Launching DevOS...");
            }
            send_ipc("clipboard", "").unwrap_or_else(|e| {
                eprintln!("Error: {e}");
                std::process::exit(1);
            });
            println!("Opening clipboard manager");
        }
        Action::Search { query } => {
            if !is_devos_running() {
                launch_devos().unwrap_or_else(|e| {
                    eprintln!("Error: {e}");
                    std::process::exit(1);
                });
                println!("Launching DevOS...");
            }
            let payload = query.unwrap_or_default();
            send_ipc("search", &payload).unwrap_or_else(|e| {
                eprintln!("Error: {e}");
                std::process::exit(1);
            });
            if payload.is_empty() {
                println!("Opening search");
            } else {
                println!("Searching: {payload}");
            }
        }
        Action::Status => {
            if is_devos_running() {
                println!("DevOS: Running");
            } else {
                println!("DevOS: Not running");
            }
        }
    }
}

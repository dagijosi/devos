use serde::Serialize;
use std::path::{Path, PathBuf};

#[derive(Serialize, Clone)]
pub struct EditorInfo {
  pub id: String,
  pub name: String,
  pub program: String,
  pub is_script: bool,
}

fn which(exe: &str) -> Option<PathBuf> {
  let path = std::env::var_os("PATH")?;
  for dir in std::env::split_paths(&path) {
    let names: Vec<String> = if cfg!(target_os = "windows") {
      vec![
        format!("{}.exe", exe),
        format!("{}.cmd", exe),
        format!("{}.bat", exe),
        exe.to_string(),
      ]
    } else {
      vec![exe.to_string()]
    };
    for name in names {
      let full = dir.join(&name);
      if full.is_file() {
        return Some(full);
      }
    }
  }
  None
}

fn is_script(p: &Path) -> bool {
  matches!(
    p.extension().and_then(|e| e.to_str()),
    Some("cmd" | "bat" | "ps1")
  )
}

fn resolve(cli: &str, bases: &[PathBuf], exe_names: &[&str]) -> Option<PathBuf> {
  if let Some(p) = which(cli) {
    return Some(p);
  }
  for base in bases {
    for name in exe_names {
      let direct = base.join(name);
      if direct.is_file() {
        return Some(direct);
      }
    }
  }
  None
}

fn scan_bin_tree(base: &Path, exe: &str) -> Option<PathBuf> {
  let direct = base.join("bin").join(exe);
  if direct.is_file() {
    return Some(direct);
  }
  let entries = std::fs::read_dir(base).ok()?;
  for entry in entries.flatten() {
    let p = entry.path();
    if !p.is_dir() {
      continue;
    }
    let cand = p.join("bin").join(exe);
    if cand.is_file() {
      return Some(cand);
    }
    if let Ok(sub) = std::fs::read_dir(&p) {
      for s in sub.flatten() {
        let sp = s.path();
        if sp.is_dir() {
          let deep = sp.join("bin").join(exe);
          if deep.is_file() {
            return Some(deep);
          }
        }
      }
    }
  }
  None
}

fn push_if_found(
  out: &mut Vec<EditorInfo>,
  id: &str,
  name: &str,
  cli: &str,
  bases: &[PathBuf],
  exe_names: &[&str],
) {
  if let Some(p) = resolve(cli, bases, exe_names) {
    out.push(EditorInfo {
      id: id.into(),
      name: name.into(),
      program: p.to_string_lossy().into_owned(),
      is_script: is_script(&p),
    });
  }
}

fn push_jetbrains(out: &mut Vec<EditorInfo>, product: &str, exe: &str) {
  let pf = std::env::var_os("ProgramFiles").map(PathBuf::from);
  let la = std::env::var_os("LOCALAPPDATA").map(PathBuf::from);
  let bases: Vec<PathBuf> = [
    pf.as_ref().map(|b| b.join("JetBrains")),
    la.as_ref().map(|b| b.join("JetBrains").join("Toolbox").join("apps")),
  ]
  .into_iter()
  .flatten()
  .collect();
  for base in &bases {
    if let Some(p) = scan_bin_tree(base, exe) {
      out.push(EditorInfo {
        id: product.to_string(),
        name: product.to_string(),
        program: p.to_string_lossy().into_owned(),
        is_script: false,
      });
      return;
    }
  }
}

fn collect_bases(opts: &[Option<PathBuf>]) -> Vec<PathBuf> {
  opts.iter().flatten().cloned().collect()
}

#[tauri::command]
pub fn detect_editors() -> Vec<EditorInfo> {
  let mut out: Vec<EditorInfo> = Vec::new();

  let pf = std::env::var_os("ProgramFiles").map(PathBuf::from);
  let pf86 = std::env::var_os("ProgramFiles(x86)").map(PathBuf::from);
  let la = std::env::var_os("LOCALAPPDATA").map(PathBuf::from);

  let pf_vscode = pf.as_ref().map(|b| b.join("Microsoft VS Code"));
  let la_vscode = la.as_ref().map(|b| b.join("Programs").join("Microsoft VS Code"));
  let pf_vscode_ins = pf.as_ref().map(|b| b.join("Microsoft VS Code Insiders"));
  let la_vscode_ins = la.as_ref().map(|b| b.join("Programs").join("Microsoft VS Code Insiders"));
  let la_cursor = la.as_ref().map(|b| b.join("Programs").join("cursor"));
  let la_cursor2 = la.as_ref().map(|b| b.join("Programs").join("Cursor"));
  let la_windsurf = la.as_ref().map(|b| b.join("Programs").join("windsurf"));
  let la_windsurf2 = la.as_ref().map(|b| b.join("Programs").join("Windsurf"));
  let la_zed = la.as_ref().map(|b| b.join("Programs").join("Zed"));
  let la_zed2 = la.as_ref().map(|b| b.join("Programs").join("zed"));
  let pf_subl = pf.as_ref().map(|b| b.join("Sublime Text"));
  let la_subl = la.as_ref().map(|b| b.join("Programs").join("Sublime Text"));
  let pf_npp = pf.as_ref().map(|b| b.join("Notepad++"));
  let pf86_npp = pf86.as_ref().map(|b| b.join("Notepad++"));

  if cfg!(target_os = "windows") {
    push_if_found(
      &mut out,
      "vscode",
      "VS Code",
      "code",
      &collect_bases(&[pf_vscode.clone(), la_vscode.clone()]),
      &["Code.exe"],
    );
    push_if_found(
      &mut out,
      "vscode-insiders",
      "VS Code Insiders",
      "code-insiders",
      &collect_bases(&[pf_vscode_ins.clone(), la_vscode_ins.clone()]),
      &["Code - Insiders.exe"],
    );
    push_if_found(
      &mut out,
      "cursor",
      "Cursor",
      "cursor",
      &collect_bases(&[la_cursor.clone(), la_cursor2.clone()]),
      &["Cursor.exe"],
    );
    push_if_found(
      &mut out,
      "windsurf",
      "Windsurf",
      "windsurf",
      &collect_bases(&[la_windsurf.clone(), la_windsurf2.clone()]),
      &["Windsurf.exe"],
    );
    push_if_found(
      &mut out,
      "zed",
      "Zed",
      "zed",
      &collect_bases(&[la_zed.clone(), la_zed2.clone()]),
      &["zed.exe"],
    );
    push_if_found(
      &mut out,
      "sublime",
      "Sublime Text",
      "subl",
      &collect_bases(&[pf_subl.clone(), la_subl.clone()]),
      &["sublime_text.exe"],
    );
    push_if_found(
      &mut out,
      "notepadpp",
      "Notepad++",
      "notepad++",
      &collect_bases(&[pf_npp.clone(), pf86_npp.clone()]),
      &["notepad++.exe"],
    );
    push_jetbrains(&mut out, "WebStorm", "webstorm64.exe");
    push_jetbrains(&mut out, "IntelliJ IDEA", "idea64.exe");
    push_jetbrains(&mut out, "PyCharm", "pycharm64.exe");
    push_jetbrains(&mut out, "GoLand", "goland64.exe");
    push_jetbrains(&mut out, "CLion", "clion64.exe");
    push_jetbrains(&mut out, "PhpStorm", "phpstorm64.exe");
    push_jetbrains(&mut out, "RubyMine", "rubymine64.exe");
  } else {
    // macOS / Linux: rely on CLIs on PATH
    for (id, name, cli) in [
      ("vscode", "VS Code", "code"),
      ("vscode-insiders", "VS Code Insiders", "code-insiders"),
      ("cursor", "Cursor", "cursor"),
      ("windsurf", "Windsurf", "windsurf"),
      ("zed", "Zed", "zed"),
      ("sublime", "Sublime Text", "subl"),
      ("nvim", "Neovim", "nvim"),
      ("gvim", "Vim (GUI)", "gvim"),
      ("codex", "Codex", "codex"),
    ] {
      if let Some(p) = which(cli) {
        out.push(EditorInfo {
          id: id.into(),
          name: name.into(),
          program: p.to_string_lossy().into_owned(),
          is_script: is_script(&p),
        });
      }
    }
  }

  out
}

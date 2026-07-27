#[tauri::command]
pub fn install_context_menu() -> Result<(), String> {
  #[cfg(target_os = "windows")]
  {
    use winreg::enums::*;
    use winreg::RegKey;

    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let (key, _) = hkcu
      .create_subkey("Software\\Classes\\Directory\\Background\\shell\\DevOS")
      .map_err(|e| format!("Failed to create registry key: {}", e))?;
    key.set_value("", &"Open with DevOS")
      .map_err(|e| format!("Failed to set default value: {}", e))?;
    key.set_value("Icon", &std::env::current_exe().unwrap_or_default().to_string_lossy().to_string())
      .map_err(|e| format!("Failed to set icon: {}", e))?;

    let (cmd_key, _) = key
      .create_subkey("command")
      .map_err(|e| format!("Failed to create command key: {}", e))?;
    let exe = std::env::current_exe().unwrap_or_default();
    cmd_key
      .set_value("", &format!("\"{}\" \"%V\"", exe.display()))
      .map_err(|e| format!("Failed to set command: {}", e))?;
  }

  Ok(())
}

#[tauri::command]
pub fn uninstall_context_menu() -> Result<(), String> {
  #[cfg(target_os = "windows")]
  {
    use winreg::enums::*;
    use winreg::RegKey;

    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let result = hkcu.delete_subkey_all("Software\\Classes\\Directory\\Background\\shell\\DevOS");
    if let Err(e) = result {
      if e.kind() != std::io::ErrorKind::NotFound {
        return Err(format!("Failed to uninstall context menu: {}", e));
      }
    }
  }

  Ok(())
}

#[tauri::command]
pub fn is_context_menu_installed() -> Result<bool, String> {
  #[cfg(target_os = "windows")]
  {
    use winreg::enums::*;
    use winreg::RegKey;

    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    match hkcu.open_subkey("Software\\Classes\\Directory\\Background\\shell\\DevOS") {
      Ok(_) => return Ok(true),
      Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Ok(false),
      Err(e) => return Err(format!("Failed to check registry: {}", e)),
    }
  }

  #[cfg(not(target_os = "windows"))]
  {
    Ok(false)
  }
}

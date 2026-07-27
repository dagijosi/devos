use tauri::{
  AppHandle, Emitter, Manager,
  tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
  menu::{Menu, MenuItem, PredefinedMenuItem},
};

pub fn build_tray(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
  let open = MenuItem::with_id(app, "open", "Open DevOS", true, None::<&str>)?;
  let terminal = MenuItem::with_id(app, "terminal", "New Terminal", true, None::<&str>)?;
  let clipboard = MenuItem::with_id(app, "clipboard", "Clipboard", true, None::<&str>)?;
  let search = MenuItem::with_id(app, "search", "Quick Search", true, None::<&str>)?;
  let separator = PredefinedMenuItem::separator(app)?;
  let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;

  let menu = Menu::with_items(app, &[&open, &terminal, &clipboard, &search, &separator, &quit])?;

  TrayIconBuilder::new()
    .icon(app.default_window_icon().unwrap().clone())
    .menu(&menu)
    .tooltip("DevOS")
    .on_menu_event(|app, event| {
      match event.id.as_ref() {
        "open" => {
          if let Some(window) = app.get_webview_window("main") {
            let _ = window.show();
            let _ = window.set_focus();
          }
        }
        "terminal" => {
          let _ = app.emit("tray-action", "terminal");
          if let Some(window) = app.get_webview_window("main") {
            let _ = window.show();
            let _ = window.set_focus();
          }
        }
        "clipboard" => {
          let _ = app.emit("tray-action", "clipboard");
          if let Some(window) = app.get_webview_window("main") {
            let _ = window.show();
            let _ = window.set_focus();
          }
        }
        "search" => {
          let _ = app.emit("tray-action", "search");
          if let Some(window) = app.get_webview_window("main") {
            let _ = window.show();
            let _ = window.set_focus();
          }
        }
        "quit" => {
          app.exit(0);
        }
        _ => {}
      }
    })
    .on_tray_icon_event(|tray, event| {
      if let TrayIconEvent::Click {
        button: MouseButton::Left,
        button_state: MouseButtonState::Up,
        ..
      } = event
      {
        let app = tray.app_handle();
        if let Some(window) = app.get_webview_window("main") {
          let _ = window.show();
          let _ = window.set_focus();
        }
      }
    })
    .build(app)?;

  Ok(())
}

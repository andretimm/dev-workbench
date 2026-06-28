use tauri::{
    menu::{IsMenuItem, Menu, MenuBuilder, MenuItemBuilder, PredefinedMenuItem, SubmenuBuilder},
    tray::{MouseButton, MouseButtonState, TrayIcon, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager,
};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};
use tauri_plugin_positioner::{Position, WindowExt};
use tauri_plugin_updater::UpdaterExt;

use md5::{Digest, Md5};

#[tauri::command]
fn md5_hash(input: String) -> String {
    let mut hasher = Md5::new();
    hasher.update(input.as_bytes());
    format!("{:x}", hasher.finalize())
}

#[tauri::command]
fn set_global_shortcut(
    app: tauri::AppHandle,
    old: Option<String>,
    new: String,
) -> Result<(), String> {
    if let Some(old_shortcut) = old {
        let _ = app.global_shortcut().unregister(old_shortcut.as_str());
    }
    app.global_shortcut()
        .register(new.as_str())
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn rebuild_tray_menu(app: tauri::AppHandle, pinned: Vec<(String, String)>) -> Result<(), String> {
    let open_item = MenuItemBuilder::with_id("open", "Open Dev Workbench")
        .build(&app)
        .map_err(|e| e.to_string())?;
    let tool_items: Vec<_> = pinned
        .iter()
        .map(|(id, label)| {
            MenuItemBuilder::with_id(format!("tool:{id}"), label.clone()).build(&app)
        })
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    let sep1 = PredefinedMenuItem::separator(&app).map_err(|e| e.to_string())?;
    let settings_item = MenuItemBuilder::with_id("settings", "Settings…")
        .build(&app)
        .map_err(|e| e.to_string())?;
    let sep2 = PredefinedMenuItem::separator(&app).map_err(|e| e.to_string())?;
    let quit_item = MenuItemBuilder::with_id("quit", "Quit Dev Workbench")
        .build(&app)
        .map_err(|e| e.to_string())?;

    let mut refs: Vec<&dyn IsMenuItem<tauri::Wry>> = vec![&open_item];
    for item in &tool_items {
        refs.push(item);
    }
    refs.push(&sep1);
    refs.push(&settings_item);
    refs.push(&sep2);
    refs.push(&quit_item);

    let menu = MenuBuilder::new(&app)
        .items(&refs)
        .build()
        .map_err(|e| e.to_string())?;
    let tray = app.state::<TrayIcon>();
    tray.set_menu(Some(menu)).map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg(target_os = "macos")]
fn activate_app() {
    use objc2::MainThreadMarker;
    use objc2_app_kit::NSApplication;

    if let Some(mtm) = MainThreadMarker::new() {
        NSApplication::sharedApplication(mtm).activate();
    }
}

#[cfg(not(target_os = "macos"))]
fn activate_app() {}

fn show_and_focus_window(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        activate_app();
        let _ = window.as_ref().window().move_window(Position::TrayCenter);
        let _ = window.show();
        let _ = window.set_focus();
        let _ = app.emit("window-shown", ());
    }
}

fn toggle_window(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        if window.is_visible().unwrap_or(false) {
            let _ = window.hide();
        } else {
            show_and_focus_window(app);
        }
    }
}

fn toggle_window_show(app: &tauri::AppHandle) {
    show_and_focus_window(app);
}

#[tauri::command]
async fn check_update(app: tauri::AppHandle) -> Result<Option<String>, String> {
    let updater = app.updater().map_err(|e| e.to_string())?;
    match updater.check().await.map_err(|e| e.to_string())? {
        Some(update) => Ok(Some(update.version.clone())),
        None => Ok(None),
    }
}

#[tauri::command]
async fn install_update(app: tauri::AppHandle) -> Result<(), String> {
    let updater = app.updater().map_err(|e| e.to_string())?;
    match updater.check().await.map_err(|e| e.to_string())? {
        Some(update) => {
            update
                .download_and_install(|_downloaded, _total| {}, || {})
                .await
                .map_err(|e| e.to_string())?;
            app.restart();
        }
        None => {}
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .plugin(tauri_plugin_store::Builder::new().build())
        .enable_macos_default_menu(false)
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, _shortcut, event| {
                    if event.state == ShortcutState::Pressed {
                        toggle_window(app);
                    }
                })
                .build(),
        )
        .plugin(tauri_plugin_positioner::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            md5_hash,
            set_global_shortcut,
            rebuild_tray_menu,
            check_update,
            install_update
        ])
        .setup(|app| {
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            #[cfg(target_os = "macos")]
            {
                let close_window_item = MenuItemBuilder::with_id("close-window", "Close Window")
                    .accelerator("CmdOrCtrl+W")
                    .build(app)?;
                let file_menu = SubmenuBuilder::new(app, "File")
                    .item(&close_window_item)
                    .build()?;
                let edit_menu = SubmenuBuilder::new(app, "Edit")
                    .undo()
                    .redo()
                    .separator()
                    .cut()
                    .copy()
                    .paste()
                    .select_all()
                    .build()?;
                let app_menu = Menu::new(app)?;
                app_menu.append(&file_menu)?;
                app_menu.append(&edit_menu)?;
                app.set_menu(app_menu)?;

                if let Some(window) = app.get_webview_window("main") {
                    let window_clone = window.clone();
                    window.on_menu_event(move |_window, event| {
                        if event.id().as_ref() == "close-window" {
                            let _ = window_clone.hide();
                        }
                    });
                }
            }

            app.global_shortcut().register("CmdOrCtrl+Shift+Space")?;

            let open_item = MenuItemBuilder::with_id("open", "Open Dev Workbench").build(app)?;
            let json_item =
                MenuItemBuilder::with_id("tool:json-formatter", "JSON Formatter").build(app)?;
            let base64_item = MenuItemBuilder::with_id("tool:base64", "Base64").build(app)?;
            let jwt_item =
                MenuItemBuilder::with_id("tool:jwt-decoder", "JWT Decoder").build(app)?;
            let timestamp_item =
                MenuItemBuilder::with_id("tool:timestamp", "Timestamp Converter").build(app)?;
            let separator1 = PredefinedMenuItem::separator(app)?;
            let settings_item = MenuItemBuilder::with_id("settings", "Settings…").build(app)?;
            let separator2 = PredefinedMenuItem::separator(app)?;
            let quit_item = MenuItemBuilder::with_id("quit", "Quit Dev Workbench").build(app)?;

            let menu = MenuBuilder::new(app)
                .items(&[
                    &open_item,
                    &json_item,
                    &base64_item,
                    &jwt_item,
                    &timestamp_item,
                    &separator1,
                    &settings_item,
                    &separator2,
                    &quit_item,
                ])
                .build()?;

            let tray = TrayIconBuilder::new()
                .icon(tauri::image::Image::from_bytes(
                    include_bytes!("../icons/tray-icon.png"),
                )?)
                .icon_as_template(true)
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id().as_ref() {
                    "open" => toggle_window_show(app),
                    "settings" => {
                        toggle_window_show(app);
                        let _ = app.emit("tray-select-tool", "settings");
                    }
                    "quit" => app.exit(0),
                    id if id.starts_with("tool:") => {
                        toggle_window_show(app);
                        let _ = app.emit("tray-select-tool", id.trim_start_matches("tool:"));
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    tauri_plugin_positioner::on_tray_event(tray.app_handle(), &event);
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        toggle_window(tray.app_handle());
                    }
                })
                .build(app)?;

            app.manage(tray);

            if let Some(window) = app.get_webview_window("main") {
                let window_clone = window.clone();
                window.on_window_event(move |event| {
                    if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                        api.prevent_close();
                        let _ = window_clone.hide();
                    }
                });

                #[cfg(target_os = "macos")]
                {
                    use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial};
                    let _ =
                        apply_vibrancy(&window, NSVisualEffectMaterial::Popover, None, Some(12.0));
                }
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn md5_of_known_string() {
        assert_eq!(
            md5_hash("hello".to_string()),
            "5d41402abc4b2a76b9719d911017c592"
        );
    }

    #[test]
    fn md5_of_empty_string() {
        assert_eq!(md5_hash("".to_string()), "d41d8cd98f00b204e9800998ecf8427e");
    }
}

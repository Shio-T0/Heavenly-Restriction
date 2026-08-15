use serde;
use ::computer_controler::{DayList, ExecList, Time};
use std::{sync::Mutex, thread, time::Duration, collections::HashSet};
use tauri::Manager;
use chrono::Local;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      let handle = app.handle().clone();
      thread::spawn(move || loop {
          {
              let state = handle.state::<Mutex<DayList>>();
              let mut daylist = state.lock().unwrap();
              match daylist.tick(Local::now().time()) {
                  Ok(fired) => for id in fired {
                      use tauri::Emitter;
                      let _ = handle.emit("Session Started", id.to_string());
                  }
                  Err(e) => log::error!("[Error] scheduler tick failed_ {e}"),
              }
          }
          thread::sleep(Duration::from_secs(1));
      });
      Ok(())
    })

    .manage(Mutex::new(DayList::new()))
    .invoke_handler(tauri::generate_handler![set_sessions])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}


#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionConfig {
    id: String,
    commands: Vec<String>,
    start_minutes: u32,
    is_blocking: bool,
}

#[tauri::command]
fn set_sessions(sessions: Vec<SessionConfig>, daylist: tauri::State<'_, Mutex<DayList>>) -> Result<(), String> {
    let mut daylist = daylist.lock().map_err(|e| e.to_string())?;
    let ids: HashSet<String> = sessions.iter().map(|config| config.id.clone()).collect();
    
    daylist.update_available(ids);

    for config in sessions {
        daylist.replace(config.id, ExecList::from_lines(config.commands), Time(config.start_minutes), config.is_blocking);
    }


    Ok(())
    
}


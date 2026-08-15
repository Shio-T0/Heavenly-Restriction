use chrono::NaiveTime;
use std::{collections::HashSet, io};

mod session;
mod exec_list;
mod program;

pub use session::{Session, Time};
pub use exec_list::ExecList;
pub use program::Program;

pub struct DayList {
    sessions: Vec<Session>,
}
impl DayList {
    /// Creates a new DayList instance
    pub fn new() -> DayList {
        DayList {
            sessions: Vec::new(),
        }
    }
    /// Creates a new DayList instance with predefined job list
    ///
    /// `sessions` is a reference to a list that contains Session instances
    ///
    /// # Panics
    ///
    /// if you used Session::new within this function, that one might panic
    pub fn from(sessions: &[Session]) -> DayList {
        let mut r = DayList {
            sessions: sessions.to_vec(),
        };
        r.update_durations();
        r
    }
    /// Adds a new Session to the front of DayList's Job list
    pub fn push(&mut self, session: Session) {
        self.sessions.push(session);
        self.update_durations();
    }
    pub fn replace<S, T>(&mut self, id: S, exec_list: ExecList, start_time: T, is_blocking: bool) 
    where 
        S: Into<String>,
        T: Into<NaiveTime>,
    {
        let id = id.into();
        for session in self.sessions.iter_mut() {
            if session.id == id {
                session.update(exec_list, start_time, is_blocking);
                self.update_durations();
                return;
            }
        }
        self.sessions.push(Session::new(id, exec_list, start_time, is_blocking));
        self.update_durations();

        
    }
    pub fn update_available(&mut self, ids: HashSet<String>) {
        self.sessions.retain(|session| ids.contains(&session.id));
    }
    fn update_durations(&mut self) {
        if self.sessions.len() == 1 {
            return;
        }
        self.sessions.sort_by_key(|session| session.start_time);
        for i in 1..self.sessions.len() {
            let delta = self.sessions[i].start_time - self.sessions[i - 1].start_time;
            self.sessions[i - 1].duration = delta;
        }
    }
    /// Starts the DayList
    ///
    /// Iterates over the Sessions inside this DayList instance and executes them
    ///
    /// # Return
    ///
    /// `start` returns an io::Error if an error occurs, otherwise, returns a ()
    pub fn tick(&mut self, now: NaiveTime) -> io::Result<Vec<NaiveTime>> {
        let mut fired = Vec::new();
        for session in self.sessions.iter_mut() {
            if session.is_within_runtime(now) {
                if session.ensure_started()? {
                    fired.push(session.start_time);
                }
            }
            else {
                session.mark_stopped();
            }
        }
        Ok(fired)
        
    }
}


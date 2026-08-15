
use crate::{io, exec_list::ExecList};
use chrono::{NaiveTime, TimeDelta, Timelike};

#[derive(Clone, Debug)]
pub struct Session {
    pub id: String,
    execs: ExecList,
    pub start_time: NaiveTime,
    pub is_blocking: bool,
    pub duration: TimeDelta,
    running: bool
}

impl Session {
    /// Creates a new Session instance
    ///
    /// `execs` is a ExecList of the processes you want to execute during this Session
    /// `start_time` is an NaiveTime (of the chrono crate) of the moment the Session start
    /// `is_blocking` bool that determines if you want for the computer to only focus on this job
    /// during its time (be careful with this one).
    ///
    /// # Panics
    ///
    /// `new` panics when `process_args` is empty
    pub fn new<S, T>(id: S, execs: ExecList, start_time: T, is_blocking: bool) -> Session 
    where 
        S: Into<String>,
        T: Into<NaiveTime>, 
    {
        assert!(execs.len() > 0);
        let start_time = start_time.into();
        let mut duration = TimeDelta::minutes(30);

        if start_time.num_seconds_from_midnight() + duration.num_seconds() as u32 >= 60*60*24 {
            duration = TimeDelta::seconds((60*60*24 - start_time.num_seconds_from_midnight()).into());
        }

        Session {
            id: id.into(),
            execs,
            start_time,
            is_blocking,
            duration,
            running: false,
        }
    }
    pub fn update<T: Into<NaiveTime>>(&mut self, execs: ExecList, start_time: T, is_blocking: bool) {
        self.execs = execs;
        self.start_time = start_time.into();
        self.is_blocking = is_blocking;
        
    }
    pub fn ensure_started(&mut self) -> io::Result<bool> {
        if self.running {return Ok(false)}
        self.execs.exectute_processes()?;
        self.running = true;
        Ok(true)
    }
    pub fn mark_stopped(&mut self) { self.running = false; }

    pub fn is_within_runtime(&self, current_time: NaiveTime) -> bool {
        let expected_finish_time = self.start_time + self.duration;
        self.start_time <= current_time && current_time < expected_finish_time
    }
}
pub struct Time(pub u32);
impl Into<NaiveTime> for Time {
    fn into(self) -> NaiveTime {
        NaiveTime::from_num_seconds_from_midnight_opt(self.0*60, 0).expect("Invalid minute from midnight")
    }


}



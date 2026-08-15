use std::io;

use crate::program::Program;

#[derive(Clone, Debug)]
pub struct ExecList {
    processes: Vec<Program>
}
impl ExecList {
    /// Creates a new ExecList instance
    pub fn new() -> ExecList {
        ExecList {
            processes: Vec::new(),
        }
    }
    /// Creates a new ExecList instance from a list of the commands
    ///
    /// `commands` implements Iterator over Vec<&str>
    /// # Panics
    /// 
    /// `from_command_list` panics if `commands` is empty
    pub fn from_lines<L: IntoIterator<Item = String>>(lines: L) -> ExecList {
        let processes: Vec<Program> = lines.into_iter()
            .filter_map(|s| {
                let mut parts = shlex::split(&s)?.into_iter();
                let name = parts.next()?;
                Some(Program::new(name, parts))
            }).collect();
        assert!(!processes.is_empty());
        ExecList {
            processes
        }
        
        
    }

    /// Adds Program list to the ExecList
    ///
    /// `processes` is the list of programs you want to push
    pub fn push_programs(&mut self, processes: &[Program]) {
        for p in processes {
            self.processes.push(p.to_owned());
        }
    }
    pub fn len(&self) -> usize {
        self.processes.len()
        
    }
    pub fn exectute_processes(&self) -> io::Result<()> {
        for p in self.processes.clone() {
            p.execute()?;
        }
        Ok(())
    }
    
}
impl Iterator for ExecList {
    type Item = Program;
    fn next(&mut self) -> Option<Self::Item> {
        self.processes.iter().next().cloned()
    }
}

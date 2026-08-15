use std::{process::Command, io};


#[derive(Clone, Debug)]
pub struct Program {
    name: String,
    args: Vec<String>
}
impl Program {
    /// Creates a new Program instance
    pub fn new<N, A, S>(name: N, args: A) -> Program 
    where 
        N: Into<String>,
        A: IntoIterator<Item = S>,
        S: Into<String>,
    {

        Program {
            name: name.into(),
            args: args.into_iter().map(|arg| arg.into()).collect(),
        }
        
    }
    pub fn execute(&self) -> io::Result<()> {
        Command::new(self.name.clone())
            .args(self.args.clone())
            .spawn()?;
        Ok(())
        
    }
    
}

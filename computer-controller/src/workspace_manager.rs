use crate::ExecList;
use std::io;

mod workspace;
mod socket_handler;

use workspace::Workspace;
use socket_handler as socket;


pub struct WorkspaceManager {
    before: Workspace,
    after: Workspace
}
impl WorkspaceManager {
    /// Go to sandbox Workspace
    fn go_to_next_workspace() {
        socket::setup_start();
        
        // Enter Sandbox
        let enter_sandbox = ["desktop", "-f", "11"];
    }
    /// Cleanly return to inicial Workspace
    fn return_to_incial_workspace() {

        
    }
    /// Setup the sandbox workspace
    ///
    /// set up the sandbox workspace while keeping a save of the inicial.
    ///
    /// # Returns
    ///
    /// `setup_new_workspace` returns a io::Result of the manager used to control both workspaces.
    pub fn setup_new_workspace(exec_list: ExecList) -> io::Result<WorkspaceManager> {
        let sandboxed_order: Vec<String> = vec!["11","12","13","14","15","16","1","2","3","4","5","6"].iter_mut().map(|s| s.to_string()).collect();
        let inicial_workspace = Workspace::save_current_state()?;


        Ok({
            WorkspaceManager {
                before: inicial_workspace,
                after: Workspace {
                    order: sandboxed_order,
                    focused: None,
                    program_list: exec_list,
                }
            }
        })
    }
}



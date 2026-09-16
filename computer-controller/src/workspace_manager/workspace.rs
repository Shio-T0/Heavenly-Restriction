
use crate::workspace_manager::socket_handler as socket;
use std::io;

mod desktop;
use desktop::Desktop;

enum CleanupType {
    Keep,
    Move,
    Hide,
    Destroy,
}

pub struct Workspace {
    order: Vec<String>,
    focused: Desktop,
    desktops: Vec<Desktop>,
    cleanup_type: CleanupType,
}
impl Workspace {
    pub fn save_current_state(cleanup_type: CleanupType) -> io::Result<Workspace> {
        // Maybe make one function for each in socket?
        let order = socket::try_send_to_socket(&["query", "-D", "--names"])?.split('\n').map(|name| name.to_string()).collect();

        let desktops = Desktop::get_windowed()?;
        let focused = Desktop::get_current_in_focus()?;


        Ok(Workspace {
            order,
            focused,
            desktops,
            cleanup_type
        })

    }
    pub fn new_custom(order: &[&str], focused: Option<&str>) -> Workspace {
        todo!()
        
        
    }
    
}

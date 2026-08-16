
use crate::workspace_manager::socket_handler as socket;
use std::io;

struct Node {
    id: u32,
}
impl Node {
    fn get_from_desktop(desktop: &str) -> io::Result<Vec<Node>> {
        
    }
}

enum Cleanup {
    Keep,
    Move,
    Hide,
    Destroy,
    
}

pub struct Workspace {
    order: Vec<String>,
    focused: Option<String>,
    nodes: Vec<Node>,
    cleanup_type: Cleanup,
}
impl Workspace {
    pub fn save_current_state() -> io::Result<Workspace> {
        // Maybe make one function for each in socket?
        let order = socket::try_send_to_socket(&["query", "-D", "--names"])?;
        let focused = socket::try_send_to_socket(&["query", "-D", "-d", "focused", "--names"])?;
        let available_desktops = socket::get_windowed_desktops()?;
        let nodes = available_desktops.iter().map(|desktop| socket::try_send_to_socket(""));
        Ok(Workspace {
            order,
            focused,

        })

    }
    pub fn new_custom(order: &[&str], focused: Option<&str>) -> Workspace {
        
        
    }
    
}

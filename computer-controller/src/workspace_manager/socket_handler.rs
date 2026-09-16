
use std::{io::{self, Read, Write}, thread::{self, JoinHandle}, env, net::Shutdown, os::unix::net::UnixStream};

pub fn get_windowed_desktops() -> io::Result<Vec<String>> {
    Ok(try_send_to_socket(&["query", "-D", "-d", ".occupied"])?.split('\n').map(|s| s.to_string()).collect::<Vec<_>>())
}

pub fn setup_start() -> io::Result<()> {
    // Add and reorder Environment
    let add_desktops = ["monitor", "eDP", "--add-desktops", "11", "12", "13", "14", "15", "16"];
    let reorder_desktops = ["monitor", "eDP", "--reorder-desktops", "11","12","13","14","15","16","1","2","3","4","5","6"];

    let _ = try_send_to_socket(&add_desktops)?;
    let _ = try_send_to_socket(&reorder_desktops)?;
    Ok(())
}
pub fn try_send_to_socket(args: &[&str]) -> io::Result<String>{
    let mut sock = UnixStream::connect(try_get_socket_path()?)?;
    let mut buf = Vec::new();
    for a in args {
        buf.extend_from_slice(a.as_bytes());
        buf.push(0u8);
    }
    sock.write_all(&buf)?;
    sock.shutdown(Shutdown::Write)?;

    let mut s = String::new();
    sock.read_to_string(&mut s)?;
    Ok(s)
    
}
fn try_get_socket_path() -> io::Result<String> {
    let bspwm_socket_var = "BSPWM_SOCKET";
    let display_var = "DISPLAY";
    match env::var(bspwm_socket_var) {
        Ok(val) => Ok(val),
        Err(_) => match env::var(display_var) {
            Ok(val) => {
                let (host, display, screen) = get_display_args(&val);
                Ok(format!("/tmp/bspwm{}_{}_{}-socket", host, display, screen))
            },
            Err(_) => Ok("/tmp/bspwm_0_0-socket".to_string()),
        },
        
    }
}
fn get_display_args(s: &str) -> (&str, &str, &str) {
    let mut args: Vec<&str> = s.split(|c: char| [':', '.'].contains(&c)).collect();
    if s.chars().nth(0).unwrap() == ':' {
        args.insert(0, "");
    }
    if args[1] == "" {
        args[1] = "0";
    }
    println!("args: {:#?}", args);


    let (host, display, screen) = (args[0], args[1], args[2]);

    (host, display, screen)
    
}
fn bspc_keep_subscribed() -> io::Result<JoinHandle<io::Result<()>>> {
    let mut sock = UnixStream::connect(try_get_socket_path()?)?;
    sock.write_all("subscribe\0".as_bytes())?;

    let handle = thread::spawn(move || -> io::Result<()> { loop {
        let mut s = String::new();
        sock.read_to_string(&mut s)?;
    }});
    
    Ok(handle)
}

// Returns io::ErrorKind::InvalidData in canse from_str_radix does not work
pub fn parse_id(id: &str) -> io::Result<u32> {
    let id = u32::from_str_radix(id, 16);
    match id {
        Ok(id) => Ok(id),
        Err(e) =>  return Err(io::Error::new(io::ErrorKind::InvalidData, e)),
    }

}


#[cfg(test)]
mod test {
    use crate::workspace_manager::socket_handler::{get_display_args, try_get_socket_path, try_send_to_socket};
    #[test]
    fn verify_display_args() {
        assert_eq!(get_display_args("user:0.0"), ("user", "0", "0"));
    }
    #[test]
    fn verify_socket_name() {
        assert_eq!(try_get_socket_path().unwrap(), "/tmp/bspwm_0_0-socket".to_string());
    }
    #[test]
    fn get_socket_response() {
        assert_eq!(try_send_to_socket(&["query", "-D", "--names"]).unwrap(), "1\n2\n3\n4\n5\n6\n".to_string());
    }

}



//! On macOS the system asks for the Bluetooth permission in the name of the program that uses
//! Bluetooth, and ends a program that has no `NSBluetoothAlwaysUsageDescription`. A program
//! started from a terminal borrows the terminal's description, but one started by launchd has
//! only its own, so the property list is embedded in the executable.

use std::path::PathBuf;
use std::{env, fs};

fn main() {
    println!("cargo:rerun-if-changed=Info.plist.in");
    if env::var("CARGO_CFG_TARGET_OS").as_deref() != Ok("macos") {
        return;
    }
    let template = fs::read_to_string("Info.plist.in").expect("Info.plist.in");
    let version = env::var("CARGO_PKG_VERSION").expect("CARGO_PKG_VERSION");
    let plist = PathBuf::from(env::var("OUT_DIR").expect("OUT_DIR")).join("Info.plist");
    fs::write(&plist, template.replace("@VERSION@", &version)).expect("write Info.plist");
    println!(
        "cargo:rustc-link-arg-bins=-Wl,-sectcreate,__TEXT,__info_plist,{}",
        plist.display()
    );
}

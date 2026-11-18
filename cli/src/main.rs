mod csv;
mod meter;
mod protocol;
mod sink;

use btleplug::api::{CentralEvent, Peripheral as _};
use clap::{Parser, Subcommand};
use futures::{FutureExt, StreamExt};
use meter::{Events, Found};
use sink::Sink;
use std::collections::HashSet;
use std::io::{ErrorKind, IsTerminal};
use std::process::ExitCode;
use std::time::Duration;
use tokio::sync::watch;
use tokio::time::{sleep, timeout};

/// Records the readings of a Bluetooth USB / DC / AC meter (J7-C, ATorch UD18 and look-alikes)
/// to a CSV file. It makes no network connections.
#[derive(Parser)]
#[command(version)]
struct Cli {
    #[command(subcommand)]
    command: Command,
}

#[derive(Subcommand)]
enum Command {
    /// List the meters in range
    Scan {
        /// List every Bluetooth device, not only meters
        #[arg(long)]
        all: bool,
        /// How long to listen
        #[arg(long, default_value_t = 8)]
        seconds: u64,
    },
    /// Record the readings until stopped with Ctrl+C or SIGTERM
    Record {
        /// The meter to record: its Bluetooth name or its address (as `scan` shows them).
        /// Without it, the first meter heard is recorded.
        #[arg(long)]
        device: Option<String>,
        /// The CSV file to append to, or `-` for standard output. Without it, a new file
        /// `usbmeter-<date>.csv` in the current directory.
        #[arg(long)]
        out: Option<String>,
    },
}

/// A meter that streams a report every second and is silent this long has lost the link
const SILENCE: Duration = Duration::from_secs(10);
/// How long to wait for a meter that is gone to be heard again before trying to connect anyway
const RETRY: Duration = Duration::from_secs(10);

#[tokio::main]
async fn main() -> ExitCode {
    let cli = Cli::parse();
    let result = match cli.command {
        Command::Scan { all, seconds } => scan(all, seconds).await,
        Command::Record { device, out } => {
            let (stop, shutdown) = watch::channel(false);
            tokio::spawn(async move {
                wait_for_stop().await;
                let _ = stop.send(true);
            });
            record(device, out, shutdown).await
        }
    };
    match result {
        Ok(()) => ExitCode::SUCCESS,
        Err(error) => {
            if error
                .downcast_ref::<std::io::Error>()
                .is_some_and(|e| e.kind() == ErrorKind::BrokenPipe)
            {
                return ExitCode::SUCCESS;
            }
            eprintln!("usbmeter: {error}");
            ExitCode::FAILURE
        }
    }
}

#[cfg(unix)]
async fn wait_for_stop() {
    use tokio::signal::unix::{signal, SignalKind};
    let (Ok(mut term), Ok(mut int)) = (
        signal(SignalKind::terminate()),
        signal(SignalKind::interrupt()),
    ) else {
        return;
    };
    tokio::select! {
        _ = term.recv() => {}
        _ = int.recv() => {}
    }
}

#[cfg(not(unix))]
async fn wait_for_stop() {
    let _ = tokio::signal::ctrl_c().await;
}

async fn scan(all: bool, seconds: u64) -> meter::Result<()> {
    let adapter = meter::adapter().await?;
    meter::start_scan(&adapter).await?;
    sleep(Duration::from_secs(seconds)).await;
    let mut devices = meter::in_range(&adapter).await;
    devices.retain(|d| all || d.meter);
    devices.sort_by_key(|d| std::cmp::Reverse(d.rssi.unwrap_or(i16::MIN)));
    if devices.is_empty() {
        eprintln!(
            "No meter heard in {seconds} s. A J7-C advertises only just after it is powered on: unplug it and plug it in again, then scan. `--all` lists every device."
        );
        return Ok(());
    }
    for d in &devices {
        println!(
            "{:<24} {:<36} {:>8}{}",
            d.shown_name(),
            d.address,
            d.rssi
                .map_or_else(|| "-".to_string(), |r| format!("{r} dBm")),
            if all && d.meter { "  meter" } else { "" }
        );
    }
    Ok(())
}

enum Ended {
    Shutdown,
    Lost(&'static str),
}

async fn record(
    device: Option<String>,
    out: Option<String>,
    mut shutdown: watch::Receiver<bool>,
) -> meter::Result<()> {
    let out = out.unwrap_or_else(|| {
        format!(
            "usbmeter-{}.csv",
            csv::iso_time(sink::now_ms())
                .replace(['-', ':'], "")
                .replace(".000Z", "Z")
                .split('.')
                .next()
                .unwrap_or("")
        )
    });
    let to_terminal = std::io::stdout().is_terminal();
    let live = std::io::stderr().is_terminal() && !(out == "-" && to_terminal);
    let mut sink = Sink::open(&out, live).map_err(|e| format!("cannot open {out}: {e}"))?;

    let adapter = meter::adapter().await?;
    let mut events = meter::events(&adapter).await?;
    meter::start_scan(&adapter).await?;
    sink.note(&format!(
        "recording to {}; waiting for a meter",
        if out == "-" { "standard output" } else { &out }
    ));

    let mut target: Option<btleplug::platform::PeripheralId> = None;
    // devices that could not be connected to, before the first connection: not tried again
    // until every other candidate has been tried
    let mut failed: HashSet<btleplug::platform::PeripheralId> = HashSet::new();
    let mut last_error = String::new();
    loop {
        let Some(found) = wait_for_meter(
            &adapter,
            &mut events,
            device.as_deref(),
            target.as_ref(),
            &mut failed,
            &mut shutdown,
        )
        .await
        else {
            break;
        };
        // some controllers connect much more slowly while they scan
        meter::stop_scan(&adapter).await;
        let link = tokio::select! {
            link = meter::connect(&found.peripheral) => link,
            _ = shutdown.changed() => {
                meter::close(&found.peripheral).await;
                break;
            }
        };
        let link = match link {
            Ok(link) => link,
            Err(error) => {
                meter::start_scan(&adapter).await?;
                failed.insert(found.id.clone());
                let error = error.to_string();
                if error != last_error {
                    sink.note(&format!(
                        "could not connect to {}: {error}",
                        found.describe()
                    ));
                    last_error = error;
                }
                tokio::select! {
                    _ = sleep(Duration::from_secs(2)) => {}
                    _ = shutdown.changed() => break,
                }
                continue;
            }
        };
        last_error.clear();
        target = Some(found.id.clone());
        sink.note(&format!("connected to {}", found.describe()));
        let ended = stream(&link, &found, &mut events, &mut sink, &mut shutdown).await;
        meter::close(&link.peripheral).await;
        meter::start_scan(&adapter).await?;
        match ended {
            Ok(Ended::Shutdown) => break,
            Ok(Ended::Lost(why)) => sink.note(&format!(
                "lost {} ({why}); waiting for it to advertise again. A J7-C advertises only just after it is powered on: if it does not come back, unplug it and plug it in again",
                found.describe()
            )),
            Err(error) => return Err(error),
        }
    }
    sink.finish();
    sink.note("stopped");
    Ok(())
}

/// Finds the meter to record. Before the first connection that is the first meter in range that
/// matches `--device`; after that it is always the same one, once it is heard again (or after
/// `RETRY`, for systems that do not report every advertisement). None when stopped.
async fn wait_for_meter(
    adapter: &btleplug::platform::Adapter,
    events: &mut Events,
    device: Option<&str>,
    target: Option<&btleplug::platform::PeripheralId>,
    failed: &mut HashSet<btleplug::platform::PeripheralId>,
    shutdown: &mut watch::Receiver<bool>,
) -> Option<Found> {
    if let Some(id) = target {
        loop {
            let wait = async {
                while let Some(event) = events.next().await {
                    if meter::heard(&event, id) {
                        return;
                    }
                }
                sleep(RETRY).await; // the event stream ended: do not spin
            };
            tokio::select! {
                _ = shutdown.changed() => return None,
                _ = timeout(RETRY, wait) => {}
            }
            // the system forgets a device that has not been heard for a few minutes
            if let Some(found) = meter::found(adapter, id).await {
                return Some(found);
            }
        }
    }
    loop {
        let mut candidates: Vec<Found> = meter::in_range(adapter)
            .await
            .into_iter()
            .filter(|d| match device {
                Some(wanted) => {
                    meter::matches_wanted(wanted, d.name.as_deref(), &d.address, &d.id.to_string())
                }
                None => d.meter,
            })
            .collect();
        if !candidates.is_empty() && candidates.iter().all(|d| failed.contains(&d.id)) {
            failed.clear();
        }
        candidates.retain(|d| !failed.contains(&d.id));
        candidates.sort_by_key(|d| {
            (
                !d.serial_service,
                std::cmp::Reverse(d.rssi.unwrap_or(i16::MIN)),
            )
        });
        if let Some(first) = candidates.into_iter().next() {
            return Some(first);
        }
        tokio::select! {
            _ = shutdown.changed() => return None,
            _ = sleep(Duration::from_secs(1)) => {}
        }
        // keep the event queue from growing while nobody reads it
        while let Some(Some(_)) = events.next().now_or_never() {}
    }
}

/// Reads the notifications of a connected meter into the sink until the link is lost
async fn stream(
    link: &meter::Link,
    found: &Found,
    events: &mut Events,
    sink: &mut Sink,
    shutdown: &mut watch::Receiver<bool>,
) -> meter::Result<Ended> {
    let mut notifications = meter::notifications(link).await?;
    let mut reports = protocol::ReportStream::default();
    loop {
        tokio::select! {
            _ = shutdown.changed() => return Ok(Ended::Shutdown),
            chunk = timeout(SILENCE, notifications.next()) => match chunk {
                Ok(Some(bytes)) => {
                    for reading in reports.push(&bytes) {
                        sink.record(&reading)?;
                    }
                }
                Ok(None) => return Ok(Ended::Lost("the link ended")),
                Err(_) => return Ok(Ended::Lost("no report for 10 s")),
            },
            event = events.next() => match event {
                // an event can be left over from an earlier link to the same meter, so ask
                Some(CentralEvent::DeviceDisconnected(id))
                    if id == found.id && !link.peripheral.is_connected().await.unwrap_or(false) =>
                {
                    return Ok(Ended::Lost("the meter disconnected"));
                }
                Some(_) => {}
                None => return Err("the Bluetooth event stream ended".into()),
            },
        }
    }
}

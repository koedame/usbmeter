//! Finding a meter and reading its notifications over Bluetooth Low Energy.
//! The same meters, services and name prefixes as `src/bluetooth.ts` of the web page.

use btleplug::api::{
    Central, CentralEvent, CharPropFlags, Characteristic, Manager as _, Peripheral as _,
    PeripheralProperties, ScanFilter,
};
use btleplug::platform::{Adapter, Manager, Peripheral, PeripheralId};
use futures::stream::StreamExt;
use std::collections::BTreeSet;
use std::pin::Pin;
use std::time::Duration;
use uuid::Uuid;

pub type Error = Box<dyn std::error::Error + Send + Sync>;
pub type Result<T> = std::result::Result<T, Error>;
pub type Events = Pin<Box<dyn futures::Stream<Item = CentralEvent> + Send>>;

const fn short_uuid(short: u16) -> Uuid {
    Uuid::from_u128(((short as u128) << 96) | 0x0000_1000_8000_0080_5f9b_34fb)
}

/// The serial-over-BLE services meters use, in the order they are tried
const SERVICES: [Uuid; 3] = [
    short_uuid(0xffe0),
    short_uuid(0xfff0),
    Uuid::from_u128(0x6e400001_b5a3_f393_e0a9_e50e24dcca9e), // Nordic UART
];

/// How the Bluetooth name of a known meter starts. A J7-C calls itself UC96_BLE; ATorch meters
/// use the model name, as in UD18-BLE, AT24-BLE or DL24M_BLE.
const NAME_PREFIXES: [&str; 8] = [
    "UC96", "UD18", "UD24", "AT24", "AT3010", "DT24", "DT3010", "DL24",
];

/// How long a meter that was picked has to open the link and start streaming
pub const CONNECT_TIMEOUT: Duration = Duration::from_secs(20);

pub fn known_meter_name(name: &str) -> bool {
    NAME_PREFIXES.iter().any(|prefix| name.starts_with(prefix))
}

/// Whether a device is listed as a meter: it advertises the serial service, or its name starts
/// like a known meter (the filter of the web page's device picker)
pub fn is_meter(name: Option<&str>, services: &[Uuid]) -> bool {
    services.contains(&SERVICES[0]) || name.is_some_and(known_meter_name)
}

/// What `--device` can name: the Bluetooth name, or the address (or the id, where the system
/// hides addresses)
pub fn matches_wanted(wanted: &str, name: Option<&str>, address: &str, id: &str) -> bool {
    name == Some(wanted) || address.eq_ignore_ascii_case(wanted) || id.eq_ignore_ascii_case(wanted)
}

/// A device that is in range
#[derive(Clone)]
pub struct Found {
    pub peripheral: Peripheral,
    pub id: PeripheralId,
    pub name: Option<String>,
    pub address: String,
    pub rssi: Option<i16>,
    pub meter: bool,
    /// advertises the serial service: a meter that does is a better pick than one that only
    /// has the right name (a J7-C also lists itself under the name `UC96_SPP` for classic Bluetooth)
    pub serial_service: bool,
}

impl Found {
    pub fn describe(&self) -> String {
        format!(
            "{} ({})",
            self.name.as_deref().unwrap_or("(no name)"),
            self.address
        )
    }
}

fn address_of(props: &PeripheralProperties, id: &PeripheralId) -> String {
    // macOS does not tell the address of a device: the address is all zeros and the id is the handle
    let address = props.address.to_string();
    if props.address == Default::default() {
        id.to_string()
    } else {
        address
    }
}

pub async fn adapter() -> Result<Adapter> {
    let manager = Manager::new().await?;
    manager
        .adapters()
        .await?
        .into_iter()
        .next()
        .ok_or_else(|| "no Bluetooth adapter found".into())
}

pub async fn start_scan(adapter: &Adapter) -> Result<()> {
    adapter.start_scan(ScanFilter::default()).await?;
    Ok(())
}

pub async fn stop_scan(adapter: &Adapter) {
    let _ = adapter.stop_scan().await;
}

pub async fn events(adapter: &Adapter) -> Result<Events> {
    Ok(adapter.events().await?)
}

pub async fn found(adapter: &Adapter, id: &PeripheralId) -> Option<Found> {
    let peripheral = adapter.peripheral(id).await.ok()?;
    let props = peripheral.properties().await.ok()??;
    let name = props
        .local_name
        .clone()
        .or(props.advertisement_name.clone());
    Some(Found {
        meter: is_meter(name.as_deref(), &props.services),
        serial_service: props.services.contains(&SERVICES[0]),
        address: address_of(&props, id),
        rssi: props.rssi,
        name,
        id: id.clone(),
        peripheral,
    })
}

/// Everything in range right now
pub async fn in_range(adapter: &Adapter) -> Vec<Found> {
    let mut all = Vec::new();
    for peripheral in adapter.peripherals().await.unwrap_or_default() {
        if let Some(found) = found(adapter, &peripheral.id()).await {
            all.push(found);
        }
    }
    all
}

/// Whether an event says that the device `id` was heard advertising
pub fn heard(event: &CentralEvent, id: &PeripheralId) -> bool {
    match event {
        CentralEvent::DeviceDiscovered(heard)
        | CentralEvent::DeviceUpdated(heard)
        | CentralEvent::ManufacturerDataAdvertisement { id: heard, .. }
        | CentralEvent::ServiceDataAdvertisement { id: heard, .. }
        | CentralEvent::ServicesAdvertisement { id: heard, .. }
        | CentralEvent::RssiUpdate { id: heard, .. } => heard == id,
        _ => false,
    }
}

/// The characteristic the readings arrive on: the first service of `SERVICES` that has one that
/// notifies, and in it `ffe1` when it is there. `(service, characteristic, notifies)` for each.
pub fn pick_notify(found: &[(Uuid, Uuid, bool)]) -> Option<(Uuid, Uuid)> {
    for service in SERVICES {
        let notifying: Vec<Uuid> = found
            .iter()
            .filter(|(s, _, notify)| *s == service && *notify)
            .map(|(_, c, _)| *c)
            .collect();
        let preferred = notifying
            .iter()
            .find(|c| c.to_string().starts_with("0000ffe1"));
        if let Some(c) = preferred.or(notifying.first()) {
            return Some((service, *c));
        }
    }
    None
}

/// A link to a meter that is streaming
pub struct Link {
    pub peripheral: Peripheral,
    pub characteristic: Characteristic,
}

/// Opens the link, finds the serial characteristic and starts its notifications. Fails after
/// `CONNECT_TIMEOUT`; the meter accepts one connection at a time, so a failed link is closed.
pub async fn connect(peripheral: &Peripheral) -> Result<Link> {
    let attempt = async {
        peripheral.connect().await?;
        peripheral.discover_services().await?;
        let characteristics: BTreeSet<Characteristic> = peripheral.characteristics();
        let list: Vec<(Uuid, Uuid, bool)> = characteristics
            .iter()
            .map(|c| {
                (
                    c.service_uuid,
                    c.uuid,
                    c.properties.contains(CharPropFlags::NOTIFY),
                )
            })
            .collect();
        let (service, uuid) = pick_notify(&list).ok_or("the device has no serial service")?;
        let characteristic = characteristics
            .into_iter()
            .find(|c| c.service_uuid == service && c.uuid == uuid)
            .ok_or("the serial characteristic disappeared")?;
        peripheral.subscribe(&characteristic).await?;
        Ok::<_, Error>(characteristic)
    };
    match tokio::time::timeout(CONNECT_TIMEOUT, attempt).await {
        Ok(Ok(characteristic)) => Ok(Link {
            peripheral: peripheral.clone(),
            characteristic,
        }),
        Ok(Err(error)) => {
            close(peripheral).await;
            Err(error)
        }
        Err(_) => {
            close(peripheral).await;
            Err("the meter did not start streaming in time".into())
        }
    }
}

/// Closes the link, and gives up after a few seconds if the system does not answer
pub async fn close(peripheral: &Peripheral) {
    let _ = tokio::time::timeout(Duration::from_secs(3), peripheral.disconnect()).await;
}

/// The bytes of the notifications of the serial characteristic, until the link ends
pub async fn notifications(
    link: &Link,
) -> Result<Pin<Box<dyn futures::Stream<Item = Vec<u8>> + Send>>> {
    let uuid = link.characteristic.uuid;
    let stream = link.peripheral.notifications().await?;
    Ok(Box::pin(
        stream
            .filter(move |n| futures::future::ready(n.uuid == uuid))
            .map(|n| n.value),
    ))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[derive(serde::Deserialize)]
    struct Names {
        names: Vec<Name>,
    }
    #[derive(serde::Deserialize)]
    struct Name {
        name: String,
        known: bool,
    }

    #[test]
    fn when_a_name_is_checked_matches_the_meter_names_in_the_shared_file() {
        let text = std::fs::read_to_string(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/../testdata/protocol.json"
        ))
        .unwrap();
        let shared: Names = serde_json::from_str(&text).unwrap();
        assert!(!shared.names.is_empty());
        for case in shared.names {
            assert_eq!(known_meter_name(&case.name), case.known, "{:?}", case.name);
        }
    }

    #[test]
    fn when_a_device_advertises_the_serial_service_lists_it_whatever_its_name() {
        assert!(is_meter(Some("something"), &[short_uuid(0xffe0)]));
        assert!(is_meter(None, &[short_uuid(0xffe0)]));
    }

    #[test]
    fn when_a_device_has_neither_the_service_nor_a_meter_name_does_not_list_it() {
        assert!(!is_meter(Some("Galaxy Buds2"), &[short_uuid(0xfff0)]));
        assert!(!is_meter(None, &[]));
    }

    #[test]
    fn when_the_device_is_named_by_name_or_address_matches_either() {
        assert!(matches_wanted(
            "UC96_BLE",
            Some("UC96_BLE"),
            "B0:67:54:7C:2B:74",
            "x"
        ));
        assert!(matches_wanted(
            "b0:67:54:7c:2b:74",
            Some("UC96_BLE"),
            "B0:67:54:7C:2B:74",
            "x"
        ));
        assert!(!matches_wanted(
            "UC96",
            Some("UC96_BLE"),
            "B0:67:54:7C:2B:74",
            "x"
        ));
    }

    #[test]
    fn when_the_characteristic_is_picked_prefers_ffe1_in_the_first_service_that_has_one() {
        let ffe0 = short_uuid(0xffe0);
        let found = [
            (ffe0, short_uuid(0xffe2), true),
            (ffe0, short_uuid(0xffe1), true),
            (short_uuid(0xfff0), short_uuid(0xfff1), true),
        ];
        assert_eq!(pick_notify(&found), Some((ffe0, short_uuid(0xffe1))));
    }

    #[test]
    fn when_the_first_service_does_not_notify_uses_the_next_one() {
        let found = [
            (short_uuid(0xffe0), short_uuid(0xffe1), false),
            (short_uuid(0xfff0), short_uuid(0xfff1), true),
        ];
        assert_eq!(
            pick_notify(&found),
            Some((short_uuid(0xfff0), short_uuid(0xfff1)))
        );
        assert_eq!(pick_notify(&[]), None);
    }

    #[test]
    fn when_a_short_uuid_is_widened_gives_the_bluetooth_base_uuid() {
        assert_eq!(
            short_uuid(0xffe0).to_string(),
            "0000ffe0-0000-1000-8000-00805f9b34fb"
        );
    }
}

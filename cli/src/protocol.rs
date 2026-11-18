//! Wire format of the Bluetooth USB / DC / AC meters that stream "FF 55" frames.
//! This is the same parser as `src/protocol.ts` of the web page, in Rust. The values both
//! must read are in `testdata/protocol.json`, which the tests of both read.

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MeterKind {
    Usb,
    Dc,
    Ac,
}

#[derive(Debug, Clone, PartialEq)]
pub struct Reading {
    pub kind: MeterKind,
    pub voltage: f64,
    pub current: f64,
    pub power: f64,
    pub energy_wh: Option<f64>,
    pub temperature_c: f64,
    pub duration_s: u32,
    pub backlight_s: u32,
    /// false for meters that use another checksum (the J7-C does)
    pub checksum_ok: bool,
    pub capacity_ah: Option<f64>,
    pub d_minus_v: Option<f64>,
    pub d_plus_v: Option<f64>,
    pub frequency_hz: Option<f64>,
    pub power_factor: Option<f64>,
    pub price_per_kwh: Option<f64>,
}

pub const REPORT_LENGTH: usize = 36;

fn frame_length(kind: u8) -> Option<usize> {
    match kind {
        1 => Some(REPORT_LENGTH),
        2 => Some(8),
        17 => Some(10),
        _ => None,
    }
}

/// Checksum of a whole frame: the sum of everything between the header and the checksum, xor 0x44
pub fn checksum_of(frame: &[u8]) -> u8 {
    let sum = frame[2..frame.len() - 1]
        .iter()
        .fold(0u8, |sum, byte| sum.wrapping_add(*byte));
    sum ^ 0x44
}

fn be(frame: &[u8], offset: usize, size: usize) -> f64 {
    frame[offset..offset + size]
        .iter()
        .fold(0.0, |value, byte| value * 256.0 + f64::from(*byte))
}

fn round(value: f64, digits: i32) -> f64 {
    let scale = 10f64.powi(digits);
    (value * scale).round() / scale
}

/// Reads one complete frame. Returns None for anything that is not a meter report.
pub fn parse_report(frame: &[u8]) -> Option<Reading> {
    if frame.len() != REPORT_LENGTH || frame[0] != 0xff || frame[1] != 0x55 || frame[2] != 0x01 {
        return None;
    }
    let kind = match frame[3] {
        1 => MeterKind::Ac,
        2 => MeterKind::Dc,
        3 => MeterKind::Usb,
        _ => return None,
    };
    let checksum_ok = checksum_of(frame) == frame[REPORT_LENGTH - 1];
    let usb = kind == MeterKind::Usb;
    let voltage = be(frame, 4, 3) / if usb { 100.0 } else { 10.0 };
    let current = be(frame, 7, 3) / if usb { 100.0 } else { 1000.0 };

    let blank = Reading {
        kind,
        voltage,
        current,
        power: round(voltage * current, 3),
        energy_wh: None,
        temperature_c: 0.0,
        duration_s: 0,
        backlight_s: 0,
        checksum_ok,
        capacity_ah: None,
        d_minus_v: None,
        d_plus_v: None,
        frequency_hz: None,
        power_factor: None,
        price_per_kwh: None,
    };

    if usb {
        return Some(Reading {
            capacity_ah: Some(be(frame, 10, 3) / 1000.0),
            energy_wh: Some(be(frame, 13, 4) / 100.0),
            d_minus_v: Some(be(frame, 17, 2) / 100.0),
            d_plus_v: Some(be(frame, 19, 2) / 100.0),
            temperature_c: be(frame, 21, 2),
            duration_s: duration(frame, 23),
            backlight_s: be(frame, 27, 1) as u32,
            ..blank
        });
    }

    let timed = Reading {
        temperature_c: be(frame, 24, 2),
        duration_s: duration(frame, 26),
        backlight_s: be(frame, 30, 1) as u32,
        price_per_kwh: Some(be(frame, 17, 3) / 100.0),
        ..blank
    };
    if kind == MeterKind::Ac {
        return Some(Reading {
            power: be(frame, 10, 3) / 10.0,
            energy_wh: Some(be(frame, 13, 4) * 10.0), // the counter is in units of 0.01 kWh
            frequency_hz: Some(be(frame, 20, 2) / 10.0),
            power_factor: Some(be(frame, 22, 2) / 1000.0),
            ..timed
        });
    }
    // DC meters: the capacity and energy counters are not decoded, because the published
    // layouts disagree and none was confirmed on a device. Better no number than a wrong one.
    Some(timed)
}

/// Hours (two bytes), minutes and seconds (one byte each) from `offset`
fn duration(frame: &[u8], offset: usize) -> u32 {
    (be(frame, offset, 2) * 3600.0 + be(frame, offset + 2, 1) * 60.0 + be(frame, offset + 3, 1))
        as u32
}

/// Cuts a stream of notification chunks into frames. A 36-byte report arrives in two
/// notifications when the connection uses the default 23-byte MTU, and a chunk may also
/// start in the middle of a frame, so bytes are buffered until a whole frame is there.
#[derive(Default)]
pub struct FrameStream {
    buffer: Vec<u8>,
}

impl FrameStream {
    pub fn push(&mut self, chunk: &[u8]) -> Vec<Vec<u8>> {
        self.buffer.extend_from_slice(chunk);
        let mut frames = Vec::new();
        loop {
            let Some(start) = self.find_header(0, self.buffer.len()) else {
                // the last byte may be the 0xFF of the next header
                let keep = self.buffer.len().saturating_sub(1);
                self.buffer.drain(..keep);
                break;
            };
            self.buffer.drain(..start);
            if self.buffer.len() < 3 {
                break;
            }
            let Some(length) = frame_length(self.buffer[2]) else {
                self.buffer.drain(..1);
                continue;
            };
            if self.buffer.len() < length {
                break;
            }
            if let Some(inner) = self.find_header(1, length) {
                // a notification was lost: this frame is cut short
                self.buffer.drain(..inner);
                continue;
            }
            frames.push(self.buffer.drain(..length).collect());
        }
        frames
    }

    fn find_header(&self, from: usize, to: usize) -> Option<usize> {
        (from..to.saturating_sub(1)).find(|&i| self.buffer[i] == 0xff && self.buffer[i + 1] == 0x55)
    }
}

/// In a row, this many reports with a matching ATorch checksum show that a meter uses it
const CHECKSUM_PROOF: u32 = 5;

/// Reads the reports out of a stream of notification chunks. A J7-C does not use the ATorch
/// checksum, but about one report in 256 matches it by chance, so a single match proves nothing.
/// Once a meter has matched `CHECKSUM_PROOF` times in a row, a report that does not match is
/// damaged and is left out; before that, every report is kept and says whether it matched.
#[derive(Default)]
pub struct ReportStream {
    frames: FrameStream,
    matched: u32,
}

impl ReportStream {
    pub fn push(&mut self, chunk: &[u8]) -> Vec<Reading> {
        let mut readings = Vec::new();
        for frame in self.frames.push(chunk) {
            let Some(reading) = parse_report(&frame) else {
                continue;
            };
            if self.matched >= CHECKSUM_PROOF && !reading.checksum_ok {
                continue;
            }
            self.matched = if reading.checksum_ok {
                self.matched + 1
            } else {
                0
            };
            readings.push(reading);
        }
        readings
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::Value;
    use std::collections::BTreeMap;

    #[derive(serde::Deserialize)]
    pub struct Shared {
        pub reports: Vec<Report>,
        #[serde(rename = "notReports")]
        pub not_reports: Vec<NotReport>,
        pub streams: Vec<Stream>,
    }
    #[derive(serde::Deserialize)]
    pub struct Report {
        pub name: String,
        pub hex: String,
        pub expect: BTreeMap<String, Value>,
        pub csv: String,
    }
    #[derive(serde::Deserialize)]
    pub struct NotReport {
        pub name: String,
        pub hex: String,
    }
    #[derive(serde::Deserialize)]
    pub struct Stream {
        pub name: String,
        pub chunks: Vec<String>,
        pub readings: Vec<StreamReading>,
    }
    #[derive(serde::Deserialize)]
    pub struct StreamReading {
        pub voltage: f64,
        pub current: f64,
        pub checksum_ok: bool,
    }

    pub fn shared() -> Shared {
        let text = std::fs::read_to_string(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/../testdata/protocol.json"
        ))
        .unwrap();
        serde_json::from_str(&text).unwrap()
    }

    pub fn bytes(hex: &str) -> Vec<u8> {
        (0..hex.len() / 2)
            .map(|i| u8::from_str_radix(&hex[i * 2..i * 2 + 2], 16).unwrap())
            .collect()
    }

    /// The reading as the file names its fields; a field the meter does not have is missing
    fn fields(r: &Reading) -> BTreeMap<&'static str, Value> {
        let kind = match r.kind {
            MeterKind::Usb => "usb",
            MeterKind::Dc => "dc",
            MeterKind::Ac => "ac",
        };
        let mut map: BTreeMap<&'static str, Value> = BTreeMap::new();
        map.insert("kind", kind.into());
        map.insert("voltage", r.voltage.into());
        map.insert("current", r.current.into());
        map.insert("power", r.power.into());
        map.insert("temperature_c", r.temperature_c.into());
        map.insert("duration_s", r.duration_s.into());
        map.insert("backlight_s", r.backlight_s.into());
        map.insert("checksum_ok", r.checksum_ok.into());
        for (key, value) in [
            ("energy_wh", r.energy_wh),
            ("capacity_ah", r.capacity_ah),
            ("d_minus_v", r.d_minus_v),
            ("d_plus_v", r.d_plus_v),
            ("frequency_hz", r.frequency_hz),
            ("power_factor", r.power_factor),
            ("price_per_kwh", r.price_per_kwh),
        ] {
            if let Some(value) = value {
                map.insert(key, value.into());
            }
        }
        map
    }

    fn same(got: &Value, want: &Value) -> bool {
        match (got.as_f64(), want.as_f64()) {
            (Some(g), Some(w)) => g == w,
            _ => got == want,
        }
    }

    #[test]
    fn when_a_recorded_frame_is_read_gives_the_values_in_the_shared_file() {
        let shared = shared();
        assert!(!shared.reports.is_empty());
        for case in shared.reports {
            let reading =
                parse_report(&bytes(&case.hex)).unwrap_or_else(|| panic!("{}", case.name));
            let got = fields(&reading);
            for (key, want) in &case.expect {
                let value = got
                    .get(key.as_str())
                    .unwrap_or_else(|| panic!("{}: {key} is missing", case.name));
                assert!(same(value, want), "{}: {key}: {value} != {want}", case.name);
            }
            for key in got.keys() {
                assert!(
                    case.expect.contains_key(*key),
                    "{}: {key} is read but the file has no value for it",
                    case.name
                );
            }
        }
    }

    #[test]
    fn when_a_recorded_frame_is_written_to_the_csv_gives_the_columns_in_the_shared_file() {
        for case in shared().reports {
            let reading = parse_report(&bytes(&case.hex)).unwrap();
            assert_eq!(crate::csv::values(&reading), case.csv, "{}", case.name);
        }
    }

    #[test]
    fn when_a_frame_is_not_a_report_reads_nothing() {
        for case in shared().not_reports {
            assert_eq!(parse_report(&bytes(&case.hex)), None, "{}", case.name);
        }
    }

    #[test]
    fn when_notifications_are_fed_to_a_report_stream_returns_the_readings_in_the_shared_file() {
        for case in shared().streams {
            let mut stream = ReportStream::default();
            let got: Vec<(f64, f64, bool)> = case
                .chunks
                .iter()
                .flat_map(|chunk| stream.push(&bytes(chunk)))
                .map(|r| (r.voltage, r.current, r.checksum_ok))
                .collect();
            let want: Vec<(f64, f64, bool)> = case
                .readings
                .iter()
                .map(|r| (r.voltage, r.current, r.checksum_ok))
                .collect();
            assert_eq!(got, want, "{}", case.name);
        }
    }

    #[test]
    fn when_the_frame_is_a_command_gives_the_checksum_the_meter_sends() {
        assert_eq!(checksum_of(&bytes("FF551103330000000003")), 0x03);
        assert_eq!(checksum_of(&bytes("FF551101050000000053")), 0x53);
    }
}

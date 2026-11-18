//! Where the recording goes: one CSV row per report, written and flushed at once, so a crash
//! loses at most the row that was being written. Nothing is kept in memory.

use crate::csv;
use crate::protocol::Reading;
use std::fs::OpenOptions;
use std::io::{self, Read, Seek, SeekFrom, Write};
use std::time::{Instant, SystemTime, UNIX_EPOCH};

pub struct Sink {
    out: Box<dyn Write + Send>,
    started: Option<Instant>,
    /// show the latest reading on one line of the terminal
    live: bool,
    live_width: usize,
}

pub fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_or(0, |d| d.as_millis() as u64)
}

impl Sink {
    /// Opens the file `path` for appending, or standard output for `-`. The header goes first
    /// when the file is new or empty. A file that was cut in the middle of a row gets a newline
    /// first, so the new rows start on a line of their own.
    pub fn open(path: &str, live: bool) -> io::Result<Self> {
        let out: Box<dyn Write + Send> = if path == "-" {
            let mut out: Box<dyn Write + Send> = Box::new(io::stdout());
            out.write_all(format!("{}\n", csv::HEADER).as_bytes())?;
            out.flush()?;
            out
        } else {
            let mut file = OpenOptions::new()
                .read(true)
                .append(true)
                .create(true)
                .open(path)?;
            let length = file.seek(SeekFrom::End(0))?;
            let mut text = String::new();
            if length == 0 {
                text.push_str(csv::HEADER);
                text.push('\n');
            } else {
                let mut last = [0u8; 1];
                file.seek(SeekFrom::End(-1))?;
                file.read_exact(&mut last)?;
                if last[0] != b'\n' {
                    text.push('\n');
                }
            }
            file.write_all(text.as_bytes())?;
            file.flush()?;
            Box::new(file)
        };
        Ok(Self::new(out, live))
    }

    pub fn new(out: Box<dyn Write + Send>, live: bool) -> Self {
        Self {
            out,
            started: None,
            live,
            live_width: 0,
        }
    }

    /// Writes one row for a reading that arrived now
    pub fn record(&mut self, reading: &Reading) -> io::Result<()> {
        let now = Instant::now();
        let started = *self.started.get_or_insert(now);
        let elapsed_ms = now.duration_since(started).as_millis() as u64;
        let row = csv::row(now_ms(), elapsed_ms, reading);
        self.out.write_all(row.as_bytes())?;
        self.out.flush()?;
        if self.live {
            let line = format!(
                "{:.2} V  {:.3} A  {:.3} W  {} Wh  {} C",
                reading.voltage,
                reading.current,
                reading.power,
                reading
                    .energy_wh
                    .map_or_else(|| "-".to_string(), |wh| format!("{wh:.2}")),
                reading.temperature_c,
            );
            self.show_live(&line);
        }
        Ok(())
    }

    fn show_live(&mut self, line: &str) {
        let width = line.chars().count();
        let pad = self.live_width.saturating_sub(width);
        eprint!("\r{line}{}", " ".repeat(pad));
        self.live_width = width;
    }

    /// Writes a line to standard error, clearing the live line first
    pub fn note(&mut self, message: &str) {
        if self.live_width > 0 {
            eprint!("\r{}\r", " ".repeat(self.live_width));
            self.live_width = 0;
        }
        eprintln!("{} {message}", csv::iso_time(now_ms()));
    }

    /// Clears the live line before the program ends
    pub fn finish(&mut self) {
        if self.live_width > 0 {
            eprint!("\r{}\r", " ".repeat(self.live_width));
            self.live_width = 0;
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::protocol::{parse_report, REPORT_LENGTH};

    fn reading() -> Reading {
        let mut frame = vec![0u8; REPORT_LENGTH];
        frame[..4].copy_from_slice(&[0xff, 0x55, 0x01, 0x03]);
        frame[6] = 0xe5; // 2.29 V
        parse_report(&frame).unwrap()
    }

    fn temp(name: &str) -> String {
        let dir = std::env::temp_dir().join(format!("usbmeter-test-{}-{name}", std::process::id()));
        let _ = std::fs::remove_file(&dir);
        dir.to_string_lossy().into_owned()
    }

    #[test]
    fn when_the_file_is_new_writes_the_header_before_the_first_row() {
        let path = temp("new");
        let mut sink = Sink::open(&path, false).unwrap();
        sink.record(&reading()).unwrap();
        let text = std::fs::read_to_string(&path).unwrap();
        let lines: Vec<&str> = text.lines().collect();
        assert_eq!(lines[0], csv::HEADER);
        assert_eq!(lines.len(), 2);
        assert!(text.ends_with('\n'));
        assert!(lines[1].contains(",0.00,2.29,"), "{}", lines[1]);
        std::fs::remove_file(&path).unwrap();
    }

    #[test]
    fn when_the_file_already_has_rows_appends_without_a_second_header() {
        let path = temp("append");
        Sink::open(&path, false)
            .unwrap()
            .record(&reading())
            .unwrap();
        Sink::open(&path, false)
            .unwrap()
            .record(&reading())
            .unwrap();
        let text = std::fs::read_to_string(&path).unwrap();
        assert_eq!(text.lines().count(), 3);
        assert_eq!(text.matches("time,elapsed_s").count(), 1);
        std::fs::remove_file(&path).unwrap();
    }

    #[test]
    fn when_the_file_ends_in_the_middle_of_a_row_starts_the_next_row_on_a_new_line() {
        let path = temp("cut");
        std::fs::write(
            &path,
            format!("{}\n2026-01-01T00:00:00.000Z,0.00,5", csv::HEADER),
        )
        .unwrap();
        Sink::open(&path, false)
            .unwrap()
            .record(&reading())
            .unwrap();
        let text = std::fs::read_to_string(&path).unwrap();
        assert_eq!(text.lines().count(), 3);
        assert!(text.ends_with('\n'));
        std::fs::remove_file(&path).unwrap();
    }

    #[test]
    fn when_a_row_is_written_it_is_in_the_file_before_the_next_one() {
        let path = temp("flush");
        let mut sink = Sink::open(&path, false).unwrap();
        sink.record(&reading()).unwrap();
        assert_eq!(std::fs::read_to_string(&path).unwrap().lines().count(), 2);
        sink.record(&reading()).unwrap();
        assert_eq!(std::fs::read_to_string(&path).unwrap().lines().count(), 3);
        std::fs::remove_file(&path).unwrap();
    }
}

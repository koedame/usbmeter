//! The CSV the recorder writes: the same columns as the web page's "Download CSV"
//! (`CSV_HEADER` in `src/history.ts`), so the same tools read both.

use crate::protocol::Reading;

pub const HEADER: &str = "time,elapsed_s,voltage_v,current_a,power_w,energy_wh,capacity_ah,temperature_c,d_plus_v,d_minus_v,frequency_hz,power_factor";

fn optional(value: Option<f64>) -> String {
    value.map(|v| v.to_string()).unwrap_or_default()
}

/// The columns after `elapsed_s`
pub fn values(reading: &Reading) -> String {
    [
        reading.voltage.to_string(),
        reading.current.to_string(),
        reading.power.to_string(),
        optional(reading.energy_wh),
        optional(reading.capacity_ah),
        reading.temperature_c.to_string(),
        optional(reading.d_plus_v),
        optional(reading.d_minus_v),
        optional(reading.frequency_hz),
        optional(reading.power_factor),
    ]
    .join(",")
}

/// One line, with its newline. `at_ms` is the wall-clock time in milliseconds since the Unix
/// epoch and `elapsed_ms` the time since the first sample of the recording.
pub fn row(at_ms: u64, elapsed_ms: u64, reading: &Reading) -> String {
    format!(
        "{},{:.2},{}\n",
        iso_time(at_ms),
        elapsed_ms as f64 / 1000.0,
        values(reading)
    )
}

/// `Date.prototype.toISOString` for a time since the Unix epoch: `2026-01-02T03:04:05.678Z`
pub fn iso_time(at_ms: u64) -> String {
    let days = (at_ms / 86_400_000) as i64;
    let in_day = at_ms % 86_400_000;
    // civil date from a day count (Howard Hinnant's days_from_civil, inverted)
    let z = days + 719_468;
    let era = z.div_euclid(146_097);
    let day_of_era = z.rem_euclid(146_097);
    let year_of_era =
        (day_of_era - day_of_era / 1460 + day_of_era / 36_524 - day_of_era / 146_096) / 365;
    let day_of_year = day_of_era - (365 * year_of_era + year_of_era / 4 - year_of_era / 100);
    let mp = (5 * day_of_year + 2) / 153;
    let day = day_of_year - (153 * mp + 2) / 5 + 1;
    let month = if mp < 10 { mp + 3 } else { mp - 9 };
    let year = year_of_era + era * 400 + i64::from(month <= 2);
    format!(
        "{year:04}-{month:02}-{day:02}T{:02}:{:02}:{:02}.{:03}Z",
        in_day / 3_600_000,
        in_day / 60_000 % 60,
        in_day / 1000 % 60,
        in_day % 1000
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn when_the_time_is_the_epoch_writes_it_the_way_javascript_does() {
        assert_eq!(iso_time(0), "1970-01-01T00:00:00.000Z");
    }

    #[test]
    fn when_the_time_is_on_a_leap_day_writes_that_day() {
        // 2024-02-29T23:59:59.999Z
        assert_eq!(iso_time(1_709_251_199_999), "2024-02-29T23:59:59.999Z");
        // 2026-11-19T05:46:23.123Z
        assert_eq!(iso_time(1_795_067_183_123), "2026-11-19T05:46:23.123Z");
    }

    #[test]
    fn when_the_year_ends_writes_the_last_and_the_first_milliseconds() {
        assert_eq!(iso_time(1_767_225_599_999), "2025-12-31T23:59:59.999Z");
        assert_eq!(iso_time(1_767_225_600_000), "2026-01-01T00:00:00.000Z");
    }
}

#[cfg(test)]
mod header_tests {
    use super::*;

    #[test]
    fn when_the_header_is_written_it_is_the_one_of_the_web_pages_csv() {
        let source =
            std::fs::read_to_string(concat!(env!("CARGO_MANIFEST_DIR"), "/../src/history.ts"))
                .unwrap();
        let start = source
            .find("const CSV_HEADER")
            .expect("CSV_HEADER in history.ts");
        let quoted = &source[start..];
        let open = quoted.find('"').unwrap() + 1;
        let close = open + quoted[open..].find('"').unwrap();
        assert_eq!(HEADER, &quoted[open..close]);
    }

    #[test]
    fn when_a_row_is_written_it_has_as_many_columns_as_the_header() {
        let report = crate::protocol::parse_report(
            &(0..36)
                .map(|i| match i {
                    0 => 0xff,
                    1 => 0x55,
                    2 => 1,
                    3 => 3,
                    _ => 0,
                })
                .collect::<Vec<u8>>(),
        )
        .unwrap();
        let line = row(1_795_067_183_123, 2_500, &report);
        assert!(line.starts_with("2026-11-19T05:46:23.123Z,2.50,"));
        assert!(line.ends_with('\n'));
        assert_eq!(
            line.trim_end().split(',').count(),
            HEADER.split(',').count()
        );
    }
}

// What the dashboard plots: the measured quantities and the panels they are grouped into.

import type { MeterKind, Reading } from "./protocol.ts";

export type MetricId =
  | "voltage"
  | "current"
  | "power"
  | "temperature"
  | "dplus"
  | "dminus"
  | "frequency"
  | "pf";

export interface Metric {
  id: MetricId;
  label: string;
  /** empty for a ratio */
  unit: string;
  /** undefined when this kind of meter does not report it */
  value(reading: Reading): number | undefined;
  /** decimals the meter resolves (USB meters: 10 mV / 10 mA, AC and DC meters: 100 mV / 1 mA) */
  digits(kind: MeterKind): number;
  /** the y-axis never spans less than this, so noise in the last digit does not fill the plot */
  minSpan: number;
  /** true when the y-axis always reaches down to 0; false when it zooms in on the values */
  fromZero: boolean;
}

export const METRICS: Record<MetricId, Metric> = {
  voltage: {
    id: "voltage",
    label: "Voltage",
    unit: "V",
    value: (r) => r.voltage,
    digits: (kind) => (kind === "usb" ? 2 : 1),
    minSpan: 0.5,
    fromZero: false, // a 5 V rail sagging to 4.7 V under load is the thing to see
  },
  current: {
    id: "current",
    label: "Current",
    unit: "A",
    value: (r) => r.current,
    digits: (kind) => (kind === "usb" ? 2 : 3),
    minSpan: 0.5,
    fromZero: true,
  },
  power: {
    id: "power",
    label: "Power",
    unit: "W",
    value: (r) => r.power,
    digits: (kind) => (kind === "ac" ? 1 : 2),
    minSpan: 2,
    fromZero: true,
  },
  temperature: {
    id: "temperature",
    label: "Temperature",
    unit: "°C",
    value: (r) => r.temperatureC,
    digits: () => 0,
    minSpan: 5,
    fromZero: false,
  },
  dplus: {
    id: "dplus",
    label: "D+",
    unit: "V",
    value: (r) => r.dPlus,
    digits: () => 2,
    minSpan: 0.5,
    fromZero: true, // the level itself (0.6 V, 2.7 V, 3.3 V) tells which charging scheme is in use
  },
  dminus: {
    id: "dminus",
    label: "D−",
    unit: "V",
    value: (r) => r.dMinus,
    digits: () => 2,
    minSpan: 0.5,
    fromZero: true,
  },
  frequency: {
    id: "frequency",
    label: "Frequency",
    unit: "Hz",
    value: (r) => r.frequencyHz,
    digits: () => 1,
    minSpan: 1,
    fromZero: false,
  },
  pf: {
    id: "pf",
    label: "Power factor",
    unit: "",
    value: (r) => r.powerFactor,
    digits: () => 3,
    minSpan: 0.2,
    fromZero: false,
  },
};

export interface PanelDef {
  id: string;
  title: string;
  /** "wide" panels take a full row with the reading beside the plot; "small" ones share the last row */
  size: "wide" | "small";
  /** plotted together on one y-axis, so they must share a unit */
  metrics: MetricId[];
  /** the kinds of meter that report these metrics */
  kinds: MeterKind[];
}

const EVERY_KIND: MeterKind[] = ["usb", "dc", "ac"];

export const PANELS: PanelDef[] = [
  { id: "voltage", title: "Voltage", size: "wide", metrics: ["voltage"], kinds: EVERY_KIND },
  { id: "current", title: "Current", size: "wide", metrics: ["current"], kinds: EVERY_KIND },
  { id: "power", title: "Power", size: "wide", metrics: ["power"], kinds: EVERY_KIND },
  {
    id: "temperature",
    title: "Temperature",
    size: "small",
    metrics: ["temperature"],
    kinds: EVERY_KIND,
  },
  {
    id: "data-lines",
    title: "Data lines",
    size: "small",
    metrics: ["dplus", "dminus"],
    kinds: ["usb"],
  },
  { id: "frequency", title: "Frequency", size: "small", metrics: ["frequency"], kinds: ["ac"] },
  { id: "power-factor", title: "Power factor", size: "small", metrics: ["pf"], kinds: ["ac"] },
];

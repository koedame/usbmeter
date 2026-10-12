// The dashboard: one panel per measured quantity, all on the same time axis, with one cursor
// that runs through every plot.

import {
  type Axis,
  axisRange,
  decimate,
  drawEmpty,
  drawPlot,
  formatClock,
  GUTTER,
  nearestIndex,
  type Point,
  stepIndex,
  timeAt,
  xAt,
} from "./chart.ts";
import type { Sample } from "./history.ts";
import { t, translate } from "./i18n.ts";
import { METRICS, type Metric, PANELS, type PanelDef } from "./metrics.ts";
import type { MeterKind, Reading } from "./protocol.ts";

interface Panel {
  def: PanelDef;
  metrics: Metric[];
  root: HTMLElement;
  /** the heading */
  name: HTMLElement;
  /** the legend entries of a panel with several metrics, in their order; empty for a single one */
  labels: HTMLElement[];
  canvas: HTMLCanvasElement;
  /** the live value of each metric */
  values: HTMLElement[];
  /** panels with a single metric also show its range over the time on screen */
  stats: { min: HTMLElement; mean: HTMLElement; max: HTMLElement } | undefined;
  /** what is plotted, one series per metric, already thinned to the plot's width */
  series: Point[][];
  /** undefined while there is nothing to plot */
  axis: Axis | undefined;
}

const NO_VALUE = "–";
const DASH = [7, 4];

function clone(templateId: string): HTMLElement {
  const template = document.getElementById(templateId);
  const root =
    template instanceof HTMLTemplateElement
      ? template.content.firstElementChild?.cloneNode(true)
      : undefined;
  if (!(root instanceof HTMLElement))
    throw new Error(`<template id="${templateId}"> is missing from index.html`);
  return root;
}

function part<T extends HTMLElement = HTMLElement>(root: HTMLElement, selector: string): T {
  const found = root.querySelector<T>(selector);
  if (!found) throw new Error(`${selector} is missing from a template in index.html`);
  return found;
}

function buildPanel(def: PanelDef): Panel {
  const metrics = def.metrics.map((id) => METRICS[id]);
  const root = clone("panel-template");
  root.classList.add(`panel--${def.size}`);
  root.dataset.for = def.kinds.join(" ");

  const title = part(root, ".panel__title");
  title.id = `panel-${def.id}`;
  root.setAttribute("aria-labelledby", title.id);

  // One quantity: the title names it and carries the colour key, and there is room for its
  // range. Several on one plot: each readout is a legend entry with its own key and label.
  const [only, ...more] = metrics;
  const single = only !== undefined && more.length === 0;
  if (single) root.dataset.metric = only.id;
  else part(title, ".key").remove();

  const readouts = part(root, ".panel__readouts");
  const labels: HTMLElement[] = [];
  const values = metrics.map((metric) => {
    const readout = clone("readout-template");
    readout.dataset.metric = metric.id;
    part(readout, ".readout__unit").textContent = metric.unit;
    const label = part(readout, ".readout__label");
    if (single) {
      part(readout, ".key").remove();
      label.remove();
    } else {
      labels.push(label);
    }
    const value = part(readout, ".readout__value");
    value.dataset.readout = metric.id;
    readouts.append(readout);
    return value;
  });

  const statsRoot = part(root, ".panel__stats");
  let stats: Panel["stats"];
  if (single) {
    stats = {
      min: part(statsRoot, '[data-stat="min"]'),
      mean: part(statsRoot, '[data-stat="mean"]'),
      max: part(statsRoot, '[data-stat="max"]'),
    };
  } else {
    statsRoot.remove();
  }

  const name = part(title, ".panel__name");
  const canvas = part<HTMLCanvasElement>(root, "canvas");
  return { def, metrics, root, name, labels, canvas, values, stats, series: [], axis: undefined };
}

export class Dashboard {
  private readonly panels: Panel[];
  private readonly tooltip: HTMLElement;
  private readonly announce: HTMLElement;
  private samples: Sample[] = [];
  private times: number[] = [];
  private span: { from: number; to: number } | undefined;
  private kind: MeterKind = "usb";
  /**
   * Where the pointer is while it is over a plot. Kept as a position, not as a time: readings
   * keep arriving and move the time axis under a pointer that stands still.
   */
  private pointer: { canvas: HTMLCanvasElement; x: number; y: number } | undefined;
  /**
   * Where the keyboard has put the cursor: the time of the reading it is on, not its index, for
   * the same reason as the pointer. Used while the pointer is not over a plot.
   */
  private keyboard: { canvas: HTMLCanvasElement; time: number } | undefined;
  /** What the cursor shows, in words, for the live region that tells a screen reader */
  private spoken = "";
  private frame: number | undefined;

  /**
   * The small panels share `row`; the wide ones are put before it, one per row of their own.
   * `announce` is a live region that is told the readings under the cursor when a key moves it.
   */
  constructor(row: HTMLElement, tooltip: HTMLElement, announce: HTMLElement) {
    this.announce = announce;
    this.tooltip = tooltip;
    this.panels = PANELS.map(buildPanel);
    const resized = new ResizeObserver(() => {
      this.compute();
      this.schedule();
    });
    for (const panel of this.panels) {
      if (panel.def.size === "wide") row.before(panel.root);
      else row.append(panel.root);
      resized.observe(panel.canvas);
      panel.canvas.addEventListener("pointermove", (event) => this.track(event, panel.canvas));
      panel.canvas.addEventListener("pointerdown", (event) => this.track(event, panel.canvas));
      for (const type of ["pointerleave", "pointercancel"] as const)
        panel.canvas.addEventListener(type, () => this.release());
      // the cursor can be moved from the keyboard too
      panel.canvas.tabIndex = 0;
      panel.canvas.setAttribute(
        "aria-keyshortcuts",
        "ArrowLeft ArrowRight PageUp PageDown Home End",
      );
      panel.canvas.addEventListener("focus", () => {
        // a click focuses the plot too, but the pointer is the cursor then
        if (panel.canvas.matches(":focus-visible")) this.moveWithKey(panel.canvas, "End");
      });
      panel.canvas.addEventListener("keydown", (event) => {
        if (this.moveWithKey(panel.canvas, event.key)) event.preventDefault();
      });
      panel.canvas.addEventListener("blur", () => {
        if (this.keyboard?.canvas === panel.canvas) this.keyboard = undefined;
        this.schedule();
      });
    }
    matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => this.schedule());
    this.retranslate();
  }

  /** Puts the names of the panels and of what they plot into the page's language */
  retranslate(): void {
    for (const panel of this.panels) {
      const title = panel.def.title();
      panel.name.textContent = title;
      panel.canvas.setAttribute("aria-label", t("panel.overTime", { name: title }));
      panel.labels.forEach((label, i) => {
        label.textContent = panel.metrics[i]?.label() ?? "";
      });
      translate(panel.root);
    }
    this.schedule(); // an empty plot says so in words, and the tooltip names every quantity
  }

  /** Puts the newest reading into the live readouts */
  showReading(reading: Reading): void {
    this.kind = reading.kind;
    for (const panel of this.panels) {
      panel.metrics.forEach((metric, i) => {
        const value = metric.value(reading);
        const node = panel.values[i];
        if (node && value !== undefined)
          node.textContent = value.toFixed(metric.digits(reading.kind));
      });
    }
  }

  /** Blanks the live readouts, for when the readings on screen belong to a source that is gone */
  clearReadings(): void {
    for (const panel of this.panels) for (const node of panel.values) node.textContent = NO_VALUE;
  }

  /** Plots `samples`. The time axis covers the last `rangeMs`, or everything when undefined. */
  showHistory(samples: Sample[], rangeMs: number | undefined): void {
    this.samples = samples;
    this.times = samples.map((sample) => sample.at.getTime());
    const first = this.times[0];
    const last = this.times.at(-1);
    if (first === undefined || last === undefined) {
      this.span = undefined;
    } else {
      const from = rangeMs === undefined ? first : last - rangeMs;
      this.span = { from: Math.min(from, last - 1000), to: last }; // a lone reading still needs a width
    }
    this.compute();
    this.schedule();
  }

  /** Works out every panel's series, y-axis and ranges for the time on screen */
  private compute(): void {
    for (const panel of this.panels) {
      panel.series = [];
      panel.axis = undefined;
      let min = Number.POSITIVE_INFINITY;
      let max = Number.NEGATIVE_INFINITY;
      let sum = 0;
      let count = 0;
      if (this.span && !panel.root.hidden) {
        const columns = Math.max(1, panel.canvas.clientWidth - GUTTER.left - GUTTER.right);
        for (const metric of panel.metrics) {
          const points: Point[] = [];
          this.samples.forEach((sample, i) => {
            const v = metric.value(sample.reading);
            const t = this.times[i];
            if (v === undefined || t === undefined) return;
            points.push({ t, v });
            if (v < min) min = v;
            if (v > max) max = v;
            sum += v;
            count += 1;
          });
          panel.series.push(decimate(points, this.span.from, this.span.to, columns));
        }
      }
      const [first] = panel.metrics;
      if (count > 0 && first) {
        const room = panel.canvas.clientHeight - GUTTER.top - GUTTER.bottom;
        const ticks = Math.min(5, Math.max(2, Math.floor(room / 30)));
        panel.axis = axisRange(min, max, first.minSpan, first.fromZero, ticks);
      }
      if (panel.stats && first) {
        const digits = first.digits(this.kind);
        panel.stats.min.textContent = count > 0 ? min.toFixed(digits) : NO_VALUE;
        panel.stats.max.textContent = count > 0 ? max.toFixed(digits) : NO_VALUE;
        // one more digit than the meter shows: averaging is what earns it
        panel.stats.mean.textContent = count > 0 ? (sum / count).toFixed(digits + 1) : NO_VALUE;
      }
    }
  }

  private track(event: PointerEvent, canvas: HTMLCanvasElement): void {
    this.pointer = { canvas, x: event.clientX, y: event.clientY };
    this.schedule();
  }

  /** Moves the keyboard's cursor as `key` says, starting from the newest reading. False when the key moves nothing. */
  private moveWithKey(canvas: HTMLCanvasElement, key: string): boolean {
    const here = this.keyboard
      ? nearestIndex(this.times, this.keyboard.time)
      : this.times.length - 1;
    const next = stepIndex(key, here, this.times.length);
    const time = next === undefined ? undefined : this.times[next];
    if (time === undefined) return false;
    this.keyboard = { canvas, time };
    this.draw();
    this.announce.textContent = this.spoken;
    return true;
  }

  private release(): void {
    this.pointer = undefined;
    this.schedule();
  }

  /** Redraws on the next frame. Readings and pointer moves can come faster than the screen refreshes. */
  private schedule(): void {
    if (this.frame !== undefined) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = undefined;
      this.draw();
    });
  }

  private draw(): void {
    // the cursor snaps to the reading closest to the pointer, or sits on the one the keys chose
    let index = -1;
    let anchor = this.pointer;
    if (this.pointer && this.span) {
      const box = this.pointer.canvas.getBoundingClientRect();
      const under = timeAt(this.pointer.x - box.left, box.width, this.span.from, this.span.to);
      index = nearestIndex(this.times, under);
    } else if (this.keyboard && this.span) {
      index = nearestIndex(this.times, this.keyboard.time);
      const box = this.keyboard.canvas.getBoundingClientRect();
      const x = xAt(this.times[index] ?? 0, box.width, this.span.from, this.span.to);
      anchor = { canvas: this.keyboard.canvas, x: box.left + x, y: box.top + box.height / 2 };
    }
    const sample = this.samples[index];
    const at = this.times[index];
    const colors = getComputedStyle(document.documentElement);

    for (const panel of this.panels) {
      if (panel.root.hidden) continue;
      if (!this.span || !panel.axis) {
        drawEmpty(panel.canvas, t("plot.empty"));
        continue;
      }
      const traces = panel.metrics.map((metric, i) => {
        const value = sample ? metric.value(sample.reading) : undefined;
        return {
          points: panel.series[i] ?? [],
          color: colors.getPropertyValue(`--series-${metric.id}`).trim(),
          marker: value !== undefined && at !== undefined ? { t: at, v: value } : undefined,
          // the second line of a shared plot, so that it differs from the first by more than its colour
          dash: i > 0 ? DASH : undefined,
        };
      });
      drawPlot(panel.canvas, traces, { ...this.span, axis: panel.axis, cursor: at });
    }
    this.showTooltip(sample, anchor);
  }

  /** One tooltip for every plot: the time under the cursor and each quantity at that moment */
  private showTooltip(
    sample: Sample | undefined,
    pointer: { x: number; y: number } | undefined,
  ): void {
    if (!sample || !pointer) {
      this.tooltip.hidden = true;
      return;
    }
    const time = document.createElement("p");
    time.className = "tooltip__time";
    time.textContent = formatClock(sample.at.getTime(), true);
    const rows: HTMLElement[] = [time];
    const spoken = [time.textContent];
    for (const panel of this.panels) {
      if (panel.root.hidden) continue;
      for (const metric of panel.metrics) {
        const value = metric.value(sample.reading);
        if (value === undefined) continue;
        const row = clone("tooltip-row-template");
        row.dataset.metric = metric.id;
        part(row, ".tooltip__label").textContent = metric.label();
        part(row, ".tooltip__value").textContent = value.toFixed(
          metric.digits(sample.reading.kind),
        );
        part(row, ".tooltip__unit").textContent = metric.unit;
        rows.push(row);
        spoken.push(`${metric.label()} ${part(row, ".tooltip__value").textContent} ${metric.unit}`);
      }
    }
    this.spoken = spoken.join(", ");
    this.tooltip.replaceChildren(...rows);
    this.tooltip.hidden = false;

    // beside the pointer, flipped to its other side near the right edge, kept inside the window
    const gap = 16;
    const { offsetWidth: width, offsetHeight: height } = this.tooltip;
    const right = pointer.x + gap + width <= window.innerWidth;
    const x = right ? pointer.x + gap : pointer.x - gap - width;
    const y = Math.min(pointer.y + gap, window.innerHeight - height - 4);
    this.tooltip.style.transform = `translate(${Math.max(4, x)}px, ${Math.max(4, y)}px)`;
  }
}

// Canvas plots for the dashboard: the scale helpers (pure, tested) and the drawing of one plot.

export interface Point {
  /** epoch milliseconds */
  t: number;
  v: number;
}

export interface Axis {
  bottom: number;
  top: number;
  step: number;
}

/** A round step (1, 2, 5 × 10ⁿ) so the y-axis labels read 0, 0.5, 1 rather than 0.37, 0.74 */
export function niceStep(span: number, ticks: number): number {
  const rough = span / ticks;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const unit = rough / magnitude;
  const nice = unit <= 1 ? 1 : unit <= 2 ? 2 : unit <= 5 ? 5 : 10;
  return nice * magnitude;
}

/**
 * The y-axis for values between `min` and `max`: round numbers at both ends, about `ticks`
 * steps apart. It never spans less than `minSpan` (so an idle 0 A meter does not get a 5e-7
 * axis) and reaches down to 0 when `fromZero` is set. Without `fromZero` it zooms in on the
 * values, but does not dip below 0 for values that are not negative.
 */
export function axisRange(
  min: number,
  max: number,
  minSpan: number,
  fromZero: boolean,
  ticks = 4,
): Axis {
  let low = fromZero ? Math.min(min, 0) : min;
  let high = fromZero ? Math.max(max, 0) : max;
  if (high - low < minSpan) {
    if (!fromZero) {
      const centred = (low + high - minSpan) / 2;
      low = min >= 0 ? Math.max(centred, 0) : centred;
    }
    high = low + minSpan;
  }
  const step = niceStep(high - low, ticks);
  // the epsilon keeps 4.6 / 0.2 = 22.999999999999996 from costing a whole extra step
  return {
    bottom: tidy(Math.floor(low / step + 1e-9) * step),
    top: tidy(Math.ceil(high / step - 1e-9) * step),
    step,
  };
}

/** Removes binary floating point noise (0.30000000000000004 → 0.3) */
function tidy(value: number): number {
  return Number(value.toPrecision(12));
}

const TIME_STEPS_SEC = [
  1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600, 7200, 10800, 21600, 43200, 86400,
];

/**
 * Where the time axis gets its labels: at most `maxTicks` round moments of the local clock
 * (every 10 s, every 5 min ...) between `from` and `to`. `offsetMs` is UTC minus local time,
 * i.e. `Date.prototype.getTimezoneOffset()` in milliseconds.
 */
export function timeTicks(
  from: number,
  to: number,
  maxTicks: number,
  offsetMs: number,
): { stepMs: number; ticks: number[] } {
  const span = to - from;
  let stepMs = (TIME_STEPS_SEC.find((s) => span / (s * 1000) <= maxTicks) ?? 86_400) * 1000;
  while (span / stepMs > maxTicks) stepMs *= 2;
  const ticks: number[] = [];
  for (let t = Math.ceil((from - offsetMs) / stepMs) * stepMs + offsetMs; t <= to; t += stepMs)
    ticks.push(t);
  return { stepMs, ticks };
}

/** Local time of day, 24 h. Seconds are dropped when the axis steps in whole minutes. */
export function formatClock(t: number, withSeconds: boolean): string {
  const date = new Date(t);
  const pad = (n: number) => String(n).padStart(2, "0");
  const clock = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  return withSeconds ? `${clock}:${pad(date.getSeconds())}` : clock;
}

/**
 * Thins a series to what a plot `columns` pixels wide can show: the lowest and the highest
 * point of every pixel column, in time order, and the newest point. A one-sample spike in an
 * hour of readings stays visible, and a day of readings is drawn as fast as a minute.
 */
export function decimate(points: Point[], from: number, to: number, columns: number): Point[] {
  if (points.length <= columns * 2) return points;
  const out: Point[] = [];
  const columnMs = (to - from) / columns;
  let column = -1;
  let low: Point | undefined;
  let high: Point | undefined;
  const flush = () => {
    if (!low || !high) return;
    if (low === high) out.push(low);
    else if (low.t < high.t) out.push(low, high);
    else out.push(high, low);
  };
  for (const point of points) {
    const at = Math.min(columns - 1, Math.max(0, Math.floor((point.t - from) / columnMs)));
    if (at !== column || !low || !high) {
      flush();
      column = at;
      low = point;
      high = point;
      continue;
    }
    if (point.v < low.v) low = point;
    if (point.v > high.v) high = point;
  }
  flush();
  // the newest reading is where the trace ends, whether or not it is an extreme of its column
  const newest = points.at(-1);
  if (newest && out.at(-1) !== newest) out.push(newest);
  return out;
}

/** Index of the entry whose time is closest to `t`, or -1 for an empty list. `times` must be ascending. */
export function nearestIndex(times: ArrayLike<number>, t: number): number {
  if (times.length === 0) return -1;
  let low = 0;
  let high = times.length - 1;
  while (high - low > 1) {
    const middle = (low + high) >> 1;
    if ((times[middle] ?? 0) <= t) low = middle;
    else high = middle;
  }
  return t - (times[low] ?? 0) <= (times[high] ?? 0) - t ? low : high;
}

/** Decimals needed to write multiples of `step` (0.2 → 1, 0.05 → 2, 5 → 0) */
export function stepDecimals(step: number): number {
  return Math.max(0, -Math.floor(Math.log10(step) + 1e-9));
}

export interface Trace {
  points: Point[];
  /** `#rrggbb` */
  color: string;
  /** where the cursor sits on this trace, when the pointer is over a plot */
  marker: Point | undefined;
  /** Dash and gap lengths in pixels, for the line of a trace that shares its plot and must not be told apart by colour alone */
  dash?: number[] | undefined;
}

export interface PlotView {
  from: number;
  to: number;
  axis: Axis;
  /** time under the pointer; a hairline is drawn there on every plot */
  cursor: number | undefined;
}

/** Space around the plot area for the axis labels. The same on every plot, so stacked plots share one time axis. */
export const GUTTER = { left: 52, right: 14, top: 10, bottom: 22 };

/** Readings further apart than this are not joined: the meter was disconnected in between */
const GAP_MS = 5000;

interface Surface {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  color(name: string): string;
}

function prepare(canvas: HTMLCanvasElement): Surface | undefined {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx || width === 0 || height === 0) return undefined;
  const ratio = window.devicePixelRatio || 1;
  const pixelWidth = Math.round(width * ratio);
  const pixelHeight = Math.round(height * ratio);
  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, width, height);
  const style = getComputedStyle(canvas);
  ctx.font = `11px ${style.fontFamily}`;
  return { ctx, width, height, color: (name) => style.getPropertyValue(name).trim() };
}

/** The time under a pointer `x` pixels from the left edge of a plot `width` pixels wide */
export function timeAt(x: number, width: number, from: number, to: number): number {
  const span = width - GUTTER.left - GUTTER.right;
  const ratio = Math.min(1, Math.max(0, (x - GUTTER.left) / span));
  return from + ratio * (to - from);
}

/** Where a plot `width` pixels wide draws the time `t`: the way back from `timeAt`, kept inside the plot area */
export function xAt(t: number, width: number, from: number, to: number): number {
  const span = width - GUTTER.left - GUTTER.right;
  const ratio = Math.min(1, Math.max(0, (t - from) / (to - from)));
  return GUTTER.left + ratio * span;
}

/** Readings a cursor moves with Page Up and Page Down */
const PAGE = 10;

/**
 * Where a key moves the cursor, as an index into `count` readings: undefined for a key that
 * does not move it. Left and right step one reading, Page Up and Down ten, Home and End go to
 * the oldest and the newest on screen.
 */
export function stepIndex(key: string, index: number, count: number): number | undefined {
  const last = count - 1;
  const moved = {
    ArrowLeft: index - 1,
    ArrowRight: index + 1,
    PageUp: index - PAGE,
    PageDown: index + PAGE,
    Home: 0,
    End: last,
  }[key];
  return moved === undefined ? undefined : Math.min(last, Math.max(0, moved));
}

export function drawEmpty(canvas: HTMLCanvasElement, message: string): void {
  const surface = prepare(canvas);
  if (!surface) return;
  const { ctx, width, height } = surface;
  ctx.fillStyle = surface.color("--muted");
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(message, width / 2, height / 2);
}

export function drawPlot(canvas: HTMLCanvasElement, traces: Trace[], view: PlotView): void {
  const surface = prepare(canvas);
  if (!surface) return;
  const { ctx, width, height } = surface;
  const { from, to, axis } = view;
  const plot = {
    left: GUTTER.left,
    right: width - GUTTER.right,
    top: GUTTER.top,
    bottom: height - GUTTER.bottom,
  };
  const x = (t: number) => plot.left + ((t - from) / (to - from)) * (plot.right - plot.left);
  const y = (v: number) =>
    plot.bottom - ((v - axis.bottom) / (axis.top - axis.bottom)) * (plot.bottom - plot.top);
  const crisp = (pixel: number) => Math.round(pixel) + 0.5;

  // Grid and axis labels: hairlines one step off the surface, labels in muted ink
  ctx.strokeStyle = surface.color("--grid");
  ctx.fillStyle = surface.color("--muted");
  ctx.lineWidth = 1;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  const decimals = stepDecimals(axis.step);
  let labelled = Number.POSITIVE_INFINITY;
  for (let v = axis.bottom; v <= axis.top + axis.step / 2; v += axis.step) {
    ctx.beginPath();
    ctx.moveTo(plot.left, crisp(y(v)));
    ctx.lineTo(plot.right, crisp(y(v)));
    ctx.stroke();
    if (labelled - y(v) < 13) continue; // on a very short plot, labels would run into each other
    ctx.fillText(v.toFixed(decimals), plot.left - 8, y(v));
    labelled = y(v);
  }
  const maxTicks = Math.max(2, Math.floor((plot.right - plot.left) / 96));
  const time = timeTicks(from, to, maxTicks, new Date(to).getTimezoneOffset() * 60_000);
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  for (const t of time.ticks) {
    ctx.beginPath();
    ctx.moveTo(crisp(x(t)), plot.top);
    ctx.lineTo(crisp(x(t)), plot.bottom);
    ctx.stroke();
    const label = formatClock(t, time.stepMs < 60_000);
    const half = ctx.measureText(label).width / 2;
    if (x(t) - half >= 0 && x(t) + half <= width) ctx.fillText(label, x(t), height - 6);
  }

  const gapMs = Math.max(GAP_MS, (3 * (to - from)) / (plot.right - plot.left));
  ctx.lineWidth = 2;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  for (const trace of traces) {
    for (const run of splitAtGaps(trace.points, gapMs)) {
      const first = run[0];
      const last = run.at(-1);
      if (!first || !last) continue;
      const line = new Path2D();
      for (const point of run) line.lineTo(x(point.t), y(point.v));
      if (traces.length === 1) {
        // a wash under a lone trace; two traces on one plot would only muddy each other
        const area = new Path2D(line);
        area.lineTo(x(last.t), plot.bottom);
        area.lineTo(x(first.t), plot.bottom);
        area.closePath();
        const wash = ctx.createLinearGradient(0, plot.top, 0, plot.bottom);
        wash.addColorStop(0, `${trace.color}3d`);
        wash.addColorStop(1, `${trace.color}05`);
        ctx.fillStyle = wash;
        ctx.fill(area);
      }
      ctx.strokeStyle = trace.color;
      ctx.setLineDash(trace.dash ?? []);
      ctx.stroke(line);
    }
  }
  ctx.setLineDash([]);

  const ring = surface.color("--plot");
  const dot = (point: Point, color: string) => {
    ctx.beginPath();
    ctx.arc(x(point.t), y(point.v), 4, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = ring;
    ctx.stroke();
  };
  if (view.cursor === undefined) {
    // the live end of each trace
    for (const trace of traces) {
      const last = trace.points.at(-1);
      if (last) dot(last, trace.color);
    }
    return;
  }
  ctx.strokeStyle = surface.color("--text-2");
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(crisp(x(view.cursor)), plot.top);
  ctx.lineTo(crisp(x(view.cursor)), plot.bottom);
  ctx.stroke();
  for (const trace of traces) if (trace.marker) dot(trace.marker, trace.color);
}

/** Splits a series where consecutive points are more than `gapMs` apart, so a pause in the readings is not bridged by a line */
export function splitAtGaps(points: Point[], gapMs: number): Point[][] {
  const out: Point[][] = [];
  let run: Point[] = [];
  let previous: Point | undefined;
  for (const point of points) {
    if (previous && point.t - previous.t > gapMs) {
      out.push(run);
      run = [];
    }
    run.push(point);
    previous = point;
  }
  if (run.length > 0) out.push(run);
  return out;
}

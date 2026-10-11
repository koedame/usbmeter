import type { Metric, Sample } from "./history.ts";

export const METRICS: Record<Metric, { label: string; unit: string }> = {
  power: { label: "Power", unit: "W" },
  voltage: { label: "Voltage", unit: "V" },
  current: { label: "Current", unit: "A" },
};

interface Colors {
  line: string;
  grid: string;
  text: string;
}

function readColors(canvas: HTMLCanvasElement): Colors {
  const style = getComputedStyle(canvas);
  const pick = (name: string) => style.getPropertyValue(name).trim();
  return { line: pick("--chart-line"), grid: pick("--chart-grid"), text: pick("--chart-text") };
}

/** A round step (1, 2, 5 × 10ⁿ) so the y-axis labels read 0, 0.5, 1 rather than 0.37, 0.74 */
export function niceStep(span: number, ticks: number): number {
  const rough = span / ticks;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const unit = rough / magnitude;
  const nice = unit <= 1 ? 1 : unit <= 2 ? 2 : unit <= 5 ? 5 : 10;
  return nice * magnitude;
}

export function drawChart(canvas: HTMLCanvasElement, samples: Sample[], metric: Metric): void {
  const ratio = window.devicePixelRatio || 1;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, width, height);
  const colors = readColors(canvas);
  ctx.font = "12px system-ui, sans-serif";
  ctx.fillStyle = colors.text;

  const first = samples[0];
  const last = samples.at(-1);
  if (!first || !last) {
    ctx.textAlign = "center";
    ctx.fillText("No readings yet", width / 2, height / 2);
    return;
  }

  const values = samples.map((s) => s.reading[metric]);
  const max = Math.max(...values, 0);
  const min = Math.min(...values, 0);
  const step = niceStep(Math.max(max - min, 1e-6), 4);
  const top = Math.ceil(max / step) * step || step;
  const bottom = Math.floor(min / step) * step;

  const plot = { left: 44, right: width - 12, top: 10, bottom: height - 24 };
  const x = (t: number) =>
    last.t === first.t
      ? plot.right
      : plot.left + ((t - first.t) / (last.t - first.t)) * (plot.right - plot.left);
  const y = (v: number) => plot.bottom - ((v - bottom) / (top - bottom)) * (plot.bottom - plot.top);

  ctx.strokeStyle = colors.grid;
  ctx.lineWidth = 1;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (let v = bottom; v <= top + step / 2; v += step) {
    ctx.beginPath();
    ctx.moveTo(plot.left, y(v));
    ctx.lineTo(plot.right, y(v));
    ctx.stroke();
    ctx.fillText(Number(v.toPrecision(6)).toString(), plot.left - 6, y(v));
  }

  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.fillText(formatElapsed(first.t), plot.left, height - 6);
  ctx.textAlign = "right";
  ctx.fillText(formatElapsed(last.t), plot.right, height - 6);

  ctx.strokeStyle = colors.line;
  ctx.lineWidth = 2;
  ctx.lineJoin = "round";
  ctx.beginPath();
  samples.forEach((s, i) => {
    const px = x(s.t);
    const py = y(s.reading[metric]);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.stroke();
}

function formatElapsed(ms: number): string {
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m > 0 ? `${m} min ${String(s).padStart(2, "0")} s` : `${s} s`;
}

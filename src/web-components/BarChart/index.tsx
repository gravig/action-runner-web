/**
 * BarChart web-component.
 *
 * Rendered when a projection's BackendComponent has `type: "BarChart"`.
 * All configuration comes through the opaque `props` bag passed by the backend.
 */

// ─── Props declaration ────────────────────────────────────────────────────────

/** A single data series shown in the chart. */
export type BarChartSeriesItem = {
  /** X-axis label. */
  label: string;
  /** Numeric value (height of the bar). */
  value: number;
  /** Optional bar colour override (CSS colour string). */
  color?: string;
};

export type BarChartProps = {
  /** Chart title displayed above the bar area. */
  title?: string;
  /** One or more value series to render as grouped bars. */
  data: BarChartSeriesItem[];
  /** Optional Y-axis label. */
  yLabel?: string;
};

/** Web-component declaration, consumed by the registry. */
export const declaration = {
  name: "BarChart" as const,
  props: {} as BarChartProps,
};

/**
 * Prop definitions for the ProjectionEditor.
 * Each entry describes one configurable prop and whether it can be driven
 * by an action result (supportsAction: true) or only by a static value.
 */
export const propDefs = [
  {
    name: "title" as const,
    required: false,
    description: "Chart title displayed above the bars.",
    supportsAction: false,
    defaultStatic: '""',
  },
  {
    name: "data" as const,
    required: true,
    description: "Array of { label, value, color? } items for each bar.",
    supportsAction: true,
    defaultStatic: '[{"label": "A", "value": 0}]',
  },
  {
    name: "yLabel" as const,
    required: false,
    description: "Label for the Y axis.",
    supportsAction: false,
    defaultStatic: '""',
  },
] as const;

// ─── Rendering ────────────────────────────────────────────────────────────────

const PALETTE = [
  "#6366f1",
  "#22d3ee",
  "#f59e0b",
  "#34d399",
  "#f43f5e",
  "#a78bfa",
  "#fb923c",
  "#4ade80",
];

const CHART_H = 200;
const BAR_GAP = 6;
const AXIS_LEFT = 44;
const AXIS_BOTTOM = 36;
const PADDING_TOP = 16;
const PADDING_RIGHT = 16;

function getYTicks(max: number, steps = 5): number[] {
  if (max === 0) return [0];
  const raw = max / steps;
  const magnitude = Math.pow(10, Math.floor(Math.log10(raw)));
  const niceFractions = [1, 2, 2.5, 5, 10];
  const nice =
    niceFractions.find((f) => f * magnitude >= raw) ?? 10 * magnitude;
  const ticks: number[] = [];
  for (let i = 0; i <= steps; i++) ticks.push(Math.round(nice * i * 10) / 10);
  return ticks;
}

export function BarChart({ title, data, yLabel }: BarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-xs text-slate-500 italic">
        No data
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 0);
  const yTicks = getYTicks(maxValue);
  const yMax = yTicks[yTicks.length - 1];

  // We use a viewBox so the chart scales to any container width.
  // Chart area width is calculated dynamically using the number of bars.
  const totalBars = data.length;
  const viewW = 500;
  const chartAreaW = viewW - AXIS_LEFT - PADDING_RIGHT;
  const barW = Math.max(
    4,
    (chartAreaW - BAR_GAP * (totalBars + 1)) / totalBars,
  );

  const scaleY = (v: number) =>
    PADDING_TOP + (CHART_H - PADDING_TOP - AXIS_BOTTOM) * (1 - v / yMax);

  const barBottom = CHART_H - AXIS_BOTTOM;

  return (
    <div className="flex flex-col gap-2">
      {title && (
        <p className="text-xs font-semibold text-slate-300 truncate">{title}</p>
      )}
      <svg
        viewBox={`0 0 ${viewW} ${CHART_H}`}
        className="w-full"
        style={{ minHeight: 120 }}
        role="img"
        aria-label={title ?? "Bar chart"}
      >
        {/* Y gridlines + tick labels */}
        {yTicks.map((tick) => {
          const y = scaleY(tick);
          return (
            <g key={tick}>
              <line
                x1={AXIS_LEFT}
                x2={viewW - PADDING_RIGHT}
                y1={y}
                y2={y}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth={1}
              />
              <text
                x={AXIS_LEFT - 6}
                y={y + 4}
                textAnchor="end"
                fontSize={9}
                fill="#64748b"
              >
                {tick}
              </text>
            </g>
          );
        })}

        {/* Y axis label */}
        {yLabel && (
          <text
            x={10}
            y={CHART_H / 2}
            textAnchor="middle"
            fontSize={9}
            fill="#64748b"
            transform={`rotate(-90, 10, ${CHART_H / 2})`}
          >
            {yLabel}
          </text>
        )}

        {/* Bars + X labels */}
        {data.map((item, i) => {
          const x = AXIS_LEFT + BAR_GAP + i * (barW + BAR_GAP) + BAR_GAP / 2;
          const barH = Math.max(1, barBottom - scaleY(item.value));
          const barY = barBottom - barH;
          const fill = item.color ?? PALETTE[i % PALETTE.length];

          return (
            <g key={i}>
              <rect
                x={x}
                y={barY}
                width={barW}
                height={barH}
                rx={2}
                fill={fill}
                opacity={0.85}
              />
              {/* Value label on top of bar */}
              <text
                x={x + barW / 2}
                y={barY - 3}
                textAnchor="middle"
                fontSize={8}
                fill="#94a3b8"
              >
                {item.value}
              </text>
              {/* X-axis label */}
              <text
                x={x + barW / 2}
                y={barBottom + 14}
                textAnchor="middle"
                fontSize={9}
                fill="#64748b"
              >
                {item.label.length > 8
                  ? item.label.slice(0, 7) + "…"
                  : item.label}
              </text>
            </g>
          );
        })}

        {/* Axes */}
        <line
          x1={AXIS_LEFT}
          y1={PADDING_TOP}
          x2={AXIS_LEFT}
          y2={barBottom}
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={1}
        />
        <line
          x1={AXIS_LEFT}
          y1={barBottom}
          x2={viewW - PADDING_RIGHT}
          y2={barBottom}
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={1}
        />
      </svg>
    </div>
  );
}

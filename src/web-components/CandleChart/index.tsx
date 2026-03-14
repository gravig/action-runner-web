/**
 * CandleChart — TradingView Lightweight Charts candlestick chart.
 *
 * Expected `data` format (array of OHLCV records):
 *   [{ time: "2024-01-01", open: 100, high: 110, low: 95, close: 105 }, ...]
 *
 * `time` can be a "YYYY-MM-DD" string or a UTC unix timestamp (number).
 */

import { useEffect, useRef } from "react";
import {
  createChart,
  CandlestickSeries,
  createSeriesMarkers,
} from "lightweight-charts";
import type { SeriesMarker } from "lightweight-charts";
import type { WebComponentDeclaration } from "../registry";
import type { PropDef } from "../registry";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CandleRecord {
  time: string | number;
  open: number;
  high: number;
  low: number;
  close: number;
}

/**
 * A single event marker to overlay on the time axis.
 * The marker appears as a labeled arrow above or below the candle.
 */
export interface ChartEvent {
  /** Must match the exact time value used in a candle record. */
  time: string | number;
  /** Short label shown next to the marker (e.g. "Earnings", "Fed Rate"). */
  label: string;
  /** Marker color. Defaults to amber #f59e0b. */
  color?: string;
  /** Arrow direction. Defaults to "arrowUp". */
  shape?: "arrowUp" | "arrowDown" | "circle" | "square";
  /** Whether the marker sits above or below the bar. Defaults to "aboveBar". */
  position?: "aboveBar" | "belowBar" | "inBar";
}

export interface CandleChartProps {
  title?: string;
  data?: CandleRecord[];
  events?: ChartEvent[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CandleChart({
  title,
  data = [],
  events = [],
}: CandleChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const chart = createChart(el, {
      autoSize: true,
      layout: {
        background: { color: "transparent" },
        textColor: "#94a3b8",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.05)" },
        horzLines: { color: "rgba(255,255,255,0.05)" },
      },
      crosshair: {
        vertLine: { color: "rgba(148,163,184,0.3)" },
        horzLine: { color: "rgba(148,163,184,0.3)" },
      },
      rightPriceScale: {
        borderColor: "rgba(255,255,255,0.1)",
      },
      timeScale: {
        borderColor: "rgba(255,255,255,0.1)",
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: true,
      handleScale: true,
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderUpColor: "#22c55e",
      borderDownColor: "#ef4444",
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    if (data.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      series.setData(data as any);

      // Overlay event markers on the time axis
      if (events.length > 0) {
        const markers: SeriesMarker<string | number>[] = events.map((ev) => ({
          time: ev.time,
          position: ev.position ?? "aboveBar",
          shape: ev.shape ?? "arrowUp",
          color: ev.color ?? "#f59e0b",
          text: ev.label,
        }));
        // Sort markers by time (required by lightweight-charts)
        markers.sort((a, b) => {
          const ta = typeof a.time === "string" ? a.time : String(a.time);
          const tb = typeof b.time === "string" ? b.time : String(b.time);
          return ta < tb ? -1 : ta > tb ? 1 : 0;
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        createSeriesMarkers(series as any, markers);
      }

      chart.timeScale().fitContent();
    }

    return () => {
      chart.remove();
    };
    // Intentionally re-mount the chart when data or events change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, events]);

  return (
    <div className="flex flex-col h-full min-h-0">
      {title && (
        <p className="px-1 py-1 text-xs font-semibold shrink-0 text-slate-300">
          {title}
        </p>
      )}
      <div ref={containerRef} className="flex-1 w-full min-h-0" />
    </div>
  );
}

// ─── Declaration (for backend type reference) ─────────────────────────────────

export const declaration: WebComponentDeclaration = {
  name: "CandleChart",
  props: {
    title: "string?",
    data: "CandleRecord[]",
    events: "ChartEvent[]?",
  },
};

// ─── PropDefs (for the projection editor) ─────────────────────────────────────

export const propDefs: readonly PropDef[] = [
  {
    name: "title",
    required: false,
    description: "Chart heading shown above the candlestick series",
    supportsAction: false,
    defaultStatic: '""',
  },
  {
    name: "data",
    required: true,
    description: "Array of OHLCV candles: { time, open, high, low, close }",
    supportsAction: true,
    defaultStatic: JSON.stringify(
      [
        { time: "2024-01-01", open: 100, high: 110, low: 95, close: 105 },
        { time: "2024-01-02", open: 105, high: 115, low: 100, close: 108 },
        { time: "2024-01-03", open: 108, high: 112, low: 102, close: 103 },
        { time: "2024-01-04", open: 103, high: 107, low: 97, close: 99 },
        { time: "2024-01-05", open: 99, high: 104, low: 94, close: 102 },
        { time: "2024-01-08", open: 102, high: 118, low: 101, close: 115 },
        { time: "2024-01-09", open: 115, high: 120, low: 110, close: 112 },
        { time: "2024-01-10", open: 112, high: 116, low: 108, close: 114 },
      ],
      null,
      2,
    ),
  },
  {
    name: "events",
    required: false,
    description:
      "Optional event markers on the time axis: { time, label, color?, shape?, position? }",
    supportsAction: false,
    defaultStatic: JSON.stringify(
      [
        {
          time: "2024-01-03",
          label: "Earnings",
          color: "#f59e0b",
          shape: "arrowUp",
          position: "aboveBar",
        },
        {
          time: "2024-01-08",
          label: "Fed Rate",
          color: "#38bdf8",
          shape: "arrowUp",
          position: "aboveBar",
        },
        {
          time: "2024-01-04",
          label: "Downgrade",
          color: "#f87171",
          shape: "arrowDown",
          position: "belowBar",
        },
      ],
      null,
      2,
    ),
  },
];

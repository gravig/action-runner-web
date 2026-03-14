import type { Projection, ProjectionListResponse } from "../types/projections";

// ─── Mock projections list ─────────────────────────────────────────────────────

export const MOCK_PROJECTIONS_LIST: ProjectionListResponse = {
  count: 4,
  projections: [
    { id: "mock-weekly-sales", title: "Weekly Sales" },
    { id: "mock-category-breakdown", title: "Category Breakdown" },
    { id: "mock-stock-overview", title: "Stock Overview" },
    { id: "mock-market-candles", title: "Market Candles (AAPL)" },
  ],
};

// ─── Mock projection details ───────────────────────────────────────────────────

export const MOCK_PROJECTIONS: Record<string, Projection> = {
  "mock-weekly-sales": {
    id: "mock-weekly-sales",
    title: "Weekly Sales",
    web_components: [
      {
        type: "BarChart",
        props: {
          title: "Revenue (last 7 days)",
          yLabel: "CHF",
          data: [
            { label: "Mon", value: 4200 },
            { label: "Tue", value: 5800 },
            { label: "Wed", value: 3900 },
            { label: "Thu", value: 7100 },
            { label: "Fri", value: 8600 },
            { label: "Sat", value: 11200 },
            { label: "Sun", value: 6400 },
          ],
        },
      },
      {
        type: "BarChart",
        props: {
          title: "Orders (last 7 days)",
          yLabel: "orders",
          data: [
            { label: "Mon", value: 38 },
            { label: "Tue", value: 51 },
            { label: "Wed", value: 29 },
            { label: "Thu", value: 64 },
            { label: "Fri", value: 77 },
            { label: "Sat", value: 93 },
            { label: "Sun", value: 55 },
          ],
        },
      },
    ],
  },

  "mock-category-breakdown": {
    id: "mock-category-breakdown",
    title: "Category Breakdown",
    web_components: [
      {
        type: "BarChart",
        props: {
          title: "Product count by category",
          data: [
            { label: "Dairy", value: 142, color: "#22d3ee" },
            { label: "Produce", value: 98, color: "#34d399" },
            { label: "Bakery", value: 67, color: "#f59e0b" },
            { label: "Meat", value: 55, color: "#f43f5e" },
            { label: "Frozen", value: 43, color: "#a78bfa" },
            { label: "Snacks", value: 110, color: "#fb923c" },
          ],
        },
      },
    ],
  },

  "mock-stock-overview": {
    id: "mock-stock-overview",
    title: "Stock Overview",
    web_components: [
      {
        type: "BarChart",
        props: {
          title: "Current stock levels",
          yLabel: "units",
          data: [
            { label: "Milk", value: 320 },
            { label: "Eggs", value: 480 },
            { label: "Bread", value: 150 },
            { label: "Butter", value: 95 },
            { label: "Cheese", value: 210 },
          ],
        },
      },
      {
        type: "BarChart",
        props: {
          title: "Restocked (this week)",
          yLabel: "units",
          data: [
            { label: "Milk", value: 200, color: "#34d399" },
            { label: "Eggs", value: 300, color: "#34d399" },
            { label: "Bread", value: 80, color: "#34d399" },
            { label: "Butter", value: 60, color: "#34d399" },
            { label: "Cheese", value: 120, color: "#34d399" },
          ],
        },
      },
    ],
  },

  "mock-market-candles": {
    id: "mock-market-candles",
    title: "Market Candles (AAPL)",
    web_components: [
      {
        type: "CandleChart",
        props: {
          title: "AAPL — Daily",
          data: [
            {
              time: "2024-01-02",
              open: 185.0,
              high: 188.5,
              low: 184.2,
              close: 186.9,
            },
            {
              time: "2024-01-03",
              open: 186.9,
              high: 187.6,
              low: 183.1,
              close: 184.3,
            },
            {
              time: "2024-01-04",
              open: 184.3,
              high: 185.9,
              low: 181.0,
              close: 182.9,
            },
            {
              time: "2024-01-05",
              open: 182.9,
              high: 184.4,
              low: 180.5,
              close: 183.7,
            },
            {
              time: "2024-01-08",
              open: 183.7,
              high: 188.2,
              low: 183.0,
              close: 187.2,
            },
            {
              time: "2024-01-09",
              open: 187.2,
              high: 189.3,
              low: 185.6,
              close: 185.2,
            },
            {
              time: "2024-01-10",
              open: 185.2,
              high: 187.4,
              low: 184.2,
              close: 186.2,
            },
            {
              time: "2024-01-11",
              open: 186.2,
              high: 187.7,
              low: 183.7,
              close: 185.6,
            },
            {
              time: "2024-01-12",
              open: 185.6,
              high: 188.3,
              low: 185.1,
              close: 187.2,
            },
            {
              time: "2024-01-16",
              open: 187.2,
              high: 191.0,
              low: 186.7,
              close: 190.0,
            },
            {
              time: "2024-01-17",
              open: 190.0,
              high: 190.1,
              low: 186.4,
              close: 188.6,
            },
            {
              time: "2024-01-18",
              open: 188.6,
              high: 191.3,
              low: 188.0,
              close: 190.0,
            },
            {
              time: "2024-01-19",
              open: 190.0,
              high: 193.8,
              low: 189.2,
              close: 191.6,
            },
            {
              time: "2024-01-22",
              open: 191.6,
              high: 192.2,
              low: 189.3,
              close: 192.0,
            },
            {
              time: "2024-01-23",
              open: 192.0,
              high: 194.3,
              low: 191.2,
              close: 193.4,
            },
            {
              time: "2024-01-24",
              open: 193.4,
              high: 194.6,
              low: 191.8,
              close: 194.2,
            },
            {
              time: "2024-01-25",
              open: 194.2,
              high: 197.5,
              low: 193.5,
              close: 195.5,
            },
            {
              time: "2024-01-26",
              open: 195.5,
              high: 196.3,
              low: 192.1,
              close: 192.9,
            },
            {
              time: "2024-01-29",
              open: 192.9,
              high: 195.2,
              low: 192.4,
              close: 194.5,
            },
            {
              time: "2024-01-30",
              open: 194.5,
              high: 196.0,
              low: 193.1,
              close: 191.7,
            },
          ],
        },
      },
    ],
  },
};

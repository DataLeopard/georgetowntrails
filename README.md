# Reactor — Georgetown TX Trail Tracker

Interactive trail and route tracker for Georgetown, Texas built with React, Vite, and Leaflet. Maps every hike, run, and walk across the Georgetown trail system with GPS route overlays on OpenStreetMap tiles.

## Features

- **Interactive Leaflet map** with color-coded route polylines for each trail
- **Collapsible sidebar** showing all logged routes with distance, duration, and field notes
- **Time-based grouping** — toggle between Days, Weeks, and Months views to see activity patterns
- **Route highlighting** — click any route in the sidebar or on the map to focus it; bottom banner shows stats
- **Trail vs Road classification** — visual badges distinguish trail runs from road routes
- **Weekly/monthly mileage rollups** — aggregated distance totals per time period

## Trails Tracked

| Route | Type | Distance | Duration |
|-------|------|----------|----------|
| San Gabriel River Trail - North | Trail | 4.2 mi | 1h 10m |
| Berry Springs Park Loop | Trail | 3.1 mi | 52m |
| Georgetown Lake Trail | Trail | 5.8 mi | 1h 35m |
| Old Town Georgetown Loop | Road | 2.4 mi | 38m |
| Garey Park Trail | Trail | 3.7 mi | 1h 02m |
| San Gabriel River - South Stretch | Trail | 6.1 mi | 1h 48m |
| Rivery Park Connector | Road | 1.9 mi | 28m |

**Total: 7 routes · 27.2 miles**

## Tech Stack

- **React 19** — UI components
- **Vite 6** — build tooling and dev server
- **Leaflet** — interactive map with OpenStreetMap tiles
- **CSS** — custom dark theme, no framework

## Getting Started

```bash
npm install
npm run dev       # Start dev server at http://localhost:5173
npm run build     # Build for production
npm run preview   # Preview production build
```

## Screenshot

Dark-themed map interface with a scrollable sidebar listing routes grouped by week, and an interactive map showing color-coded GPS traces across Georgetown, TX.

---

Built in the Lab · 2026

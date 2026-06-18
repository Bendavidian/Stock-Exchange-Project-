# StockEx — Nasdaq Stock Dashboard

A vanilla JavaScript stock market dashboard. No build tools, no frameworks, no npm — just HTML, CSS, and ES6 modules served with Live Server.

## Demo

<video src="public/Screen%20Recording%202026-06-18%20at%2014.09.03.mov" controls width="100%" style="max-width:100%;border-radius:12px;"></video>

---

## Features

### Search Page (`index.html`)
- **Live stock search** — debounced input queries the FMP Stable API across three endpoints with automatic fallback
- **Autocomplete suggestions** — keyboard-navigable dropdown showing up to 8 results
- **Glassmorphism result cards** — each card shows logo, symbol, company name, current price, change %, exchange badge
- **Search-term highlighting** — matched substring highlighted in both company name and ticker symbol; XSS-safe (`createTextNode` / `span.textContent`, no `innerHTML`)
- **Compare bar** — select 2–3 stocks and navigate directly to the comparison page
- **Animated WebGL shader background** — 5 drifting Gaussian glow orbs (indigo, purple, cyan, blue); fades out when the mouse is active so the ink-reveal shows through
- **Falling particles layer** — 60 slow-falling glowing dots / shooting stars on a transparent canvas above the shader
- **Ink-reveal mouse effect** — moving the mouse carves transparent holes in the dark canvas, revealing the background image beneath
- **Scrolling ticker tape** — live prices and % changes for AAPL, MSFT, NVDA, TSLA, AMZN, META, GOOGL

### Company Profile Page (`company.html?symbol=AAPL`)
- Company hero: logo, symbol, name, exchange badge, currency badge
- Real-time price, change, and % change with color coding (green / red)
- Key metrics grid: market cap, P/E, EPS, 52-week high/low, volume, beta
- 60-day price history chart (Chart.js, loaded from CDN on demand)
- Company description, sector, industry, CEO, employees, country, website link

### Stock Comparison Page (`compare.html?symbols=AAPL,MSFT,NVDA`)
- Side-by-side cards for 2–3 stocks with logos, prices, change badges, and key metrics
- Full comparison table: price, change %, market cap, P/E, EPS, volume, avg volume, 52-week range, sector, industry
- Multi-line price history chart overlaying all selected stocks
- Input validation: fewer than 2 symbols shows a clear error with a **Back to Search** button
- Graceful partial failure: if one symbol has no data the others still render

### Visual Design
- Dark finance theme — CSS custom properties inspired by Bloomberg / TradingView
- Glassmorphism cards — `backdrop-filter: blur(18px)` + layered shadows + hover lift animation
- Responsive grid — 3 columns → 2 → 1 based on viewport width
- StockEx logo — shown in all page headers, breadcrumbs, favicon, Apple touch icon, and Open Graph image

---

## Getting Started

1. Open the project folder in VS Code.
2. Install the **Live Server** extension if you haven't already.
3. Right-click `index.html` → **Open with Live Server**.

The app runs entirely in the browser — no server, no build step.

---

## API Key

This project uses the [Financial Modeling Prep](https://financialmodelingprep.com/) Stable API.

Open `js/config.js`:

```js
export const API_KEY = 'YOUR_API_KEY_HERE';
export const USE_MOCK_DATA = false; // set to true to avoid API quota during development
```

- Register for a free key at [financialmodelingprep.com](https://financialmodelingprep.com/)
- While `USE_MOCK_DATA = true` the app uses built-in data for 7 major Nasdaq stocks (AAPL, MSFT, NVDA, TSLA, AMZN, META, GOOGL) and makes no network requests

---

## Project Structure

```
├── index.html                       Search page — main entry point
├── company.html                     Company profile page
├── compare.html                     Side-by-side stock comparison page
├── public/
│   ├── 1.png                        Ink-reveal background image
│   ├── 2.png                        StockEx logo (also favicon + OG image)
│   └── Screen Recording …mov        Demo video
├── css/
│   └── style.css                    Dark finance styles + CSS custom properties
└── js/
    ├── config.js                    API key, base URL, mock-data flag
    ├── api.js                       All FMP API calls — search, profile, quote, batch, historical
    ├── utils.js                     Pure helpers: createElement, debounce, createHighlightedText, …
    ├── Marquee.js                   Scrolling ticker tape
    ├── SearchForm.js                Search input with debounce and keyboard autocomplete
    ├── SearchResult.js              Result card grid with search-term highlighting
    ├── CompareList.js               Compare chip bar — tracks selected symbols
    ├── CompanyInfo.js               Company hero, metrics grid, 60-day chart
    ├── ComparePage.js               Comparison cards, metric table, multi-line chart
    ├── inkRevealStatic.js           Canvas ink-reveal mouse interaction
    ├── shaderBackground.js          WebGL animated shader (index.html only)
    ├── fallingParticles.js          Canvas falling-particles / shooting-star layer (index.html only)
    ├── main.js                      Entry point — index.html
    ├── company.js                   Entry point — company.html
    └── compare.js                   Entry point — compare.html
```

---

## Pages

| Page | URL | Description |
|------|-----|-------------|
| Search | `index.html` | Search Nasdaq stocks by name or ticker; add 2–3 to compare |
| Company | `company.html?symbol=AAPL` | Full profile, real-time price, 60-day chart, key stats |
| Compare | `compare.html?symbols=AAPL,MSFT` | Side-by-side metric table and overlaid price history chart |

---

## Tech Stack

| Layer | Choice |
|---|---|
| Language | Vanilla JavaScript — ES6 classes and modules (`type="module"`) |
| Styles | Plain CSS — custom properties, Grid, Flexbox, `backdrop-filter` |
| Charts | [Chart.js](https://www.chartjs.org/) — loaded from CDN, no local install |
| Animated background | WebGL fragment shader (hand-written GLSL) |
| Particle layer | Canvas 2D — 60 falling dots with optional shooting-star trails |
| Ink reveal | Canvas 2D with `destination-out` compositing |
| API | [Financial Modeling Prep](https://financialmodelingprep.com/) Stable API |
| Dev server | VS Code [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension |
| Build tools | **None** — no npm, no bundler, no transpiler |

---

## Security

- All API and user-supplied text is inserted via `textContent` or `createElement` — never `innerHTML`
- Search highlighting uses `indexOf` (not `RegExp`) so special regex characters in queries are treated literally
- External links use `rel="noopener noreferrer"`

# Stock Exchange — Nasdaq Search

A vanilla JavaScript stock market dashboard. No build tools, no frameworks — just HTML, CSS, and ES6 modules served with Live Server.

## Getting Started

1. Open the project folder in VS Code.
2. Install the **Live Server** extension if you haven't already.
3. Right-click `index.html` → **Open with Live Server**.

## API Key

This project uses the [Financial Modeling Prep](https://financialmodelingprep.com/) API.

1. Register for a free API key at financialmodelingprep.com.
2. Open `js/config.js` and replace `YOUR_API_KEY_HERE` with your key.

## Project Structure

```
├── index.html          Search page — main entry point
├── company.html        Company profile page
├── compare.html        Side-by-side stock comparison page
├── css/
│   └── style.css       Dark finance dashboard styles
└── js/
    ├── config.js       API key and base URL constants
    ├── api.js          API fetch functions (searchCompanies, getCompanyProfile, …)
    ├── utils.js        Pure helper functions (createElement, debounce, …)
    ├── Marquee.js      Scrolling ticker tape at the top of every page
    ├── SearchForm.js   Search input with debounce and keyboard navigation
    ├── SearchResult.js Stock result cards grid
    ├── CompareList.js  "Compare" chip bar; tracks selected symbols
    ├── CompanyInfo.js  Company hero, stats grid, and description (company.html)
    ├── ComparePage.js  Comparison table renderer (compare.html)
    ├── main.js         Entry point for index.html
    ├── company.js      Entry point for company.html
    └── compare.js      Entry point for compare.html
```

## Pages

| Page | URL | Description |
|------|-----|-------------|
| Search | `index.html` | Search Nasdaq stocks, add up to 4 to compare |
| Company | `company.html?symbol=AAPL` | Full profile, price, and key stats |
| Compare | `compare.html?symbols=AAPL,MSFT` | Side-by-side metric table |

## Tech Stack

- Vanilla JavaScript — ES6 classes and modules (`type="module"`)
- Plain CSS — custom properties, CSS Grid, Flexbox
- No npm, no bundler, no framework

import { API_KEY, BASE_URL } from './config.js';

/**
 * FMP Stable search endpoints tried in order until one returns a valid array.
 * Each builder receives the trimmed query string and returns a full URL.
 *
 * Order:
 *   1. /stable/search-name  – search by company name
 *   2. /stable/search-symbol – search by ticker symbol
 *   3. /stable/search        – combined fallback (available on some plans)
 *
 * All three include &exchange=NASDAQ to keep results relevant.
 */
const _SEARCH_ENDPOINTS = [
  (q) => `${BASE_URL}/search-name?query=${encodeURIComponent(q)}&limit=10&exchange=NASDAQ&apikey=${API_KEY}`,
  (q) => `${BASE_URL}/search-symbol?query=${encodeURIComponent(q)}&limit=10&exchange=NASDAQ&apikey=${API_KEY}`,
  (q) => `${BASE_URL}/search?query=${encodeURIComponent(q)}&limit=10&exchange=NASDAQ&apikey=${API_KEY}`,
];

/**
 * Search for companies on NASDAQ, trying each stable endpoint in sequence.
 * Returns on the first endpoint that delivers a valid array response.
 * Only throws if every endpoint fails.
 *
 * @param {string} query
 * @returns {Promise<Array<{symbol, name, exchangeShortName, stockExchange, currency}>>}
 * @throws {Error} with the most recent FMP error message if all endpoints fail
 */
export async function searchCompanies(query) {
  const q = query.trim();
  if (q.length < 2) return [];

  let lastError = null;

  for (const buildUrl of _SEARCH_ENDPOINTS) {
    const url = buildUrl(q);
    try {
      const response = await fetch(url);

      if (!response.ok) {
        lastError = new Error(`HTTP ${response.status} from ${new URL(url).pathname}`);
        continue;
      }

      const data = await response.json();

      // FMP returns {"Error Message": "..."} for unavailable endpoints / bad keys
      if (!Array.isArray(data)) {
        const errMsg = data?.['Error Message'] || data?.error || data?.message
          || 'Unexpected response format.';
        lastError = new Error(errMsg);
        continue;
      }

      // Valid array — even an empty one is a legitimate "no results" response
      return data.map(_normalizeSearchResult);

    } catch (err) {
      // Network error or JSON parse failure
      lastError = err;
    }
  }

  throw lastError || new Error('All search endpoints failed.');
}

/**
 * Normalize a raw FMP search result into the stable UI shape.
 * The stable search endpoints omit stockExchange / currency; fill defensively.
 * @param {Object} item
 * @returns {{ symbol: string, name: string, exchangeShortName: string, stockExchange: string, currency: string }}
 */
function _normalizeSearchResult(item) {
  const shortExchange = item.exchangeShortName || item.exchange || '';
  return {
    symbol:            item.symbol        || '',
    name:              item.name          || item.companyName || '',
    exchangeShortName: shortExchange,
    stockExchange:     item.stockExchange || shortExchange,
    currency:          item.currency      || '',
  };
}

/**
 * Fetch full company profile using the FMP Stable API.
 * Endpoint: GET /stable/profile?symbol=AAPL&apikey=KEY
 *
 * Raw response shape (array of one object):
 *   symbol, companyName, price, beta, volAvg, mktCap, changes, changesPercentage,
 *   currency, exchange, exchangeShortName, industry, website, description,
 *   ceo, sector, country, fullTimeEmployees, image, ipoDate, …
 *
 * @param {string} symbol
 * @returns {Promise<NormalizedProfile|null>}
 * @throws {Error} on network failure or API-level error
 */
export async function getCompanyProfile(symbol) {
  if (!symbol) return null;

  // Stable API uses query-param ?symbol= instead of path param /profile/{symbol}
  const url = `${BASE_URL}/profile?symbol=${encodeURIComponent(symbol)}&apikey=${API_KEY}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  // FMP returns {"Error Message": "..."} for bad keys
  if (!Array.isArray(data)) {
    const errMsg = data['Error Message'] || data.error || 'Unexpected profile response.';
    throw new Error(errMsg);
  }

  if (!data.length) return null;
  return _normalizeProfile(data[0]);
}

/**
 * @param {Object} raw
 * @returns {NormalizedProfile}
 */
function _normalizeProfile(raw) {
  return {
    symbol:            raw.symbol            || '',
    companyName:       raw.companyName       || raw.name || '',
    image:             raw.image             || '',
    exchangeShortName: raw.exchangeShortName || raw.exchange || '',
    currency:          raw.currency          || '',
    industry:          raw.industry          || '',
    sector:            raw.sector            || '',
    ceo:               raw.ceo               || '',
    website:           raw.website           || '',
    price:             raw.price             ?? null,
    changes:           raw.changes           ?? null,
    changesPercentage: raw.changesPercentage  ?? null,
    mktCap:            raw.mktCap            ?? null,
    beta:              raw.beta              ?? null,
    volAvg:            raw.volAvg            ?? null,
    description:       raw.description       || '',
    fullTimeEmployees: raw.fullTimeEmployees  || '',
    country:           raw.country           || '',
  };
}

/**
 * Fetch historical daily price data for a symbol.
 * @param {string} symbol
 * @returns {Promise<Array<{date: string, close: number}>>}
 */
export async function getHistoricalPrice(symbol) {
  if (!symbol) return [];

  const url = `${BASE_URL}/historical-price-eod/light?symbol=${encodeURIComponent(symbol)}&apikey=${API_KEY}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (!Array.isArray(data) && !Array.isArray(data?.historical)) {
    const errMsg = data?.['Error Message'] || data?.error || 'Unexpected historical price response.';
    throw new Error(errMsg);
  }

  const rawPrices = Array.isArray(data) ? data : data.historical;

  return rawPrices
    .map(_normalizeHistoricalPrice)
    .filter((item) => item.date && item.close != null && !Number.isNaN(item.close))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-60);
}

/**
 * @param {Object} raw
 * @returns {{date: string, close: number}}
 */
function _normalizeHistoricalPrice(raw) {
  return {
    date: raw.date || '',
    close: Number(raw.close ?? raw.price ?? raw.adjClose),
  };
}

/**
 * Fetch a real-time quote using the FMP Stable API.
 * Endpoint: GET /stable/quote?symbol=AAPL&apikey=KEY
 *
 * Raw response shape (array of one object):
 *   symbol, name, price, changesPercentage, change, dayLow, dayHigh,
 *   yearHigh, yearLow, marketCap, volume, avgVolume, open, previousClose,
 *   eps, pe, sharesOutstanding, timestamp, …
 *
 * @param {string} symbol
 * @returns {Promise<NormalizedQuote|null>}
 * @throws {Error} on network failure or API-level error
 */
export async function getStockQuote(symbol) {
  if (!symbol) return null;

  // Stable API uses query-param ?symbol= instead of path param /quote/{symbol}
  const url = `${BASE_URL}/quote?symbol=${encodeURIComponent(symbol)}&apikey=${API_KEY}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (!Array.isArray(data)) {
    const errMsg = data['Error Message'] || data.error || 'Unexpected quote response.';
    throw new Error(errMsg);
  }

  if (!data.length) return null;
  return _normalizeQuote(data[0]);
}

/**
 * @param {Object} raw
 * @returns {NormalizedQuote}
 */
function _normalizeQuote(raw) {
  return {
    symbol:            raw.symbol                                    || '',
    price:             raw.price             ?? null,
    change:            raw.change            ?? null,
    changesPercentage: raw.changesPercentage  ?? raw.changePercentage ?? null,
    open:              raw.open              ?? null,
    previousClose:     raw.previousClose     ?? null,
    dayHigh:           raw.dayHigh           ?? null,
    dayLow:            raw.dayLow            ?? null,
    marketCap:         raw.marketCap         ?? null,
    pe:                raw.pe                ?? null,
    eps:               raw.eps               ?? null,
    volume:            raw.volume            ?? null,
    avgVolume:         raw.avgVolume         ?? null,
    yearHigh:          raw.yearHigh          ?? null,
    yearLow:           raw.yearLow           ?? null,
  };
}

/**
 * Fetch real-time quotes for multiple symbols at once.
 * @param {string[]} symbols
 * @returns {Promise<Array>}
 */
export async function getBatchQuotes(symbols) {
  return [];
}

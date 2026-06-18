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

const _searchCache = new Map();
const _quoteCache = new Map();
const _batchQuoteCache = new Map();
const _inFlightSearches = new Map();
const _inFlightQuotes = new Map();
const _inFlightBatchQuotes = new Map();

/**
 * Search for companies on NASDAQ, trying each stable endpoint in sequence.
 * Returns on the first endpoint that delivers a valid array response.
 * Only throws if every endpoint fails.
 *
 * @param {string} query
 * @returns {Promise<Array<{
 *   symbol, name, exchangeShortName, stockExchange, currency,
 *   price, change, changesPercentage, image
 * }>>}
 * @throws {Error} with the most recent FMP error message if all endpoints fail
 */
export async function searchCompanies(query) {
  const q = _normalizeSearchKey(query);
  if (q.length < 2) return [];

  if (_searchCache.has(q)) return _searchCache.get(q);
  if (_inFlightSearches.has(q)) return _inFlightSearches.get(q);

  const request = _fetchSearchCompanies(q)
    .then((results) => {
      _searchCache.set(q, results);
      return results;
    })
    .finally(() => {
      _inFlightSearches.delete(q);
    });

  _inFlightSearches.set(q, request);
  return request;
}

/**
 * @param {string} q
 * @returns {Promise<Array>}
 */
async function _fetchSearchCompanies(q) {
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
      return _enrichSearchResults(data.map(_normalizeSearchResult));

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
  const symbol = _normalizeSymbolKey(item.symbol || '');
  return {
    symbol,
    name:              item.name          || item.companyName || '',
    exchangeShortName: shortExchange,
    stockExchange:     item.stockExchange || shortExchange,
    currency:          item.currency      || '',
    price:             item.price             ?? null,
    change:            item.change            ?? item.changes ?? null,
    changesPercentage: item.changesPercentage ?? item.changePercentage ?? null,
    image:             item.image || _getSymbolImageUrl(symbol),
  };
}

/**
 * Enrich up to 10 search results with quote data while preserving the search API as
 * the single public entry point used by the UI.
 * @param {Array} results
 * @returns {Promise<Array>}
 */
async function _enrichSearchResults(results) {
  const limitedResults = results.slice(0, 10);
  const symbols = limitedResults
    .map((item) => item.symbol)
    .filter(Boolean);

  if (!symbols.length) return limitedResults;

  try {
    const quotes = await getBatchQuotes(symbols);
    const quotesBySymbol = new Map(
      quotes.map((quote) => [_normalizeSymbolKey(quote.symbol), quote])
    );

    return limitedResults.map((item) => {
      const quote = quotesBySymbol.get(_normalizeSymbolKey(item.symbol)) || {};
      return _normalizeEnrichedSearchResult(item, quote);
    });
  } catch (err) {
    return limitedResults.map((item) => _normalizeEnrichedSearchResult(item, null));
  }
}

/**
 * @param {Object} item
 * @param {Object|null} quote
 * @returns {{
 *   symbol: string,
 *   name: string,
 *   exchangeShortName: string,
 *   stockExchange: string,
 *   currency: string,
 *   price: number|null,
 *   change: number|null,
 *   changesPercentage: number|null,
 *   image: string
 * }}
 */
function _normalizeEnrichedSearchResult(item, quote) {
  return {
    symbol:            item.symbol            || quote?.symbol || '',
    name:              item.name              || quote?.name   || '',
    exchangeShortName: item.exchangeShortName || '',
    stockExchange:     item.stockExchange     || item.exchangeShortName || '',
    currency:          item.currency          || '',
    price:             quote?.price             ?? item.price             ?? null,
    change:            quote?.change            ?? item.change            ?? null,
    changesPercentage: quote?.changesPercentage ?? item.changesPercentage ?? null,
    image:             item.image || _getSymbolImageUrl(item.symbol || quote?.symbol || ''),
  };
}

/**
 * @param {string} symbol
 * @returns {string}
 */
function _getSymbolImageUrl(symbol) {
  return symbol
    ? `https://images.financialmodelingprep.com/symbol/${encodeURIComponent(symbol)}.png`
    : '';
}

/**
 * @param {string} query
 * @returns {string}
 */
function _normalizeSearchKey(query) {
  return String(query || '').trim().toLowerCase();
}

/**
 * @param {string} symbol
 * @returns {string}
 */
function _normalizeSymbolKey(symbol) {
  return String(symbol || '').trim().toUpperCase();
}

/**
 * @param {string[]} symbols
 * @returns {string[]}
 */
function _normalizeUniqueSymbols(symbols) {
  return [...new Set(symbols.map(_normalizeSymbolKey).filter(Boolean))].slice(0, 10);
}

/**
 * @param {string[]} symbols
 * @returns {string}
 */
function _getBatchQuoteKey(symbols) {
  return [...symbols].sort().join(',');
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
  const symbolKey = _normalizeSymbolKey(symbol);
  if (!symbolKey) return null;

  if (_quoteCache.has(symbolKey)) return _quoteCache.get(symbolKey);
  if (_inFlightQuotes.has(symbolKey)) return _inFlightQuotes.get(symbolKey);

  const request = _fetchStockQuote(symbolKey)
    .then((quote) => {
      if (quote) _quoteCache.set(symbolKey, quote);
      return quote;
    })
    .finally(() => {
      _inFlightQuotes.delete(symbolKey);
    });

  _inFlightQuotes.set(symbolKey, request);
  return request;
}

/**
 * @param {string} symbol
 * @returns {Promise<NormalizedQuote|null>}
 */
async function _fetchStockQuote(symbol) {
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
  const symbol = _normalizeSymbolKey(raw.symbol || '');
  return {
    symbol,
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
 * @returns {Promise<Array<NormalizedQuote>>}
 */
export async function getBatchQuotes(symbols) {
  const uniqueSymbols = _normalizeUniqueSymbols(symbols);
  if (!uniqueSymbols.length) return [];

  const batchKey = _getBatchQuoteKey(uniqueSymbols);
  if (_batchQuoteCache.has(batchKey)) return _batchQuoteCache.get(batchKey);
  if (_inFlightBatchQuotes.has(batchKey)) return _inFlightBatchQuotes.get(batchKey);

  const cachedQuotes = uniqueSymbols
    .map((symbol) => _quoteCache.get(symbol))
    .filter(Boolean);

  if (cachedQuotes.length === uniqueSymbols.length) {
    _batchQuoteCache.set(batchKey, cachedQuotes);
    return cachedQuotes;
  }

  const missingSymbols = uniqueSymbols.filter((symbol) => !_quoteCache.has(symbol));

  const request = _fetchBatchQuotes(missingSymbols)
    .then(({ quotes, cacheBatch }) => {
      quotes.forEach((quote) => {
        if (quote?.symbol) _quoteCache.set(_normalizeSymbolKey(quote.symbol), quote);
      });
      const combinedQuotes = uniqueSymbols
        .map((symbol) => _quoteCache.get(symbol))
        .filter(Boolean);
      if (cacheBatch && combinedQuotes.length === uniqueSymbols.length) {
        _batchQuoteCache.set(batchKey, combinedQuotes);
      }
      return combinedQuotes;
    })
    .finally(() => {
      _inFlightBatchQuotes.delete(batchKey);
    });

  _inFlightBatchQuotes.set(batchKey, request);
  return request;
}

/**
 * @param {string[]} uniqueSymbols
 * @returns {Promise<{quotes: Array<NormalizedQuote>, cacheBatch: boolean}>}
 */
async function _fetchBatchQuotes(uniqueSymbols) {
  const symbolList = uniqueSymbols.map(encodeURIComponent).join(',');
  const url = `${BASE_URL}/batch-quote?symbols=${symbolList}&apikey=${API_KEY}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      const errMsg = data?.['Error Message'] || data?.error || 'Unexpected batch quote response.';
      throw new Error(errMsg);
    }

    const quotes = data.map(_normalizeQuote);
    return { quotes, cacheBatch: true };
  } catch (err) {
    const quotes = await Promise.all(
      uniqueSymbols.map(async (symbol) => {
        try {
          return await getStockQuote(symbol);
        } catch (quoteErr) {
          return null;
        }
      })
    );

    const validQuotes = quotes.filter(Boolean);
    return {
      quotes: validQuotes,
      cacheBatch: validQuotes.length === uniqueSymbols.length,
    };
  }
}

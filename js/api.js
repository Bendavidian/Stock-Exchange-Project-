import { API_KEY, BASE_URL, USE_MOCK_DATA } from './config.js';

const MOCK_COMPANIES = [
  {
    symbol: 'AAPL',
    companyName: 'Apple Inc.',
    price: 213.88,
    change: 2.41,
    changesPercentage: 1.14,
    open: 211.12,
    previousClose: 211.47,
    dayHigh: 214.36,
    dayLow: 210.82,
    marketCap: 3270000000000,
    pe: 32.48,
    eps: 6.59,
    volume: 48921000,
    avgVolume: 54130000,
    yearHigh: 237.49,
    yearLow: 164.08,
    exchangeShortName: 'NASDAQ',
    stockExchange: 'NASDAQ Global Select',
    currency: 'USD',
    industry: 'Consumer Electronics',
    sector: 'Technology',
    ceo: 'Tim Cook',
    website: 'https://www.apple.com',
    description: 'Apple designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and services worldwide.',
    fullTimeEmployees: '164000',
    country: 'US',
    beta: 1.18,
    volAvg: 54130000,
  },
  {
    symbol: 'MSFT',
    companyName: 'Microsoft Corporation',
    price: 486.21,
    change: 3.76,
    changesPercentage: 0.78,
    open: 482.04,
    previousClose: 482.45,
    dayHigh: 487.19,
    dayLow: 480.83,
    marketCap: 3610000000000,
    pe: 36.91,
    eps: 13.17,
    volume: 20156000,
    avgVolume: 22590000,
    yearHigh: 498.12,
    yearLow: 362.90,
    exchangeShortName: 'NASDAQ',
    stockExchange: 'NASDAQ Global Select',
    currency: 'USD',
    industry: 'Software - Infrastructure',
    sector: 'Technology',
    ceo: 'Satya Nadella',
    website: 'https://www.microsoft.com',
    description: 'Microsoft develops and supports software, services, devices, and cloud infrastructure for consumers and organizations.',
    fullTimeEmployees: '228000',
    country: 'US',
    beta: 0.89,
    volAvg: 22590000,
  },
  {
    symbol: 'NVDA',
    companyName: 'NVIDIA Corporation',
    price: 142.63,
    change: 4.18,
    changesPercentage: 3.02,
    open: 138.92,
    previousClose: 138.45,
    dayHigh: 143.08,
    dayLow: 137.91,
    marketCap: 3500000000000,
    pe: 51.34,
    eps: 2.78,
    volume: 188430000,
    avgVolume: 206700000,
    yearHigh: 153.13,
    yearLow: 86.62,
    exchangeShortName: 'NASDAQ',
    stockExchange: 'NASDAQ Global Select',
    currency: 'USD',
    industry: 'Semiconductors',
    sector: 'Technology',
    ceo: 'Jensen Huang',
    website: 'https://www.nvidia.com',
    description: 'NVIDIA provides accelerated computing platforms, graphics processors, and AI infrastructure worldwide.',
    fullTimeEmployees: '29600',
    country: 'US',
    beta: 1.76,
    volAvg: 206700000,
  },
  {
    symbol: 'TSLA',
    companyName: 'Tesla, Inc.',
    price: 319.74,
    change: -5.82,
    changesPercentage: -1.79,
    open: 326.01,
    previousClose: 325.56,
    dayHigh: 328.44,
    dayLow: 318.10,
    marketCap: 1020000000000,
    pe: 88.81,
    eps: 3.60,
    volume: 92480000,
    avgVolume: 101320000,
    yearHigh: 488.54,
    yearLow: 167.41,
    exchangeShortName: 'NASDAQ',
    stockExchange: 'NASDAQ Global Select',
    currency: 'USD',
    industry: 'Auto Manufacturers',
    sector: 'Consumer Cyclical',
    ceo: 'Elon Musk',
    website: 'https://www.tesla.com',
    description: 'Tesla designs, develops, manufactures, leases, and sells electric vehicles, energy generation, and energy storage systems.',
    fullTimeEmployees: '140473',
    country: 'US',
    beta: 2.31,
    volAvg: 101320000,
  },
  {
    symbol: 'AMZN',
    companyName: 'Amazon.com, Inc.',
    price: 183.42,
    change: -1.18,
    changesPercentage: -0.64,
    open: 184.91,
    previousClose: 184.60,
    dayHigh: 185.27,
    dayLow: 182.73,
    marketCap: 1910000000000,
    pe: 47.28,
    eps: 3.88,
    volume: 38560000,
    avgVolume: 42180000,
    yearHigh: 201.20,
    yearLow: 149.91,
    exchangeShortName: 'NASDAQ',
    stockExchange: 'NASDAQ Global Select',
    currency: 'USD',
    industry: 'Internet Retail',
    sector: 'Consumer Cyclical',
    ceo: 'Andy Jassy',
    website: 'https://www.amazon.com',
    description: 'Amazon operates online retail, cloud computing, advertising, digital streaming, and logistics businesses globally.',
    fullTimeEmployees: '1525000',
    country: 'US',
    beta: 1.22,
    volAvg: 42180000,
  },
  {
    symbol: 'META',
    companyName: 'Meta Platforms, Inc.',
    price: 611.09,
    change: 6.27,
    changesPercentage: 1.04,
    open: 604.55,
    previousClose: 604.82,
    dayHigh: 613.25,
    dayLow: 602.18,
    marketCap: 1540000000000,
    pe: 28.73,
    eps: 21.27,
    volume: 13240000,
    avgVolume: 15890000,
    yearHigh: 638.40,
    yearLow: 442.65,
    exchangeShortName: 'NASDAQ',
    stockExchange: 'NASDAQ Global Select',
    currency: 'USD',
    industry: 'Internet Content & Information',
    sector: 'Communication Services',
    ceo: 'Mark Zuckerberg',
    website: 'https://about.meta.com',
    description: 'Meta builds social, messaging, advertising, virtual reality, and AI products for people and businesses.',
    fullTimeEmployees: '69329',
    country: 'US',
    beta: 1.19,
    volAvg: 15890000,
  },
  {
    symbol: 'GOOGL',
    companyName: 'Alphabet Inc.',
    price: 176.61,
    change: 0.94,
    changesPercentage: 0.54,
    open: 175.43,
    previousClose: 175.67,
    dayHigh: 177.22,
    dayLow: 174.88,
    marketCap: 2160000000000,
    pe: 22.36,
    eps: 7.90,
    volume: 24710000,
    avgVolume: 28150000,
    yearHigh: 191.75,
    yearLow: 140.53,
    exchangeShortName: 'NASDAQ',
    stockExchange: 'NASDAQ Global Select',
    currency: 'USD',
    industry: 'Internet Content & Information',
    sector: 'Communication Services',
    ceo: 'Sundar Pichai',
    website: 'https://abc.xyz',
    description: 'Alphabet operates Google Search, YouTube, cloud services, advertising platforms, and other technology businesses.',
    fullTimeEmployees: '182502',
    country: 'US',
    beta: 1.01,
    volAvg: 28150000,
  },
];

const MOCK_COMPANY_MAP = new Map(MOCK_COMPANIES.map((company) => [company.symbol, company]));

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

  if (USE_MOCK_DATA) return _mockSearchCompanies(q);

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
        lastError = new Error(_formatHttpError(response, new URL(url).pathname));
        continue;
      }

      const data = await response.json();

      // FMP returns {"Error Message": "..."} for unavailable endpoints / bad keys
      const results = _extractArrayResponse(data);
      if (!results) {
        const errMsg = data?.['Error Message'] || data?.error || data?.message
          || 'Unexpected response format.';
        lastError = new Error(errMsg);
        continue;
      }

      // Valid array — even an empty one is a legitimate "no results" response
      return _enrichSearchResults(results.map(_normalizeSearchResult));

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
    price:             _firstNumber(item, ['price']),
    change:            _firstNumber(item, ['change', 'changes']),
    changesPercentage: _firstNumber(item, ['changesPercentage', 'changePercentage']),
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
 * @param {Object} raw
 * @param {string[]} fields
 * @returns {number|null}
 */
function _firstNumber(raw, fields) {
  for (const field of fields) {
    if (raw?.[field] == null) continue;
    const value = _toNumberOrNull(raw[field]);
    if (value != null) return value;
  }
  return null;
}

/**
 * @param {*} value
 * @returns {number|null}
 */
function _toNumberOrNull(value) {
  if (value == null || value === '') return null;
  if (typeof value === 'number') return Number.isNaN(value) ? null : value;

  const normalized = String(value).replace(/[,%]/g, '').trim();
  if (!normalized) return null;

  const number = Number(normalized);
  return Number.isNaN(number) ? null : number;
}

/**
 * @param {*} data
 * @returns {Array|null}
 */
function _extractArrayResponse(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.quotes)) return data.quotes;
  if (Array.isArray(data?.data)) return data.data;
  return null;
}

/**
 * @param {Response} response
 * @param {string} endpoint
 * @returns {string}
 */
function _formatHttpError(response, endpoint) {
  if (response.status === 429) {
    return `FMP API rate limit reached while calling ${endpoint} (HTTP 429).`;
  }

  const statusText = response.statusText ? ` ${response.statusText}` : '';
  return `Request failed while calling ${endpoint}: HTTP ${response.status}${statusText}.`;
}

/**
 * @param {string} query
 * @returns {Array}
 */
function _mockSearchCompanies(query) {
  const results = MOCK_COMPANIES
    .filter((company) => (
      company.symbol.toLowerCase().includes(query) ||
      company.companyName.toLowerCase().includes(query)
    ))
    .map((company) => _normalizeSearchResult(company));

  return results.map((item) => {
    const quote = _mockGetStockQuote(item.symbol);
    return _normalizeEnrichedSearchResult(item, quote);
  });
}

/**
 * @param {string} symbol
 * @returns {NormalizedProfile|null}
 */
function _mockGetCompanyProfile(symbol) {
  const company = MOCK_COMPANY_MAP.get(_normalizeSymbolKey(symbol));
  return company ? _normalizeProfile(company) : null;
}

/**
 * @param {string} symbol
 * @returns {NormalizedQuote|null}
 */
function _mockGetStockQuote(symbol) {
  const company = MOCK_COMPANY_MAP.get(_normalizeSymbolKey(symbol));
  return company ? _normalizeQuote(company) : null;
}

/**
 * @param {string} symbol
 * @returns {Array<{date: string, close: number}>}
 */
function _mockGetHistoricalPrice(symbol) {
  const company = MOCK_COMPANY_MAP.get(_normalizeSymbolKey(symbol));
  if (!company) return [];

  const points = [];
  const baseDate = new Date('2026-06-18T00:00:00Z');
  const start = company.price * 0.88;
  const step = (company.price - start) / 59;

  for (let i = 0; i < 60; i++) {
    const date = new Date(baseDate);
    date.setUTCDate(baseDate.getUTCDate() - (59 - i));

    const wave = Math.sin(i / 4) * company.price * 0.018;
    const close = start + step * i + wave;

    points.push({
      date: date.toISOString().slice(0, 10),
      close: Number(close.toFixed(2)),
    });
  }

  return points;
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
  if (USE_MOCK_DATA) return _mockGetCompanyProfile(symbol);
  if (!symbol) return null;

  // Stable API uses query-param ?symbol= instead of path param /profile/{symbol}
  const url = `${BASE_URL}/profile?symbol=${encodeURIComponent(symbol)}&apikey=${API_KEY}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(_formatHttpError(response, '/profile'));
  }

  const data = await response.json();

  // FMP returns {"Error Message": "..."} for bad keys
  const profiles = _extractArrayResponse(data);
  if (!profiles) {
    const errMsg = data['Error Message'] || data.error || 'Unexpected profile response.';
    throw new Error(errMsg);
  }

  if (!profiles.length) return null;
  return _normalizeProfile(profiles[0]);
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
    price:             _firstNumber(raw, ['price']),
    changes:           _firstNumber(raw, ['changes', 'change']),
    changesPercentage: _firstNumber(raw, ['changesPercentage', 'changePercentage']),
    mktCap:            _firstNumber(raw, ['mktCap', 'marketCap']),
    beta:              _firstNumber(raw, ['beta']),
    volAvg:            _firstNumber(raw, ['volAvg', 'avgVolume', 'averageVolume']),
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
  if (USE_MOCK_DATA) return _mockGetHistoricalPrice(symbol);
  if (!symbol) return [];

  const url = `${BASE_URL}/historical-price-eod/light?symbol=${encodeURIComponent(symbol)}&apikey=${API_KEY}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(_formatHttpError(response, '/historical-price-eod/light'));
  }

  const data = await response.json();

  const historicalPrices = _extractArrayResponse(data) || data?.historical;
  if (!Array.isArray(historicalPrices)) {
    const errMsg = data?.['Error Message'] || data?.error || 'Unexpected historical price response.';
    throw new Error(errMsg);
  }

  return historicalPrices
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

  if (USE_MOCK_DATA) return _mockGetStockQuote(symbolKey);

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
    throw new Error(_formatHttpError(response, '/quote'));
  }

  const data = await response.json();

  const quotes = _extractArrayResponse(data);
  if (!quotes) {
    const errMsg = data['Error Message'] || data.error || 'Unexpected quote response.';
    throw new Error(errMsg);
  }

  if (!quotes.length) return null;
  return _normalizeQuote(quotes[0]);
}

/**
 * @param {Object} raw
 * @returns {NormalizedQuote}
 */
function _normalizeQuote(raw) {
  const symbol = _normalizeSymbolKey(raw.symbol || raw.ticker || '');
  return {
    symbol,
    price:             _firstNumber(raw, ['price']),
    change:            _firstNumber(raw, ['change', 'changes']),
    changesPercentage: _firstNumber(raw, ['changesPercentage', 'changePercentage']),
    open:              _firstNumber(raw, ['open']),
    previousClose:     _firstNumber(raw, ['previousClose']),
    dayHigh:           _firstNumber(raw, ['dayHigh', 'high']),
    dayLow:            _firstNumber(raw, ['dayLow', 'low']),
    marketCap:         _firstNumber(raw, ['marketCap', 'mktCap']),
    pe:                _firstNumber(raw, ['pe']),
    eps:               _firstNumber(raw, ['eps']),
    volume:            _firstNumber(raw, ['volume']),
    avgVolume:         _firstNumber(raw, ['avgVolume', 'averageVolume', 'volAvg']),
    yearHigh:          _firstNumber(raw, ['yearHigh']),
    yearLow:           _firstNumber(raw, ['yearLow']),
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

  if (USE_MOCK_DATA) return uniqueSymbols
    .map((symbol) => _mockGetStockQuote(symbol))
    .filter(Boolean);

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
      throw new Error(_formatHttpError(response, '/batch-quote'));
    }

    const data = await response.json();

    const rawQuotes = _extractArrayResponse(data);
    if (!rawQuotes) {
      const errMsg = data?.['Error Message'] || data?.error || 'Unexpected batch quote response.';
      throw new Error(errMsg);
    }

    const quotes = rawQuotes.map(_normalizeQuote);
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
    if (!validQuotes.length) {
      throw err;
    }

    return {
      quotes: validQuotes,
      cacheBatch: validQuotes.length === uniqueSymbols.length,
    };
  }
}

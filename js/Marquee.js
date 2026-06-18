import { getBatchQuotes } from './api.js';

const DEFAULT_SYMBOLS = ['AAPL', 'MSFT', 'NVDA', 'TSLA', 'AMZN', 'META', 'GOOGL'];

export default class Marquee {
  /**
   * @param {string} containerId - ID of the outer marquee wrapper element
   * @param {string} trackId     - ID of the scrolling inner track element
   */
  constructor(containerId, trackId) {
    this.container = document.getElementById(containerId);
    this.track = document.getElementById(trackId);
  }

  async init() {
    if (!this.container || !this.track) return;

    try {
      const quotes = await getBatchQuotes(DEFAULT_SYMBOLS);
      const quotesBySymbol = new Map(quotes.map((quote) => [quote.symbol, quote]));
      const tickers = DEFAULT_SYMBOLS.map((symbol) => (
        this._normalizeTicker(symbol, quotesBySymbol.get(symbol))
      ));
      this.render(tickers);
    } catch (err) {
      this.showFallback();
    }
  }

  /**
   * Render ticker items from an array of data objects.
   * @param {Array<{symbol: string, price: string, change: string, changeClass: string}>} tickers
   */
  render(tickers) {
    if (!this.track) return;
    this._clearTrack();
    this.track.classList.remove('marquee-track--fallback');

    const doubled = [...tickers, ...tickers];
    doubled.forEach(ticker => {
      this.track.appendChild(this._createItem(ticker));
    });
  }

  /**
   * @param {{symbol: string, price: string, change: string, changeClass: string}} ticker
   * @returns {HTMLElement}
   */
  _createItem(ticker) {
    const item = document.createElement('div');
    item.className = 'marquee-item';

    const symbol = document.createElement('span');
    symbol.className = 'ticker';
    symbol.textContent = ticker.symbol;

    const price = document.createElement('span');
    price.className = 'price';
    price.textContent = ticker.price;

    const change = document.createElement('span');
    change.className = `change ${ticker.changeClass}`;
    change.textContent = ticker.change;

    item.appendChild(symbol);
    item.appendChild(price);
    item.appendChild(change);
    return item;
  }

  showFallback() {
    if (!this.track) return;
    this._clearTrack();
    this.track.classList.add('marquee-track--fallback');

    const message = document.createElement('span');
    message.className = 'marquee-fallback';
    message.textContent = 'Market ticker is temporarily unavailable. Please try again shortly.';
    this.track.appendChild(message);
  }

  _normalizeTicker(symbol, quote) {
    return {
      symbol,
      price: this._formatPrice(quote?.price),
      change: this._formatChangePercent(quote?.changesPercentage),
      changeClass: this._getChangeClass(quote?.changesPercentage),
    };
  }

  _formatPrice(value) {
    if (value == null || Number.isNaN(Number(value))) return '$N/A';
    return `$${Number(value).toFixed(2)}`;
  }

  _formatChangePercent(value) {
    if (value == null || Number.isNaN(Number(value))) return 'N/A';
    const sign = Number(value) > 0 ? '+' : '';
    return `${sign}${Number(value).toFixed(2)}%`;
  }

  _getChangeClass(value) {
    if (value == null || Number.isNaN(Number(value))) return 'flat';
    if (Number(value) > 0) return 'up';
    if (Number(value) < 0) return 'down';
    return 'flat';
  }

  _clearTrack() {
    while (this.track.firstChild) {
      this.track.removeChild(this.track.firstChild);
    }
  }
}

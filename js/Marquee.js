export default class Marquee {
  /**
   * @param {string} containerId - ID of the outer marquee wrapper element
   * @param {string} trackId     - ID of the scrolling inner track element
   */
  constructor(containerId, trackId) {
    this.container = document.getElementById(containerId);
    this.track = document.getElementById(trackId);
    this.animationId = null;
    this.position = 0;
    this.speed = 0.4;
  }

  init() {
    if (!this.container || !this.track) return;
    this._loadDefaultTickers();
  }

  /**
   * Render ticker items from an array of data objects.
   * @param {Array<{symbol: string, price: string, change: string, isUp: boolean}>} tickers
   */
  render(tickers) {
    if (!this.track) return;
    this.stop();
    this.track.innerHTML = '';

    const doubled = [...tickers, ...tickers];
    doubled.forEach(ticker => {
      this.track.appendChild(this._createItem(ticker));
    });

    this.startAnimation();
  }

  /**
   * @param {{symbol: string, price: string, change: string, isUp: boolean}} ticker
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
    change.className = `change ${ticker.isUp ? 'up' : 'down'}`;
    change.textContent = ticker.change;

    item.appendChild(symbol);
    item.appendChild(price);
    item.appendChild(change);
    return item;
  }

  startAnimation() {
    const step = () => {
      if (!this.track) return;
      this.position -= this.speed;
      const halfWidth = this.track.scrollWidth / 2;
      if (Math.abs(this.position) >= halfWidth) {
        this.position = 0;
      }
      this.track.style.transform = `translateX(${this.position}px)`;
      this.animationId = requestAnimationFrame(step);
    };
    this.animationId = requestAnimationFrame(step);
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.position = 0;
  }

  _loadDefaultTickers() {
    const placeholders = [
      { symbol: 'AAPL',  price: '$—',  change: '—%', isUp: true },
      { symbol: 'MSFT',  price: '$—',  change: '—%', isUp: true },
      { symbol: 'GOOGL', price: '$—',  change: '—%', isUp: false },
      { symbol: 'AMZN',  price: '$—',  change: '—%', isUp: true },
      { symbol: 'TSLA',  price: '$—',  change: '—%', isUp: false },
      { symbol: 'NVDA',  price: '$—',  change: '—%', isUp: true },
      { symbol: 'META',  price: '$—',  change: '—%', isUp: true },
      { symbol: 'NFLX',  price: '$—',  change: '—%', isUp: false },
    ];
    this.render(placeholders);
  }
}

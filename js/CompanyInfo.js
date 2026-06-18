import { getCompanyProfile, getHistoricalPrice, getStockQuote } from './api.js';
import { isApiKeyConfigured } from './config.js';
import { createElement, formatPercent, safeText } from './utils.js';

export default class CompanyInfo {
  /**
   * @param {HTMLElement|string|null} container - Company info root element or element ID
   * @param {string|null} symbol - Ticker symbol from the URL
   */
  constructor(container, symbol) {
    this.container = typeof container === 'string'
      ? document.getElementById(container)
      : container;
    this.priceChart = null;
    this.symbol = symbol ? symbol.trim().toUpperCase() : '';
  }

  /**
   * Load and render the company detail page for this.symbol.
   */
  async load() {
    if (!this.symbol) {
      this.showError(
        'No stock symbol provided. Please go back and search for a company.'
      );
      return;
    }

    if (!isApiKeyConfigured()) {
      this.showError(
        'API key not configured. Open js/config.js and replace YOUR_API_KEY_HERE with your Financial Modeling Prep key.'
      );
      return;
    }

    document.title = `${this.symbol} — Stock Exchange`;
    this.showLoading();

    try {
      const [profileResult, quoteResult] = await Promise.allSettled([
        getCompanyProfile(this.symbol),
        getStockQuote(this.symbol),
      ]);

      if (profileResult.status === 'rejected') {
        console.error(profileResult.reason);
      }
      if (quoteResult.status === 'rejected') {
        console.error(quoteResult.reason);
      }

      const profile = profileResult.status === 'fulfilled' ? profileResult.value : null;
      const quote = quoteResult.status === 'fulfilled' ? quoteResult.value : null;

      if (!profile && !quote) {
        const errors = [profileResult, quoteResult]
          .filter((result) => result.status === 'rejected')
          .map((result) => result.reason?.message)
          .filter(Boolean);

        this.showError(
          errors.length
            ? `Failed to load company data: ${errors.join(' | ')}`
            : `No data found for symbol "${this.symbol}". It may not be listed on NASDAQ.`
        );
        return;
      }

      if (profile?.companyName) {
        document.title = `${profile.companyName} (${this.symbol}) — Stock Exchange`;
      }

      this.render(profile, quote);

      let historicalPrices = [];
      try {
        historicalPrices = await getHistoricalPrice(this.symbol);
      } catch (chartErr) {
        console.error(chartErr);
        historicalPrices = [];
      }
      this.addChart(historicalPrices);
    } catch (err) {
      console.error(err);
      this.showError(
        `Failed to load company data: ${err?.message || 'Unknown error'}`
      );
    }
  }

  /**
   * Render normalized profile and quote data. Both may be null — handle gracefully.
   *
   * Normalized profile fields:
   *   symbol, companyName, image, exchangeShortName, currency, industry,
   *   sector, ceo, website, price, changes, changesPercentage, mktCap, beta,
   *   volAvg, description, fullTimeEmployees, country
   *
   * Normalized quote fields:
   *   symbol, price, change, changesPercentage, open, previousClose,
   *   dayHigh, dayLow, marketCap, pe, eps, volume, avgVolume, yearHigh, yearLow
   *
   * @param {Object|null} profile
   * @param {Object|null} quote
   */
  render(profile, quote) {
    if (!this.container) return;
    this._clear();

    this.container.appendChild(this._buildHero(profile, quote));
    this.container.appendChild(this._buildPriceRow(quote));
    this.container.appendChild(this._buildMetrics(profile, quote));

    const hasMeta = profile && (
      profile.industry || profile.sector || profile.ceo ||
      profile.website   || profile.fullTimeEmployees || profile.country
    );
    if (hasMeta) {
      this.container.appendChild(this._buildMeta(profile));
    }

    if (profile?.description) {
      this.container.appendChild(this._buildDescription(profile.description));
    }
  }

  /**
   * Append a Chart.js historical price card.
   * @param {Array<{date: string, close: number}>} historicalPrices
   */
  addChart(historicalPrices) {
    if (!this.container) return;

    if (this.priceChart) {
      this.priceChart.destroy();
      this.priceChart = null;
    }

    const section = createElement('div', 'company-chart-card');
    section.appendChild(createElement('h2', 'section-title', 'Stock Price History'));

    if (!Array.isArray(historicalPrices) || historicalPrices.length === 0) {
      section.appendChild(
        createElement('p', 'company-chart-empty', 'No historical price data is available for this stock yet.')
      );
      this.container.appendChild(section);
      return;
    }

    const canvasWrap = createElement('div', 'company-chart-wrap');
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-label', 'Stock Price History');
    canvas.setAttribute('role', 'img');
    canvasWrap.appendChild(canvas);
    section.appendChild(canvasWrap);
    this.container.appendChild(section);

    if (!window.Chart) {
      canvasWrap.replaceWith(
        createElement('p', 'company-chart-empty', 'The price chart could not load. Please refresh the page and try again.')
      );
      return;
    }

    const labels = historicalPrices.map((item) => item.date);
    const values = historicalPrices.map((item) => item.close);

    this.priceChart = new window.Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Close Price',
            data: values,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 4,
            tension: 0.28,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index',
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = Number(context.parsed.y);
                return `Close: $${value.toFixed(2)}`;
              },
            },
          },
        },
        scales: {
          x: {
            ticks: {
              color: '#94a3b8',
              maxTicksLimit: 8,
            },
            grid: {
              color: 'rgba(148, 163, 184, 0.08)',
            },
          },
          y: {
            ticks: {
              color: '#94a3b8',
              callback: (value) => `$${Number(value).toFixed(0)}`,
            },
            grid: {
              color: 'rgba(148, 163, 184, 0.08)',
            },
          },
        },
      },
    });
  }

  showLoading() {
    if (!this.container) return;
    this._clear();
    const wrapper = createElement('div', 'loading-indicator');
    wrapper.appendChild(createElement('div', 'spinner'));
    wrapper.appendChild(createElement('span', '', 'Loading company data…'));
    this.container.appendChild(wrapper);
  }

  showError(message) {
    if (!this.container) return;
    this._clear();
    const wrapper = createElement('div', 'error-state');
    wrapper.appendChild(createElement('div', 'error-state__icon', '⚠'));
    wrapper.appendChild(createElement('p', '', 'Something went wrong'));
    wrapper.appendChild(createElement('span', '', message));
    this.container.appendChild(wrapper);
  }

  // ─── Private builders ────────────────────────────────────────────

  _clear() {
    while (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild);
    }
  }

  /**
   * Hero card: logo + identity on the left, live price + daily change on the right.
   */
  _buildHero(profile, quote) {
    const hero = createElement('div', 'company-hero');

    // ── Identity (left) ─────────────────────────────────────
    const identity = createElement('div', 'company-hero__identity');

    if (profile?.image) {
      const img = document.createElement('img');
      img.className = 'company-hero__logo';
      img.src = profile.image;
      img.alt = profile.companyName ? `${profile.companyName} logo` : '';
      img.onerror = () => { img.style.display = 'none'; };
      identity.appendChild(img);
    }

    const idText = createElement('div', 'company-hero__identity-text');

    idText.appendChild(
      createElement('div', 'company-hero__symbol',
        safeText(profile?.symbol || quote?.symbol || 'N/A'))
    );
    idText.appendChild(
      createElement('div', 'company-hero__name',
        safeText(profile?.companyName || ''))
    );

    // Exchange + currency badges — use only normalized fields
    const badgeRow = createElement('div', 'company-hero__badge-row');
    const exchange = profile?.exchangeShortName || '';
    const currency = profile?.currency || '';
    if (exchange) {
      badgeRow.appendChild(createElement('span', 'company-hero__exchange-badge', safeText(exchange)));
    }
    if (currency) {
      badgeRow.appendChild(createElement('span', 'company-hero__currency-badge', safeText(currency)));
    }
    if (badgeRow.childElementCount > 0) idText.appendChild(badgeRow);

    identity.appendChild(idText);

    // ── Pricing (right) ──────────────────────────────────────
    const pricing = createElement('div', 'company-hero__pricing');

    const rawPrice = quote?.price ?? profile?.price;
    pricing.appendChild(
      createElement('div', 'company-hero__price',
        rawPrice != null ? `$${Number(rawPrice).toFixed(2)}` : 'N/A')
    );

    const changePct = quote?.changesPercentage ?? null;
    const changeAbs = quote?.change ?? null;

    let changeText = 'N/A';
    let changeModifier = 'neutral';

    if (changeAbs != null && changePct != null) {
      const sign = changeAbs >= 0 ? '+' : '';
      changeText = `${sign}${Number(changeAbs).toFixed(2)}  (${formatPercent(changePct)})`;
      changeModifier = changePct > 0 ? 'up' : changePct < 0 ? 'down' : 'neutral';
    }

    pricing.appendChild(
      createElement('div', `company-hero__change company-hero__change--${changeModifier}`, changeText)
    );

    hero.appendChild(identity);
    hero.appendChild(pricing);
    return hero;
  }

  /**
   * Horizontal 4-cell strip: Open, Prev Close, Day High, Day Low.
   */
  _buildPriceRow(quote) {
    const row = createElement('div', 'company-price-row');

    const cells = [
      { label: 'Open',       value: quote?.open          != null ? `$${Number(quote.open).toFixed(2)}`          : 'N/A' },
      { label: 'Prev Close', value: quote?.previousClose != null ? `$${Number(quote.previousClose).toFixed(2)}` : 'N/A' },
      { label: 'Day High',   value: quote?.dayHigh       != null ? `$${Number(quote.dayHigh).toFixed(2)}`       : 'N/A' },
      { label: 'Day Low',    value: quote?.dayLow        != null ? `$${Number(quote.dayLow).toFixed(2)}`        : 'N/A' },
    ];

    cells.forEach(({ label, value }) => {
      const cell = createElement('div', 'price-cell');
      cell.appendChild(createElement('div', 'price-cell__label', label));
      cell.appendChild(createElement('div', 'price-cell__value', value));
      row.appendChild(cell);
    });

    return row;
  }

  /**
   * Key-metrics card grid: market cap, P/E, EPS, beta, volume, etc.
   */
  _buildMetrics(profile, quote) {
    const grid = createElement('div', 'company-stats');

    const metrics = [
      { label: 'Market Cap',  value: this._formatLargeNum(quote?.marketCap ?? profile?.mktCap) },
      { label: 'P/E Ratio',   value: quote?.pe  != null ? Number(quote.pe).toFixed(2)          : 'N/A' },
      { label: 'EPS',         value: quote?.eps != null ? `$${Number(quote.eps).toFixed(2)}`   : 'N/A' },
      { label: 'Beta',        value: profile?.beta != null ? Number(profile.beta).toFixed(2)   : 'N/A' },
      { label: 'Volume',      value: this._formatLargeNum(quote?.volume) },
      { label: 'Avg Volume',  value: this._formatLargeNum(quote?.avgVolume ?? profile?.volAvg) },
      { label: '52-Wk High',  value: quote?.yearHigh != null ? `$${Number(quote.yearHigh).toFixed(2)}` : 'N/A' },
      { label: '52-Wk Low',   value: quote?.yearLow  != null ? `$${Number(quote.yearLow).toFixed(2)}`  : 'N/A' },
    ];

    metrics.forEach(({ label, value }) => {
      const card = createElement('div', 'stat-card');
      card.appendChild(createElement('div', 'stat-card__label', label));
      card.appendChild(createElement('div', 'stat-card__value', value));
      grid.appendChild(card);
    });

    return grid;
  }

  /**
   * Company details card: industry, sector, CEO, employees, country, website.
   */
  _buildMeta(profile) {
    const section = createElement('div', 'company-meta-section');
    section.appendChild(createElement('h2', 'section-title', 'Company Details'));

    const grid = createElement('div', 'company-meta-grid');

    const textFields = [
      { label: 'Industry',   value: profile.industry },
      { label: 'Sector',     value: profile.sector },
      { label: 'CEO',        value: profile.ceo },
      { label: 'Employees',  value: profile.fullTimeEmployees
          ? Number(profile.fullTimeEmployees).toLocaleString()
          : '' },
      { label: 'Country',    value: profile.country },
    ];

    textFields.forEach(({ label, value }) => {
      if (!value) return;
      const item = createElement('div', 'company-meta__item');
      item.appendChild(createElement('div', 'company-meta__label', label));
      item.appendChild(createElement('div', 'company-meta__value', safeText(value)));
      grid.appendChild(item);
    });

    // Website is an anchor — href set from trusted profile data, text via textContent
    if (profile.website) {
      const item = createElement('div', 'company-meta__item');
      item.appendChild(createElement('div', 'company-meta__label', 'Website'));

      const link = document.createElement('a');
      link.className = 'company-meta__link';
      link.href = profile.website;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      try {
        link.textContent = new URL(profile.website).hostname.replace(/^www\./, '');
      } catch {
        link.textContent = profile.website;
      }
      item.appendChild(link);
      grid.appendChild(item);
    }

    section.appendChild(grid);
    return section;
  }

  /**
   * "About" description card.
   */
  _buildDescription(text) {
    const section = createElement('div', 'company-description');
    section.appendChild(createElement('h2', '', 'About'));
    section.appendChild(createElement('p', '', safeText(text)));
    return section;
  }

  _formatLargeNum(value) {
    if (value == null || isNaN(value)) return 'N/A';
    const num = Number(value);
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9)  return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6)  return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toLocaleString()}`;
  }
}

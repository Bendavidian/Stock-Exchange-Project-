import { getBatchQuotes, getCompanyProfile, getHistoricalPrice } from './api.js';
import { createElement, formatPercent } from './utils.js';

const MAX_SYMBOLS = 3;
const CHART_COLORS = ['#10b981', '#6366f1', '#f59e0b'];
const SYMBOL_PATTERN = /^[A-Z0-9][A-Z0-9.-]{0,14}$/;

export default class ComparePage {
  /**
   * @param {HTMLElement|string|null} container - Compare page root element or element ID
   */
  constructor(container) {
    this.container = typeof container === 'string'
      ? document.getElementById(container)
      : container;
    this.symbols = [];
    this.priceChart = null;
  }

  async load() {
    const parsed = this._parseSymbols();
    if (!parsed.length) {
      this.showError('No symbols provided for comparison.');
      return;
    }

    if (parsed.length < 2) {
      this.showError('Please select at least 2 stocks to compare.');
      return;
    }

    this.symbols = parsed;
    this.showLoading();

    try {
      const [quotes, profiles] = await Promise.all([
        getBatchQuotes(this.symbols),
        Promise.all(this.symbols.map((symbol) => this._safeProfile(symbol))),
      ]);

      const quoteMap = new Map(quotes.map((quote) => [quote.symbol, quote]));
      const profileMap = new Map(
        profiles.filter(Boolean).map((profile) => [profile.symbol, profile])
      );

      const companies = this.symbols.map((symbol) => ({
        symbol,
        quote: quoteMap.get(symbol) || null,
        profile: profileMap.get(symbol) || null,
      }));

      if (!companies.some((company) => company.quote || company.profile)) {
        this.showError('No data available for the selected symbols.');
        return;
      }

      let histories = new Map();
      try {
        histories = await this._loadHistories(this.symbols);
      } catch (err) {
        histories = new Map();
      }

      const chartReady = await this._ensureChart();
      this.render(companies, histories, chartReady);
    } catch (err) {
      this.showError(err?.message || 'Failed to load comparison data. Please try again later.');
    }
  }

  render(companies, histories = new Map(), chartReady = true) {
    if (!this.container) return;
    this._clear();

    const title = createElement('h2', 'section-title', `Comparing ${companies.length} Stocks`);
    this.container.appendChild(title);
    this.container.appendChild(this._buildCards(companies));
    this.container.appendChild(this._buildTable(companies));
    this.container.appendChild(this._buildChartSection(companies, histories, chartReady));
  }

  showLoading() {
    if (!this.container) return;
    this._clear();

    const wrapper = createElement('div', 'loading-indicator');
    wrapper.appendChild(createElement('div', 'spinner'));
    wrapper.appendChild(createElement('span', '', 'Loading comparison data...'));
    this.container.appendChild(wrapper);
  }

  showError(message) {
    if (!this.container) return;
    this._clear();

    const wrapper = createElement('div', 'empty-state');
    wrapper.appendChild(createElement('div', 'empty-icon', '!'));
    wrapper.appendChild(createElement('p', '', 'Cannot compare'));
    wrapper.appendChild(createElement('span', '', message));
    this.container.appendChild(wrapper);
  }

  _parseSymbols() {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('symbols') || '';
    const unique = [];
    const seen = new Set();

    raw.split(',').forEach((item) => {
      const symbol = item.trim().toUpperCase();
      if (!symbol || !SYMBOL_PATTERN.test(symbol) || seen.has(symbol)) return;
      seen.add(symbol);
      unique.push(symbol);
    });

    return unique.slice(0, MAX_SYMBOLS);
  }

  async _safeProfile(symbol) {
    try {
      return await getCompanyProfile(symbol);
    } catch (err) {
      return null;
    }
  }

  async _loadHistories(symbols) {
    const entries = await Promise.all(
      symbols.map(async (symbol) => {
        const history = await getHistoricalPrice(symbol);
        return [symbol, history];
      })
    );
    return new Map(entries);
  }

  _buildCards(companies) {
    const grid = createElement('div', 'compare-card-grid');
    companies.forEach((company) => {
      grid.appendChild(this._buildCompanyCard(company));
    });
    return grid;
  }

  _buildCompanyCard(company) {
    const { symbol, quote, profile } = company;
    const card = createElement('article', 'compare-company-card');

    const header = createElement('div', 'compare-company-card__header');
    const logoWrap = createElement('div', 'compare-company-card__logo-wrap');

    const image = profile?.image || `https://images.financialmodelingprep.com/symbol/${encodeURIComponent(symbol)}.png`;
    const logo = document.createElement('img');
    logo.className = 'compare-company-card__logo';
    logo.src = image;
    logo.alt = `${this._companyName(company)} logo`;
    logo.loading = 'lazy';
    logo.onerror = () => {
      logo.remove();
      logoWrap.textContent = symbol.slice(0, 1);
      logoWrap.classList.add('compare-company-card__logo-wrap--fallback');
    };
    logoWrap.appendChild(logo);

    const identity = createElement('div', 'compare-company-card__identity');
    identity.appendChild(createElement('div', 'compare-company-card__symbol', symbol));
    identity.appendChild(createElement('div', 'compare-company-card__name', this._companyName(company)));

    header.appendChild(logoWrap);
    header.appendChild(identity);

    const price = createElement('div', 'compare-company-card__price', this._formatPrice(quote?.price ?? profile?.price));
    const changeClass = this._changeClass(quote?.changesPercentage ?? profile?.changesPercentage);
    const change = createElement(
      'div',
      `compare-company-card__change ${changeClass}`,
      this._formatPercent(quote?.changesPercentage ?? profile?.changesPercentage)
    );

    card.appendChild(header);
    card.appendChild(price);
    card.appendChild(change);
    card.appendChild(this._buildCardMetrics(company));
    return card;
  }

  _buildCardMetrics(company) {
    const { quote, profile } = company;
    const metrics = createElement('div', 'compare-company-card__metrics');
    const rows = [
      ['Market Cap', this._formatLargeNum(quote?.marketCap ?? profile?.mktCap, '$')],
      ['P/E', this._formatRatio(quote?.pe)],
      ['EPS', this._formatPrice(quote?.eps)],
      ['Volume', this._formatLargeNum(quote?.volume)],
      ['Sector', profile?.sector || 'N/A'],
      ['Industry', profile?.industry || 'N/A'],
    ];

    rows.forEach(([label, value]) => {
      const row = createElement('div', 'compare-company-card__metric');
      row.appendChild(createElement('span', '', label));
      row.appendChild(createElement('strong', '', value));
      metrics.appendChild(row);
    });

    if (profile?.website) {
      const row = createElement('div', 'compare-company-card__metric');
      row.appendChild(createElement('span', '', 'Website'));

      const link = document.createElement('a');
      link.href = profile.website;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      try {
        link.textContent = new URL(profile.website).hostname.replace(/^www\./, '');
      } catch {
        link.textContent = profile.website;
      }
      row.appendChild(link);
      metrics.appendChild(row);
    }

    return metrics;
  }

  _buildTable(companies) {
    const wrapper = createElement('div', 'compare-table-wrapper');
    const table = document.createElement('table');
    table.className = 'compare-table';

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.appendChild(createElement('th', '', 'Metric'));

    companies.forEach((company) => {
      headerRow.appendChild(createElement('th', '', company.symbol));
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    const metrics = [
      ['Price', (company) => this._formatPrice(company.quote?.price ?? company.profile?.price)],
      ['Change %', (company) => this._formatPercent(company.quote?.changesPercentage ?? company.profile?.changesPercentage), true],
      ['Market Cap', (company) => this._formatLargeNum(company.quote?.marketCap ?? company.profile?.mktCap, '$')],
      ['P/E', (company) => this._formatRatio(company.quote?.pe)],
      ['EPS', (company) => this._formatPrice(company.quote?.eps)],
      ['Volume', (company) => this._formatLargeNum(company.quote?.volume)],
      ['Avg Volume', (company) => this._formatLargeNum(company.quote?.avgVolume ?? company.profile?.volAvg)],
      ['52 Week High', (company) => this._formatPrice(company.quote?.yearHigh)],
      ['52 Week Low', (company) => this._formatPrice(company.quote?.yearLow)],
      ['Sector', (company) => company.profile?.sector || 'N/A'],
      ['Industry', (company) => company.profile?.industry || 'N/A'],
    ];

    const tbody = document.createElement('tbody');
    metrics.forEach(([label, getValue, isChange]) => {
      const row = document.createElement('tr');
      row.appendChild(createElement('td', '', label));

      companies.forEach((company) => {
        const cell = createElement('td', '', getValue(company));
        if (isChange) {
          cell.className = this._changeClass(company.quote?.changesPercentage ?? company.profile?.changesPercentage);
        }
        row.appendChild(cell);
      });

      tbody.appendChild(row);
    });

    table.appendChild(tbody);
    wrapper.appendChild(table);
    return wrapper;
  }

  async _ensureChart() {
    if (window.Chart) return true;

    return new Promise((resolve) => {
      const existing = document.querySelector('script[data-chartjs-loader="true"]');
      if (existing) {
        existing.addEventListener('load', () => resolve(true), { once: true });
        existing.addEventListener('error', () => resolve(false), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
      script.async = true;
      script.dataset.chartjsLoader = 'true';
      script.addEventListener('load', () => resolve(true), { once: true });
      script.addEventListener('error', () => resolve(false), { once: true });
      document.head.appendChild(script);
    });
  }

  _buildChartSection(companies, histories, chartReady) {
    const section = createElement('section', 'compare-chart-card');
    section.appendChild(createElement('h2', 'section-title', 'Price History Comparison'));

    if (!chartReady || !window.Chart) {
      section.appendChild(createElement('p', 'company-chart-empty', 'Price history comparison is unavailable because Chart.js is not loaded on this page.'));
      return section;
    }

    const chartData = this._buildAlignedChartData(companies, histories);

    if (!chartData.datasets.length) {
      section.appendChild(createElement('p', 'company-chart-empty', 'Historical price data is unavailable for these stocks right now.'));
      return section;
    }

    const wrap = createElement('div', 'compare-chart-wrap');
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-label', 'Price History Comparison');
    canvas.setAttribute('role', 'img');
    wrap.appendChild(canvas);
    section.appendChild(wrap);

    if (this.priceChart) this.priceChart.destroy();
    this.priceChart = new window.Chart(canvas, {
      type: 'line',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index',
        },
        plugins: {
          legend: {
            labels: { color: '#f1f5f9' },
          },
        },
        scales: {
          x: {
            type: 'category',
            ticks: { color: '#94a3b8', maxTicksLimit: 8 },
            grid: { color: 'rgba(148, 163, 184, 0.08)' },
          },
          y: {
            ticks: {
              color: '#94a3b8',
              callback: (value) => `$${Number(value).toFixed(0)}`,
            },
            grid: { color: 'rgba(148, 163, 184, 0.08)' },
          },
        },
      },
    });

    return section;
  }

  _buildAlignedChartData(companies, histories) {
    const historyEntries = companies
      .map((company) => ({
        company,
        history: histories.get(company.symbol) || [],
      }))
      .filter(({ history }) => history.length);

    if (!historyEntries.length) {
      return { labels: [], datasets: [] };
    }

    let commonDates = new Set(historyEntries[0].history.map((point) => point.date));
    historyEntries.slice(1).forEach(({ history }) => {
      const dates = new Set(history.map((point) => point.date));
      commonDates = new Set([...commonDates].filter((date) => dates.has(date)));
    });

    const labels = [...commonDates].sort();
    const fallbackLabels = historyEntries[0].history.map((point) => point.date).sort();
    const chartLabels = labels.length ? labels : fallbackLabels;

    const datasets = historyEntries.map(({ company, history }, index) => {
      const byDate = new Map(history.map((point) => [point.date, point.close]));
      return {
        label: company.symbol,
        data: chartLabels.map((date) => byDate.get(date) ?? null),
        borderColor: CHART_COLORS[index % CHART_COLORS.length],
        backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
        tension: 0.28,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
        spanGaps: true,
      };
    });

    return { labels: chartLabels, datasets };
  }

  _clear() {
    while (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild);
    }
  }

  _companyName(company) {
    return company.profile?.companyName || company.quote?.name || company.symbol;
  }

  _formatPrice(value) {
    if (value == null || Number.isNaN(Number(value))) return 'N/A';
    return `$${Number(value).toFixed(2)}`;
  }

  _formatPercent(value) {
    if (value == null || Number.isNaN(Number(value))) return 'N/A';
    return formatPercent(Number(value));
  }

  _formatRatio(value) {
    if (value == null || Number.isNaN(Number(value))) return 'N/A';
    return Number(value).toFixed(2);
  }

  _formatLargeNum(value, prefix = '') {
    if (value == null || Number.isNaN(Number(value))) return 'N/A';
    const num = Number(value);
    if (num >= 1e12) return `${prefix}${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `${prefix}${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${prefix}${(num / 1e6).toFixed(2)}M`;
    return `${prefix}${num.toLocaleString()}`;
  }

  _changeClass(value) {
    if (value == null || Number.isNaN(Number(value))) return 'flat';
    if (Number(value) > 0) return 'up';
    if (Number(value) < 0) return 'down';
    return 'flat';
  }
}

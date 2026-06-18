import { getBatchQuotes } from './api.js';
import { createElement, formatPercent } from './utils.js';

export default class ComparePage {
  /**
   * @param {string} containerId - ID of the compare page root element
   */
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this._symbols = [];
  }

  /**
   * @param {string|null} symbolsParam - Comma-separated symbol list from URL query param
   */
  init(symbolsParam) {
    if (!symbolsParam) {
      this.showError('No symbols provided for comparison.');
      return false;
    }
    this._symbols = symbolsParam.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
    if (this._symbols.length < 2) {
      this.showError('Please select at least 2 stocks to compare.');
      return false;
    }
    this.showLoading();
    return true;
  }

  /**
   * Load and render comparison data for the requested URL symbol param.
   * @param {string|null} symbolsParam
   */
  async load(symbolsParam) {
    if (!this.init(symbolsParam)) return;

    try {
      const data = await getBatchQuotes(this._symbols);
      this.render(data);
    } catch (err) {
      this.showError('Failed to load comparison data. Please try again later.');
    }
  }

  /**
   * Render comparison table from an array of quote/profile objects.
   * @param {Array<Object>} data - Array of combined profile+quote objects, one per symbol
   */
  render(data) {
    if (!this.container) return;
    this._clear();

    if (!data || !data.length) {
      this.showError('No data available for the selected symbols.');
      return;
    }

    const title = createElement('h2', 'section-title', `Comparing ${data.length} Stocks`);
    this.container.appendChild(title);

    this.container.appendChild(this._buildTable(data));
  }

  showLoading() {
    if (!this.container) return;
    this._clear();

    const wrapper = createElement('div', 'loading-indicator');
    wrapper.appendChild(createElement('div', 'spinner'));
    wrapper.appendChild(createElement('span', '', 'Loading comparison data…'));
    this.container.appendChild(wrapper);
  }

  showError(message) {
    if (!this.container) return;
    this._clear();

    const wrapper = createElement('div', 'empty-state');
    wrapper.appendChild(createElement('div', 'empty-icon', '⚠'));
    wrapper.appendChild(createElement('p', '', 'Cannot compare'));
    wrapper.appendChild(createElement('span', '', message));
    this.container.appendChild(wrapper);
  }

  _clear() {
    while (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild);
    }
  }

  _buildTable(data) {
    const wrapper = createElement('div', 'compare-table-wrapper');
    const table = document.createElement('table');
    table.className = 'compare-table';

    // Header row
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const metricHeader = document.createElement('th');
    metricHeader.textContent = 'Metric';
    headerRow.appendChild(metricHeader);

    data.forEach(item => {
      const th = document.createElement('th');
      th.textContent = item.symbol || '—';
      headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Body rows
    const metrics = [
      { label: 'Company',     key: item => item.name || item.companyName || '—' },
      { label: 'Price',       key: item => item.price != null ? `$${Number(item.price).toFixed(2)}` : '—' },
      { label: 'Change %',    key: item => formatPercent(item.changesPercentage ?? null), classKey: item => (item.changesPercentage ?? 0) >= 0 ? 'up' : 'down' },
      { label: 'Market Cap',  key: item => this._formatLargeNum(item.mktCap) },
      { label: '52-Wk High',  key: item => item.yearHigh != null ? `$${Number(item.yearHigh).toFixed(2)}` : '—' },
      { label: '52-Wk Low',   key: item => item.yearLow  != null ? `$${Number(item.yearLow).toFixed(2)}`  : '—' },
      { label: 'Volume',      key: item => this._formatLargeNum(item.volume) },
      { label: 'P/E Ratio',   key: item => item.pe != null ? Number(item.pe).toFixed(2) : '—' },
      { label: 'Sector',      key: item => item.sector || '—' },
    ];

    const tbody = document.createElement('tbody');

    metrics.forEach(metric => {
      const row = document.createElement('tr');
      const labelCell = document.createElement('td');
      labelCell.textContent = metric.label;
      row.appendChild(labelCell);

      data.forEach(item => {
        const cell = document.createElement('td');
        cell.textContent = metric.key(item);
        if (metric.classKey) cell.className = metric.classKey(item);
        row.appendChild(cell);
      });

      tbody.appendChild(row);
    });

    table.appendChild(tbody);
    wrapper.appendChild(table);
    return wrapper;
  }

  _formatLargeNum(value) {
    if (value == null || isNaN(value)) return '—';
    const num = Number(value);
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9)  return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6)  return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toLocaleString()}`;
  }
}

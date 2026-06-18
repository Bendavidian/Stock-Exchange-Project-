import { searchCompanies } from './api.js';
import { isApiKeyConfigured } from './config.js';
import { createElement, createHighlightedText } from './utils.js';

export default class SearchResult {
  /**
   * @param {string} containerId  - ID of the results section wrapper
   * @param {string} gridId       - ID of the cards grid element
   * @param {string} loadingId    - ID of the loading indicator element
   * @param {string} emptyId      - ID of the empty-state element
   */
  constructor(containerId, gridId, loadingId, emptyId, searchInputId = 'search-input') {
    this.container   = document.getElementById(containerId);
    this.grid        = document.getElementById(gridId);
    this.loadingEl   = document.getElementById(loadingId);
    this.emptyEl     = document.getElementById(emptyId);
    // Used to read the live query when show() is called without an explicit query arg
    this.searchInput = document.getElementById(searchInputId);
    this.errorEl     = null;
    this._onCompare       = null;
    this._activeQuery     = '';
  }

  init() {
    if (!this.container) return;
    this._injectErrorEl();
  }

  onCompare(callback) {
    this._onCompare = callback;
  }

  onAddToCompare(callback) {
    this.onCompare(callback);
  }

  /**
   * Fetch and render search results for a query.
   * @param {string} query
   * @param {Function} [onSuggestions] callback receiving result subset for autocomplete
   */
  async search(query, onSuggestions) {
    if (!isApiKeyConfigured()) {
      this.showError(
        'API key not configured. Open js/config.js and replace YOUR_API_KEY_HERE with your key.'
      );
      return;
    }

    this.showLoading();

    try {
      const results = await searchCompanies(query);
      this.show(results, query);
      if (onSuggestions) onSuggestions(results.slice(0, 8));
    } catch (err) {
      this.showError(
        err.message || 'Failed to fetch results. Check your API key or network connection.'
      );
      if (onSuggestions) onSuggestions([]);
    }
  }

  showApiKeyError() {
    this.showError(
      'API key not configured. Open js/config.js and replace YOUR_API_KEY_HERE with your Financial Modeling Prep key.'
    );
  }

  /**
   * Render an array of search result objects as stock cards.
   * Expected shape per item:
   *   {
   *     symbol, name, currency, stockExchange, exchangeShortName,
   *     price, change, changesPercentage, image
   *   }
   * @param {Array} results
   * @param {string} [query]
   */
  show(results, query = null) {
    if (!this.grid || !this.container) return;
    // If no query was passed (main.js calls show(results) without it), fall back
    // to the current value of the search input so highlighting still works.
    const resolved = (query != null ? String(query) : (this.searchInput ? this.searchInput.value : ''));
    this._activeQuery = resolved.trim();
    this.hideLoading();
    this.hideError();
    this.container.classList.remove('hidden');

    while (this.grid.firstChild) {
      this.grid.removeChild(this.grid.firstChild);
    }

    if (!results.length) {
      this._showEmpty();
      return;
    }

    if (this.emptyEl) this.emptyEl.classList.add('hidden');
    results.forEach(item => {
      this.grid.appendChild(this._renderCard(item, this._activeQuery));
    });
  }

  hide() {
    if (this.container) this.container.classList.add('hidden');
  }

  showLoading() {
    if (!this.container) return;
    this.container.classList.remove('hidden');
    if (this.loadingEl) this.loadingEl.classList.remove('hidden');
    if (this.emptyEl)   this.emptyEl.classList.add('hidden');
    this.hideError();
    while (this.grid && this.grid.firstChild) {
      this.grid.removeChild(this.grid.firstChild);
    }
  }

  hideLoading() {
    if (this.loadingEl) this.loadingEl.classList.add('hidden');
  }

  /**
   * Display a user-facing error message. All text is set via textContent — no innerHTML.
   * @param {string} message
   */
  showError(message) {
    if (!this.container) return;
    this.hideLoading();
    this.container.classList.remove('hidden');
    if (this.emptyEl) this.emptyEl.classList.add('hidden');
    while (this.grid && this.grid.firstChild) {
      this.grid.removeChild(this.grid.firstChild);
    }

    if (!this.errorEl) return;

    // Clear previous content safely
    while (this.errorEl.firstChild) {
      this.errorEl.removeChild(this.errorEl.firstChild);
    }

    const icon = createElement('div', 'error-state__icon', '⚠');
    const title = createElement('p', '', 'Something went wrong');
    const detail = createElement('span', '', message);

    this.errorEl.appendChild(icon);
    this.errorEl.appendChild(title);
    this.errorEl.appendChild(detail);
    this.errorEl.classList.remove('hidden');
  }

  hideError() {
    if (this.errorEl) this.errorEl.classList.add('hidden');
  }

  // ─── Private ──────────────────────────────────────────────

  _injectErrorEl() {
    this.errorEl = createElement('div', 'error-state hidden');
    // Insert before the results grid so it appears in the right position
    if (this.grid) {
      this.container.insertBefore(this.errorEl, this.grid);
    } else {
      this.container.appendChild(this.errorEl);
    }
  }

  _showEmpty() {
    if (this.emptyEl) this.emptyEl.classList.remove('hidden');
  }

  /**
   * Build a single stock result card.
   * Enriched search fields:
   *   symbol, name, currency, stockExchange, exchangeShortName,
   *   price, change, changesPercentage, image
   * @param {Object} item
   * @param {string} query
   * @returns {HTMLElement}
   */
  _renderCard(item, query) {
    const card = createElement('div', 'stock-card');
    card.setAttribute('role', 'article');
    card.setAttribute('tabindex', '0');

    // ── Header: symbol left, exchange badge right ──────────
    const header = createElement('div', 'stock-card__header');

    const logoWrap = createElement('div', 'stock-card__logo-wrap');
    if (item.image) {
      const logo = document.createElement('img');
      logo.className = 'stock-card__logo';
      logo.src = item.image;
      logo.alt = item.name ? `${item.name} logo` : `${item.symbol || 'Company'} logo`;
      logo.loading = 'lazy';
      logo.onerror = () => {
        logoWrap.classList.add('stock-card__logo-wrap--fallback');
        logo.remove();
        logoWrap.textContent = (item.symbol || '?').slice(0, 1).toUpperCase();
      };
      logoWrap.appendChild(logo);
    } else {
      logoWrap.classList.add('stock-card__logo-wrap--fallback');
      logoWrap.textContent = (item.symbol || '?').slice(0, 1).toUpperCase();
    }

    const meta = createElement('div', 'stock-card__meta');
    const symbolEl = createElement('div', 'stock-card__symbol');
    this._appendHighlightedText(symbolEl, item.symbol || 'N/A', query);

    const nameEl = createElement('div', 'stock-card__name');
    this._appendHighlightedText(nameEl, item.name || 'N/A', query);
    meta.appendChild(symbolEl);
    meta.appendChild(nameEl);

    const exchangeBadge = createElement(
      'span',
      'stock-card__exchange',
      item.exchangeShortName || item.stockExchange || 'N/A'
    );

    header.appendChild(logoWrap);
    header.appendChild(meta);
    header.appendChild(exchangeBadge);

    // ── Quote: latest price + movement ─────────────────────
    const quoteRow = createElement('div', 'stock-card__quote-row');
    quoteRow.appendChild(
      createElement('div', 'stock-card__price', this._formatPrice(item.price))
    );

    const changeClass = this._getChangeClass(item.changesPercentage);
    quoteRow.appendChild(
      createElement('div', `stock-card__change ${changeClass}`, this._formatChangePercent(item.changesPercentage))
    );

    // ── Details: full exchange name + currency ─────────────
    const details = createElement('div', 'stock-card__details');

    const exFull = createElement('span', 'stock-card__detail', item.stockExchange || 'N/A');
    details.appendChild(exFull);

    if (item.currency) {
      const sep = createElement('span', 'stock-card__detail', '·');
      const currEl = createElement('span', 'stock-card__currency', item.currency);
      details.appendChild(sep);
      details.appendChild(currEl);
    }

    // ── Footer: View Profile link ──────────────────────────
    const footer = createElement('div', 'stock-card__footer');

    const viewLink = document.createElement('a');
    viewLink.className = 'btn btn--primary btn--sm';
    viewLink.textContent = 'View Profile';
    viewLink.href = `company.html?symbol=${encodeURIComponent(item.symbol || '')}`;
    viewLink.addEventListener('click', (e) => e.stopPropagation());

    footer.appendChild(viewLink);

    const compareBtn = document.createElement('button');
    compareBtn.type = 'button';
    compareBtn.className = 'btn btn--add btn--sm';
    compareBtn.textContent = 'Compare';
    compareBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (this._onCompare) this._onCompare(item);
    });
    footer.appendChild(compareBtn);

    // Assemble
    card.appendChild(header);
    card.appendChild(quoteRow);
    if (details.childElementCount > 0) card.appendChild(details);
    card.appendChild(footer);

    // Whole-card click navigates to company page
    card.addEventListener('click', () => {
      window.location.href = `company.html?symbol=${encodeURIComponent(item.symbol || '')}`;
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        window.location.href = `company.html?symbol=${encodeURIComponent(item.symbol || '')}`;
      }
    });

    return card;
  }

  _formatPrice(value) {
    if (value == null || Number.isNaN(Number(value))) return 'N/A';
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

  _appendHighlightedText(parent, text, query) {
    parent.appendChild(createHighlightedText(text, query));
  }
}

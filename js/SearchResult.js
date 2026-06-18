import { createElement } from './utils.js';

export default class SearchResult {
  /**
   * @param {string} containerId  - ID of the results section wrapper
   * @param {string} gridId       - ID of the cards grid element
   * @param {string} loadingId    - ID of the loading indicator element
   * @param {string} emptyId      - ID of the empty-state element
   */
  constructor(containerId, gridId, loadingId, emptyId) {
    this.container = document.getElementById(containerId);
    this.grid = document.getElementById(gridId);
    this.loadingEl = document.getElementById(loadingId);
    this.emptyEl = document.getElementById(emptyId);
    this.errorEl = null;
    this._onAddToCompare = null;
  }

  init() {
    if (!this.container) return;
    this._injectErrorEl();
  }

  onAddToCompare(callback) {
    this._onAddToCompare = callback;
  }

  /**
   * Render an array of search result objects as stock cards.
   * Expected shape per item (FMP /search):
   *   { symbol, name, currency, stockExchange, exchangeShortName }
   * @param {Array} results
   */
  show(results) {
    if (!this.grid || !this.container) return;
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
      this.grid.appendChild(this._renderCard(item));
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
   * FMP /search fields: symbol, name, currency, stockExchange, exchangeShortName
   * @param {Object} item
   * @returns {HTMLElement}
   */
  _renderCard(item) {
    const card = createElement('div', 'stock-card');
    card.setAttribute('role', 'article');
    card.setAttribute('tabindex', '0');

    // ── Header: symbol left, exchange badge right ──────────
    const header = createElement('div', 'stock-card__header');

    const meta = createElement('div', 'stock-card__meta');
    const symbolEl = createElement('div', 'stock-card__symbol', item.symbol || '—');
    const nameEl = createElement('div', 'stock-card__name', item.name || '');
    meta.appendChild(symbolEl);
    meta.appendChild(nameEl);

    const exchangeBadge = createElement(
      'span',
      'stock-card__exchange',
      item.exchangeShortName || item.stockExchange || ''
    );

    header.appendChild(meta);
    header.appendChild(exchangeBadge);

    // ── Details: full exchange name + currency ─────────────
    const details = createElement('div', 'stock-card__details');

    if (item.stockExchange) {
      const exFull = createElement('span', 'stock-card__detail', item.stockExchange);
      details.appendChild(exFull);
    }

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

    // Assemble
    card.appendChild(header);
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
}

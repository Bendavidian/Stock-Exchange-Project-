const MIN_QUERY_LENGTH = 2;
const SEARCH_DEBOUNCE_MS = 400;

export default class SearchForm {
  /**
   * @param {string} inputId        - ID of the text input element
   * @param {string} autocompleteId - ID of the autocomplete dropdown element
   */
  constructor(inputId, autocompleteId) {
    this.input = document.getElementById(inputId);
    this.autocomplete = document.getElementById(autocompleteId);
    this.clearBtn = document.getElementById('search-clear-btn');
    this._searchBtn = null;
    this._onSearchCallback = null;
    this._onClearCallback = null;
    this._activeIndex = -1;
    this._debounceTimer = null;
    this._lastSubmittedQuery = '';
  }

  init() {
    if (!this.input) return;
    this._injectSearchButton();
    this._bindEvents();
  }

  /**
   * Register a callback fired when a search should execute.
   * Receives the query string (guaranteed >= MIN_QUERY_LENGTH chars).
   * @param {Function} callback
   */
  onSearch(callback) {
    this._onSearchCallback = callback;
  }

  /**
   * Register a callback fired when the query drops below the minimum length
   * or the input is cleared.
   * @param {Function} callback
   */
  onClear(callback) {
    this._onClearCallback = callback;
  }

  /**
   * Populate and show the autocomplete dropdown.
   * @param {Array<{symbol: string, name: string, exchangeShortName: string}>} results
   */
  showSuggestions(results) {
    if (!this.autocomplete) return;
    this._activeIndex = -1;

    while (this.autocomplete.firstChild) {
      this.autocomplete.removeChild(this.autocomplete.firstChild);
    }

    if (!results.length) {
      this.hideSuggestions();
      return;
    }

    results.forEach((item) => {
      const row = document.createElement('div');
      row.className = 'autocomplete-item';

      const symbol = document.createElement('span');
      symbol.className = 'autocomplete-item__symbol';
      symbol.textContent = item.symbol || '';

      const name = document.createElement('span');
      name.className = 'autocomplete-item__name';
      name.textContent = item.name || '';

      const exchange = document.createElement('span');
      exchange.className = 'autocomplete-item__exchange';
      exchange.textContent = item.exchangeShortName || '';

      row.appendChild(symbol);
      row.appendChild(name);
      row.appendChild(exchange);

      row.addEventListener('click', () => this._selectItem(item));
      this.autocomplete.appendChild(row);
    });

    this.autocomplete.classList.remove('hidden');
  }

  hideSuggestions() {
    if (!this.autocomplete) return;
    this.autocomplete.classList.add('hidden');
    this._activeIndex = -1;
  }

  clear() {
    if (this.input) this.input.value = '';
    this._clearPendingSearch();
    this._lastSubmittedQuery = '';
    this.hideSuggestions();
    this._toggleClearBtn(false);
    if (this._onClearCallback) this._onClearCallback();
  }

  // ─── Private ──────────────────────────────────────────────

  _injectSearchButton() {
    const searchBox = this.input.closest('.search-box');
    if (!searchBox) return;

    this._searchBtn = document.createElement('button');
    this._searchBtn.type = 'button';
    this._searchBtn.className = 'search-submit-btn';
    this._searchBtn.textContent = 'Search';
    searchBox.appendChild(this._searchBtn);
  }

  _bindEvents() {
    this.input.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      this._toggleClearBtn(query.length > 0);

      if (query.length >= MIN_QUERY_LENGTH) {
        this._scheduleSearch(query);
      } else {
        this._clearPendingSearch();
        this._lastSubmittedQuery = '';
        this.hideSuggestions();
        if (this._onClearCallback) this._onClearCallback();
      }
    });

    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        // If a suggestion is highlighted, navigate to it
        const items = this.autocomplete
          ? this.autocomplete.querySelectorAll('.autocomplete-item')
          : [];
        if (this._activeIndex >= 0 && items[this._activeIndex]) {
          items[this._activeIndex].click();
          return;
        }
        // Otherwise run a full search immediately
        this._triggerSearch();
        return;
      }
      this._handleKeyNav(e);
    });

    document.addEventListener('click', (e) => {
      if (
        !this.input.contains(e.target) &&
        !(this.autocomplete && this.autocomplete.contains(e.target))
      ) {
        this.hideSuggestions();
      }
    });

    if (this.clearBtn) {
      this.clearBtn.addEventListener('click', () => this.clear());
    }

    if (this._searchBtn) {
      this._searchBtn.addEventListener('click', () => this._triggerSearch());
    }
  }

  _triggerSearch() {
    const query = this.input ? this.input.value.trim() : '';
    this._clearPendingSearch();
    this.hideSuggestions();
    this._submitSearch(query);
  }

  _scheduleSearch(query) {
    this._clearPendingSearch();
    this._debounceTimer = window.setTimeout(() => {
      this._debounceTimer = null;
      this._submitSearch(query);
    }, SEARCH_DEBOUNCE_MS);
  }

  _submitSearch(query) {
    if (query.length < MIN_QUERY_LENGTH || !this._onSearchCallback) return;

    const normalizedQuery = query.toLowerCase();
    if (normalizedQuery === this._lastSubmittedQuery) return;

    this._lastSubmittedQuery = normalizedQuery;
    this._onSearchCallback(query);
  }

  _clearPendingSearch() {
    if (!this._debounceTimer) return;
    window.clearTimeout(this._debounceTimer);
    this._debounceTimer = null;
  }

  _handleKeyNav(e) {
    const items = this.autocomplete
      ? this.autocomplete.querySelectorAll('.autocomplete-item')
      : [];
    if (!items.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this._activeIndex = Math.min(this._activeIndex + 1, items.length - 1);
      this._highlightItem(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this._activeIndex = Math.max(this._activeIndex - 1, 0);
      this._highlightItem(items);
    } else if (e.key === 'Escape') {
      this.hideSuggestions();
    }
  }

  _highlightItem(items) {
    items.forEach((item, i) => {
      item.classList.toggle('active', i === this._activeIndex);
    });
    if (this._activeIndex >= 0) {
      items[this._activeIndex].scrollIntoView({ block: 'nearest' });
    }
  }

  _selectItem(item) {
    if (!item || !item.symbol) return;
    window.location.href = `company.html?symbol=${encodeURIComponent(item.symbol)}`;
  }

  _toggleClearBtn(visible) {
    if (!this.clearBtn) return;
    this.clearBtn.classList.toggle('hidden', !visible);
  }
}

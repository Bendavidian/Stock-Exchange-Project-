export default class CompareList {
  /**
   * @param {string} barId    - ID of the compare bar wrapper
   * @param {string} chipsId  - ID of the chip container
   * @param {string} linkId   - ID of the "View Comparison" anchor
   * @param {string} clearId  - ID of the "Clear All" button
   */
  constructor(barId, chipsId, linkId, clearId) {
    this.bar = document.getElementById(barId);
    this.chipsEl = document.getElementById(chipsId);
    this.link = document.getElementById(linkId);
    this.clearBtn = document.getElementById(clearId);
    this.helperEl = null;
    this.messageEl = null;
    this._companies = new Map(); // symbol -> full normalized company object
    this.MAX = 3;
  }

  init() {
    this._injectStatusEls();
    if (this.clearBtn) this.clearBtn.addEventListener('click', () => this.clear());
    this._update();
  }

  /**
   * Add a company to the compare list (max 3).
   * @param {Object|string} company
   * @param {string} [name]
   * @returns {boolean} true if added, false if already present or at max
   */
  add(company, name) {
    const normalized = this._normalizeCompany(company, name);
    if (!normalized.symbol) return false;

    if (this._companies.has(normalized.symbol)) {
      this._showMessage(`${normalized.symbol} is already selected.`);
      return false;
    }

    if (this._companies.size >= this.MAX) {
      this._showMessage('You can compare up to 3 stocks at a time.');
      return false;
    }

    this._companies.set(normalized.symbol, normalized);
    this._clearMessage();
    this._update();
    return true;
  }

  /**
   * Remove a symbol from the compare list.
   * @param {string} symbol
   */
  remove(symbol) {
    this._companies.delete(String(symbol || '').toUpperCase());
    this._clearMessage();
    this._update();
  }

  clear() {
    this._companies.clear();
    this._clearMessage();
    this._update();
  }

  /**
   * Returns the current list of selected ticker symbols.
   * @returns {string[]}
   */
  getSymbols() {
    return [...this._companies.keys()];
  }

  _update() {
    if (!this.chipsEl || !this.bar || !this.link) return;

    const selectedCount = this._companies.size;
    const hasItems = selectedCount > 0;
    this.bar.classList.toggle('hidden', !hasItems);

    while (this.chipsEl.firstChild) {
      this.chipsEl.removeChild(this.chipsEl.firstChild);
    }
    this._companies.forEach((company) => {
      this.chipsEl.appendChild(this._createChip(company));
    });

    const symbolList = this.getSymbols().join(',');
    this.link.href = `compare.html?symbols=${symbolList}`;
    this.link.classList.toggle('hidden', selectedCount < 2);

    if (this.helperEl) {
      this.helperEl.textContent = selectedCount === 1
        ? 'Select at least 2 stocks to compare'
        : '';
      this.helperEl.classList.toggle('hidden', selectedCount !== 1);
    }

    if (this.messageEl && selectedCount < this.MAX) this._clearMessage();
  }

  _createChip(company) {
    const chip = document.createElement('div');
    chip.className = 'chip';
    chip.title = company.name;

    const label = document.createElement('span');
    label.className = 'chip__label';

    const symbolEl = document.createElement('strong');
    symbolEl.textContent = company.symbol;

    const nameEl = document.createElement('span');
    nameEl.textContent = company.name;

    label.appendChild(symbolEl);
    label.appendChild(nameEl);

    const removeBtn = document.createElement('button');
    removeBtn.className = 'chip__remove';
    removeBtn.setAttribute('aria-label', `Remove ${company.symbol}`);
    removeBtn.textContent = '✕';
    removeBtn.addEventListener('click', () => this.remove(company.symbol));

    chip.appendChild(label);
    chip.appendChild(removeBtn);
    return chip;
  }

  _normalizeCompany(company, name) {
    if (typeof company === 'string') {
      const symbol = company.trim().toUpperCase();
      return { symbol, name: name || symbol };
    }

    const symbol = String(company?.symbol || '').trim().toUpperCase();
    return {
      ...company,
      symbol,
      name: company?.name || company?.companyName || symbol,
    };
  }

  _injectStatusEls() {
    if (!this.bar || this.helperEl || this.messageEl) return;

    this.helperEl = document.createElement('span');
    this.helperEl.className = 'compare-helper hidden';

    this.messageEl = document.createElement('span');
    this.messageEl.className = 'compare-message hidden';

    this.bar.appendChild(this.helperEl);
    this.bar.appendChild(this.messageEl);
  }

  _showMessage(message) {
    if (!this.messageEl) return;
    this.messageEl.textContent = message;
    this.messageEl.classList.remove('hidden');
  }

  _clearMessage() {
    if (!this.messageEl) return;
    this.messageEl.classList.add('hidden');
    this.messageEl.textContent = '';
  }
}

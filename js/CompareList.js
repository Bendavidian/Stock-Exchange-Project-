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
    this._symbols = new Map(); // symbol -> name
    this.MAX = 4;
  }

  init() {
    if (!this.clearBtn) return;
    this.clearBtn.addEventListener('click', () => this.clear());
  }

  /**
   * Add a symbol to the compare list (max 4).
   * @param {string} symbol
   * @param {string} name
   * @returns {boolean} true if added, false if already present or at max
   */
  add(symbol, name) {
    if (!symbol || this._symbols.has(symbol)) return false;
    if (this._symbols.size >= this.MAX) {
      this._notifyMax();
      return false;
    }
    this._symbols.set(symbol, name || symbol);
    this._update();
    return true;
  }

  /**
   * Remove a symbol from the compare list.
   * @param {string} symbol
   */
  remove(symbol) {
    this._symbols.delete(symbol);
    this._update();
  }

  clear() {
    this._symbols.clear();
    this._update();
  }

  /**
   * Returns the current list of selected ticker symbols.
   * @returns {string[]}
   */
  getSymbols() {
    return [...this._symbols.keys()];
  }

  _update() {
    if (!this.chipsEl || !this.bar || !this.link) return;

    const hasItems = this._symbols.size > 0;
    this.bar.classList.toggle('hidden', !hasItems);

    while (this.chipsEl.firstChild) {
      this.chipsEl.removeChild(this.chipsEl.firstChild);
    }
    this._symbols.forEach((name, symbol) => {
      this.chipsEl.appendChild(this._createChip(symbol, name));
    });

    const symbolList = this.getSymbols().join(',');
    this.link.href = `compare.html?symbols=${encodeURIComponent(symbolList)}`;
  }

  _createChip(symbol, name) {
    const chip = document.createElement('div');
    chip.className = 'chip';
    chip.title = name;

    const label = document.createElement('span');
    label.textContent = symbol;

    const removeBtn = document.createElement('button');
    removeBtn.className = 'chip__remove';
    removeBtn.setAttribute('aria-label', `Remove ${symbol}`);
    removeBtn.textContent = '✕';
    removeBtn.addEventListener('click', () => this.remove(symbol));

    chip.appendChild(label);
    chip.appendChild(removeBtn);
    return chip;
  }

  _notifyMax() {
    if (!this.bar) return;
    const original = this.bar.style.borderColor;
    this.bar.style.borderColor = '#ef4444';
    setTimeout(() => { this.bar.style.borderColor = original; }, 800);
  }
}

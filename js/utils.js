/**
 * Create a DOM element with optional class and text content.
 * @param {string} tag
 * @param {string} [className]
 * @param {string} [textContent]
 * @returns {HTMLElement}
 */
export function createElement(tag, className = '', textContent = '') {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (textContent) el.textContent = textContent;
  return el;
}

/**
 * Format a number as a signed percentage string, e.g. "+1.23%".
 * @param {number} value
 * @returns {string}
 */
export function formatPercent(value) {
  if (value == null || isNaN(value)) return '—';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

/**
 * Read a single query-string parameter from the current URL.
 * @param {string} name
 * @returns {string|null}
 */
export function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

/**
 * Return a debounced version of fn that fires after `delay` ms of inactivity.
 * @param {Function} fn
 * @param {number} delay
 * @returns {Function}
 */
export function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Safely convert an unknown value to a display string, avoiding XSS.
 * @param {*} value
 * @returns {string}
 */
export function safeText(value) {
  if (value == null) return '—';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

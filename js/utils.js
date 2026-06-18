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

/**
 * Build a DocumentFragment that wraps every case-insensitive occurrence of
 * `query` inside `text` with a <span class="text-highlight"> element.
 *
 * Safety: no innerHTML is used. All text is set via createTextNode /
 * span.textContent, so even if `text` or `query` contain HTML/script
 * characters they are treated as plain text only.
 *
 * Uses indexOf (not RegExp) so special characters in the query (. * + ? etc.)
 * are matched literally and can never cause a syntax error.
 *
 * @param {string} text  - the full string to display
 * @param {string} query - the search term to highlight (may be empty)
 * @returns {DocumentFragment}
 */
export function createHighlightedText(text, query) {
  const fragment = document.createDocumentFragment();
  const value  = String(text  ?? '');
  const needle = String(query ?? '').trim();

  if (!needle) {
    fragment.appendChild(document.createTextNode(value));
    return fragment;
  }

  const lowerValue  = value.toLowerCase();
  const lowerNeedle = needle.toLowerCase();
  let cursor     = 0;
  let matchIndex = lowerValue.indexOf(lowerNeedle, cursor);

  while (matchIndex !== -1) {
    if (matchIndex > cursor) {
      fragment.appendChild(document.createTextNode(value.slice(cursor, matchIndex)));
    }

    const mark = document.createElement('span');
    mark.className = 'text-highlight';
    mark.textContent = value.slice(matchIndex, matchIndex + needle.length);
    fragment.appendChild(mark);

    cursor     = matchIndex + needle.length;
    matchIndex = lowerValue.indexOf(lowerNeedle, cursor);
  }

  if (cursor < value.length) {
    fragment.appendChild(document.createTextNode(value.slice(cursor)));
  }

  return fragment;
}

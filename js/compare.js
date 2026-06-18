import Marquee from './Marquee.js';
import ComparePage from './ComparePage.js';
import { getQueryParam } from './utils.js';
import { getBatchQuotes } from './api.js';

document.addEventListener('DOMContentLoaded', async () => {
  const marquee = new Marquee('marquee-container', 'marquee-track');
  marquee.init();

  const symbolsParam = getQueryParam('symbols');
  const comparePage = new ComparePage('compare-page-container');
  comparePage.init(symbolsParam);

  if (!symbolsParam) return;

  const symbols = symbolsParam.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
  if (symbols.length < 2) return;

  try {
    const data = await getBatchQuotes(symbols);
    comparePage.render(data);
  } catch (err) {
    comparePage.showError('Failed to load comparison data. Please try again later.');
  }
});

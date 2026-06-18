import Marquee from './Marquee.js';
import ComparePage from './ComparePage.js';
import { getQueryParam } from './utils.js';

document.addEventListener('DOMContentLoaded', async () => {
  const marquee = new Marquee('marquee-container', 'marquee-track');
  marquee.init();

  const comparePage = new ComparePage('compare-page-container');
  comparePage.load(getQueryParam('symbols'));
});

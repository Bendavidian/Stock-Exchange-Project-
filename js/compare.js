import ComparePage from './ComparePage.js';
import Marquee from './Marquee.js';

document.addEventListener('DOMContentLoaded', async () => {
  new Marquee('marquee-container', 'marquee-track').init();

  const container = document.getElementById('compare-page-container');
  new ComparePage(container).load();
});

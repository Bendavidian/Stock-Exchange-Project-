import ComparePage from './ComparePage.js';

document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('compare-page-container');
  const comparePage = new ComparePage(container);
  comparePage.load();
});

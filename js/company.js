import CompanyInfo from './CompanyInfo.js';
import { getQueryParam } from './utils.js';

document.addEventListener('DOMContentLoaded', async () => {
  const symbol = getQueryParam('symbol');
  const container = document.getElementById('company-container');
  const companyInfo = new CompanyInfo(container, symbol);
  companyInfo.load();
});

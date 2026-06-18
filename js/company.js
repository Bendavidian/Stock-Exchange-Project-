import Marquee from './Marquee.js';
import CompanyInfo from './CompanyInfo.js';
import { getQueryParam } from './utils.js';

document.addEventListener('DOMContentLoaded', async () => {
  const marquee = new Marquee('marquee-container', 'marquee-track');
  marquee.init();

  const companyInfo = new CompanyInfo('company-container');
  companyInfo.load(getQueryParam('symbol'));
});

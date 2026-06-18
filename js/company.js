import Marquee from './Marquee.js';
import CompanyInfo from './CompanyInfo.js';
import { getQueryParam } from './utils.js';
import { getCompanyProfile, getHistoricalPrice, getStockQuote } from './api.js';
import { isApiKeyConfigured } from './config.js';

document.addEventListener('DOMContentLoaded', async () => {
  const marquee = new Marquee('marquee-container', 'marquee-track');
  marquee.init();

  const rawSymbol = getQueryParam('symbol');
  const symbol = rawSymbol ? rawSymbol.trim().toUpperCase() : '';

  const companyInfo = new CompanyInfo('company-container');

  if (!symbol) {
    companyInfo.showError(
      'No stock symbol provided. Please go back and search for a company.'
    );
    return;
  }

  if (!isApiKeyConfigured()) {
    companyInfo.showError(
      'API key not configured. Open js/config.js and replace YOUR_API_KEY_HERE with your Financial Modeling Prep key.'
    );
    return;
  }

  document.title = `${symbol} — Stock Exchange`;
  companyInfo.showLoading();

  try {
    const [profile, quote] = await Promise.all([
      getCompanyProfile(symbol),
      getStockQuote(symbol),
    ]);

    if (!profile && !quote) {
      companyInfo.showError(
        `No data found for symbol "${symbol}". It may not be listed on NASDAQ.`
      );
      return;
    }

    if (profile?.companyName) {
      document.title = `${profile.companyName} (${symbol}) — Stock Exchange`;
    }

    companyInfo.render(profile, quote);
    const historicalPrices = await getHistoricalPrice(symbol);
    companyInfo.addChart(historicalPrices);
  } catch (err) {
    companyInfo.showError(
      'Failed to load company data. Check your API key or internet connection and try again.'
    );
  }
});

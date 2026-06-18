import Marquee from './Marquee.js';
import SearchForm from './SearchForm.js';
import SearchResult from './SearchResult.js';
import CompareList from './CompareList.js';
import initInkReveal from './inkRevealStatic.js';
import { searchCompanies } from './api.js';
import { isApiKeyConfigured } from './config.js';

document.addEventListener('DOMContentLoaded', () => {
  initInkReveal('ink-reveal-canvas');

  const marquee = new Marquee('marquee-container', 'marquee-track');
  marquee.init();

  const compareList = new CompareList('compare-bar', 'compare-chips', 'compare-link', 'compare-clear');
  compareList.init();

  const searchResult = new SearchResult('results-container', 'results-grid', 'loading-indicator', 'empty-state');
  searchResult.init();

  const searchForm = new SearchForm('search-input', 'autocomplete-list');
  searchForm.init();

  // Show a blocking error immediately if the API key is not set
  if (!isApiKeyConfigured()) {
    searchResult.showError(
      'API key not configured. Open js/config.js and replace YOUR_API_KEY_HERE with your Financial Modeling Prep key.'
    );
  }

  // When the query drops below 2 characters, collapse the results section
  searchForm.onClear(() => {
    searchResult.hide();
    searchForm.hideSuggestions();
  });

  searchForm.onSearch(async (query) => {
    if (!isApiKeyConfigured()) {
      searchResult.showError(
        'API key not configured. Open js/config.js and replace YOUR_API_KEY_HERE with your key.'
      );
      return;
    }

    searchResult.showLoading();

    try {
      const results = await searchCompanies(query);
      searchResult.show(results);
      // Populate the autocomplete dropdown with a quick-navigation subset
      searchForm.showSuggestions(results.slice(0, 8));
    } catch (err) {
      // Surface the real FMP error message so the user can act on it
      searchResult.showError(
        err.message || 'Failed to fetch results. Check your API key or network connection.'
      );
      searchForm.hideSuggestions();
    }
  });
});

import Marquee from './Marquee.js';
import SearchForm from './SearchForm.js';
import SearchResult from './SearchResult.js';
import CompareList from './CompareList.js';
import initInkReveal from './inkRevealStatic.js';
import { isApiKeyConfigured } from './config.js';

document.addEventListener('DOMContentLoaded', () => {
  initInkReveal('ink-reveal-canvas');

  const marquee = new Marquee('marquee-container', 'marquee-track');
  marquee.init();

  const compareList = new CompareList('compare-bar', 'compare-chips', 'compare-link', 'compare-clear');
  compareList.init();

  const searchResult = new SearchResult('results-container', 'results-grid', 'loading-indicator', 'empty-state');
  searchResult.init();
  searchResult.onCompare((company) => {
    console.log('Compare clicked:', company);
  });

  const searchForm = new SearchForm('search-input', 'autocomplete-list');
  searchForm.init();

  // Show a blocking error immediately if the API key is not set
  if (!isApiKeyConfigured()) {
    searchResult.showApiKeyError();
  }

  // When the query drops below 2 characters, collapse the results section
  searchForm.onClear(() => {
    searchResult.hide();
    searchForm.hideSuggestions();
  });

  searchForm.onSearch((query) => {
    searchResult.search(query, (suggestions) => {
      if (suggestions.length) {
        searchForm.showSuggestions(suggestions);
      } else {
        searchForm.hideSuggestions();
      }
    });
  });
});

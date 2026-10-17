// public/js/search.js
// Used ONLY by search.html. A lightweight, client-side search across
// published News/Knowledge Corner posts and FAQs (all public data). Good
// enough for a small site like this one — no dedicated search backend needed.

function escapeHtml(str) {
  if (str === undefined || str === null) return '';
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function matches(haystack, query) {
  return haystack.toLowerCase().includes(query.toLowerCase());
}

async function runSearch() {
  const params = new URLSearchParams(window.location.search);
  const query = (params.get('q') || '').trim();
  const summary = document.getElementById('searchSummary');
  const resultsBox = document.getElementById('searchResults');

  if (!query) {
    summary.textContent = 'Enter a search term using the search icon in the navigation bar.';
    resultsBox.innerHTML = '';
    return;
  }

  summary.textContent = `Showing results for "${query}"`;

  try {
    const [newsRes, faqsRes] = await Promise.all([
      fetch('/api/news/public'),
      fetch('/api/faqs/public')
    ]);
    const news = await newsRes.json();
    const faqs = await faqsRes.json();

    const newsMatches = news.filter(n => matches(n.title, query) || matches(n.body, query));
    const faqMatches = faqs.filter(f => matches(f.question, query) || matches(f.answer, query));

    if (newsMatches.length === 0 && faqMatches.length === 0) {
      resultsBox.innerHTML = '<p class="lede">No results found. Try a different search term.</p>';
      return;
    }

    let html = '';

    if (newsMatches.length > 0) {
      html += '<h2 class="search-group-heading">News &amp; Knowledge Corner</h2>';
      html += newsMatches.map(n => `
        <div class="search-result-card">
          <div class="search-result-meta">${escapeHtml(n.section === 'News' ? 'News' : 'Knowledge Corner')} &middot; ${escapeHtml(n.category)}</div>
          <h3>${escapeHtml(n.title)}</h3>
          <p>${escapeHtml(n.body)}</p>
        </div>
      `).join('');
    }

    if (faqMatches.length > 0) {
      html += '<h2 class="search-group-heading">FAQs</h2>';
      html += faqMatches.map(f => `
        <div class="search-result-card">
          <h3>${escapeHtml(f.question)}</h3>
          <p>${escapeHtml(f.answer)}</p>
        </div>
      `).join('');
    }

    resultsBox.innerHTML = html;
  } catch (err) {
    resultsBox.innerHTML = '<p class="lede">Search could not be completed right now.</p>';
  }
}

runSearch();

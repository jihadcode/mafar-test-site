// public/js/knowledge-corner.js
// Used ONLY by knowledge-corner.html. Loads published Knowledge Corner
// posts (Pull Quotes, Updates, InfoGraphic Videos, etc.) and filters them
// by tab. Supports deep-linking from the nav dropdown via URL hash.

let allNewsPosts = [];
let activeCategory = 'Updates';

async function loadKnowledgeCorner() {
  const grid = document.getElementById('newsGrid');
  try {
    const res = await fetch('/api/news/public?section=KnowledgeCorner');
    const posts = await res.json();
    allNewsPosts = Array.isArray(posts) ? posts : [];
    renderNewsGrid();
  } catch (err) {
    grid.innerHTML = '<p class="lede">Could not load right now.</p>';
  }
}

function renderNewsGrid() {
  const grid = document.getElementById('newsGrid');
  const posts = allNewsPosts.filter(p => p.category === activeCategory);

  if (posts.length === 0) {
    grid.innerHTML = `<p class="lede">Nothing posted yet under "${escapeHtml(activeCategory)}". Check back soon.</p>`;
    return;
  }

  grid.innerHTML = posts.map(post => `
    <div class="card news-card">
      <div class="news-date">${formatDate(post.date)}</div>
      <h3>${escapeHtml(post.title)}</h3>
      <p>${escapeHtml(post.body)}</p>
      ${renderYoutubeEmbed(post.youtubeUrl)}
      ${renderFacebookLink(post.facebookUrl)}
    </div>
  `).join('');
}

function getYoutubeId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{6,})/);
  return match ? match[1] : null;
}

function renderYoutubeEmbed(youtubeUrl) {
  const videoId = getYoutubeId(youtubeUrl);
  if (!videoId) return '';
  return `
    <div class="news-video">
      <iframe src="https://www.youtube.com/embed/${videoId}"
        title="YouTube video" frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen></iframe>
    </div>`;
}

function renderFacebookLink(facebookUrl) {
  if (!facebookUrl) return '';
  return `<a class="news-fb-link" href="${encodeURI(facebookUrl)}" target="_blank" rel="noopener">View on Facebook &rarr;</a>`;
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
}

function escapeHtml(str) {
  if (str === undefined || str === null) return '';
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function activateTab(category) {
  const tabs = document.querySelectorAll('.news-tab');
  const match = Array.from(tabs).find(t => t.dataset.category === category);
  if (!match) return;
  tabs.forEach(t => t.classList.remove('active'));
  match.classList.add('active');
  activeCategory = category;
}

function wireTabs() {
  document.querySelectorAll('.news-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.news-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeCategory = tab.dataset.category;
      renderNewsGrid();
    });
  });
}

// Support arriving from the nav dropdown, e.g. /knowledge-corner.html#Trivia
const hashCategory = decodeURIComponent(window.location.hash.replace('#', ''));

wireTabs();
if (hashCategory) activateTab(hashCategory);
loadKnowledgeCorner();

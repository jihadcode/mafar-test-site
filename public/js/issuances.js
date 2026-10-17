// public/js/issuances.js
// Used ONLY by issuances.html.

let allIssuances = [];
let activeCategory = 'Memorandum Orders';

function escapeHtml(str) {
  if (str === undefined || str === null) return '';
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function renderList() {
  const container = document.getElementById('issuancesList');
  const items = allIssuances.filter(i => i.category === activeCategory);

  if (items.length === 0) {
    container.innerHTML = `<p class="lede">Nothing posted yet under "${escapeHtml(activeCategory)}".</p>`;
    return;
  }

  container.innerHTML = items.map(item => `
    <div class="issuance-card">
      <h3>${escapeHtml(item.title)}</h3>
      <p class="issuance-date">${escapeHtml(item.date)}</p>
      ${item.description ? `<p>${escapeHtml(item.description)}</p>` : ''}
      ${item.fileUrl ? `<a href="${encodeURI(item.fileUrl)}" target="_blank" rel="noopener" class="issuance-link">Open document &rarr;</a>` : ''}
    </div>
  `).join('');
}

async function loadIssuances() {
  const container = document.getElementById('issuancesList');
  try {
    const res = await fetch('/api/resources/public?section=Issuances');
    allIssuances = await res.json();
    renderList();
  } catch (err) {
    container.innerHTML = '<p class="lede">Could not load right now.</p>';
  }
}

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeCategory = btn.dataset.category;
    renderList();
  });
});

// Support arriving from the nav dropdown, e.g. /issuances.html#Memorandum Orders
const hashCategory = decodeURIComponent(window.location.hash.replace('#', ''));
if (hashCategory) {
  const match = document.querySelector(`.tab-btn[data-category="${hashCategory}"]`);
  if (match) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    match.classList.add('active');
    activeCategory = hashCategory;
  }
}

loadIssuances();

// public/js/transparency.js
// Used ONLY by transparency.html. Handles the 4 tabs, and loads the
// Procurement / Vacant Position lists from the admin-manageable resources API.

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});

// Support arriving from the nav dropdown, e.g. /transparency.html#procurement
(function activateTabFromHash() {
  const hashId = window.location.hash.replace('#', '');
  if (!hashId) return;
  const btn = document.querySelector(`.tab-btn[data-tab="${hashId}"]`);
  if (!btn) return;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById(hashId).classList.add('active');
})();

function escapeHtml(str) {
  if (str === undefined || str === null) return '';
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function renderResourceList(container, items) {
  if (items.length === 0) {
    container.innerHTML = '<p class="lede">Nothing posted here yet.</p>';
    return;
  }
  container.innerHTML = items.map(item => `
    <div class="info-card resource-item">
      <h3>${escapeHtml(item.title)}</h3>
      <p class="resource-date">${escapeHtml(item.date)}</p>
      ${item.description ? `<p>${escapeHtml(item.description)}</p>` : ''}
      ${item.fileUrl ? `<a href="${encodeURI(item.fileUrl)}" target="_blank" rel="noopener" class="resource-link">Open document &rarr;</a>` : ''}
    </div>
  `).join('');
}

async function loadTransparencyDocs() {
  const procurementBox = document.getElementById('procurementList');
  const vacantBox = document.getElementById('vacantList');
  try {
    const res = await fetch('/api/resources/public?section=Transparency');
    const items = await res.json();
    renderResourceList(procurementBox, items.filter(i => i.category === 'Procurement'));
    renderResourceList(vacantBox, items.filter(i => i.category === 'Vacant Position'));
  } catch (err) {
    procurementBox.innerHTML = '<p class="lede">Could not load right now.</p>';
    vacantBox.innerHTML = '<p class="lede">Could not load right now.</p>';
  }
}

loadTransparencyDocs();

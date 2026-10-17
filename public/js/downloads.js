// public/js/downloads.js
// Used ONLY by downloads.html.

function escapeHtml(str) {
  if (str === undefined || str === null) return '';
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

async function loadDownloads() {
  const container = document.getElementById('downloadsList');
  try {
    const res = await fetch('/api/resources/public?section=Downloads');
    const items = await res.json();

    if (items.length === 0) {
      container.innerHTML = '<p class="lede">No downloads posted yet. Check back soon.</p>';
      return;
    }

    container.innerHTML = items.map(item => `
      <div class="download-card">
        <div class="download-icon">&#128196;</div>
        <div class="download-info">
          <h3>${escapeHtml(item.title)}</h3>
          ${item.description ? `<p>${escapeHtml(item.description)}</p>` : ''}
        </div>
        ${item.fileUrl
          ? `<a href="${encodeURI(item.fileUrl)}" target="_blank" rel="noopener" class="download-btn">Download</a>`
          : `<span class="download-btn download-btn-disabled">Not yet uploaded</span>`}
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = '<p class="lede">Could not load right now.</p>';
  }
}

loadDownloads();

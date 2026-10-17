// public/js/officials.js
// Used ONLY by officials.html. Switches between the tab panels, and loads
// the live staff directory (from registered dashboard accounts) into the
// "Directory of Officials" tab.

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});

// Support arriving from the nav dropdown, e.g. /officials.html#regional-officials
function activateTabFromHash() {
  const hashId = window.location.hash.replace('#', '');
  if (!hashId) return;
  const btn = document.querySelector(`.tab-btn[data-tab="${hashId}"]`);
  if (!btn) return;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById(hashId).classList.add('active');
}
activateTabFromHash();

function escapeHtml(str) {
  if (str === undefined || str === null) return '';
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

async function loadStaffDirectory() {
  const container = document.getElementById('directoryList');
  try {
    const res = await fetch('/api/users/public-directory');
    const staff = await res.json();

    if (!Array.isArray(staff) || staff.length === 0) {
      container.innerHTML = '<p class="lede">No staff accounts registered yet.</p>';
      return;
    }

    container.innerHTML = staff.map(person => `
      <div class="official-card">
        <div class="official-name">${escapeHtml(person.fullName)}</div>
        <div class="official-title">${escapeHtml(person.position || 'MAFAR-LDS Staff')}</div>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = '<p class="lede">Staff directory could not be loaded right now.</p>';
  }
}

loadStaffDirectory();

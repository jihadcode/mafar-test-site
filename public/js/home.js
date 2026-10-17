// public/js/home.js
// Used ONLY by index.html. This page is an overview/landing page: it loads
// a few at-a-glance stats and a short preview of the latest Knowledge
// Corner posts. The FULL Knowledge Corner experience (all 10 tabs) lives
// on its own page — see /js/knowledge-corner.js.

function escapeHtml(str) {
  if (str === undefined || str === null) return '';
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
}

async function loadIntroStats() {
  const boxes = document.querySelectorAll('#introStats .stat-box-value');
  try {
    const res = await fetch('/api/reports/public-summary');
    const s = await res.json();
    const values = [s.totalClients, s.totalMunicipalities, s.totalPrograms, s.totalProjects];
    boxes.forEach((box, i) => { box.textContent = values[i].toLocaleString(); });
  } catch (err) {
    boxes.forEach(box => { box.textContent = '—'; });
  }
}

async function loadLatestUpdates() {
  const grid = document.getElementById('latestUpdatesGrid');
  try {
    const res = await fetch('/api/news/public?section=KnowledgeCorner');
    const posts = await res.json();
    const latest = (Array.isArray(posts) ? posts : []).slice(0, 3);

    if (latest.length === 0) {
      grid.innerHTML = '<p class="lede">No updates posted yet. Check back soon.</p>';
      return;
    }

    grid.innerHTML = latest.map(post => `
      <div class="card news-card">
        <div class="news-date">${formatDate(post.date)}</div>
        <h3>${escapeHtml(post.title)}</h3>
        <p>${escapeHtml(post.body)}</p>
      </div>
    `).join('');
  } catch (err) {
    grid.innerHTML = '<p class="lede">Updates could not be loaded right now.</p>';
  }
}

// ---------- Officials slideshow ----------
// Simple, dependency-free carousel: auto-advances every 6 seconds, pauses
// while the mouse is over it, and supports the prev/next arrows and the
// dot indicators. The slide order in the HTML is the display order.
function initOfficialsSlider() {
  const slider = document.getElementById('officialsSlider');
  if (!slider) return;

  const track = document.getElementById('sliderTrack');
  const slides = Array.from(track.children);
  const dotsContainer = document.getElementById('sliderDots');
  const prevBtn = document.getElementById('sliderPrev');
  const nextBtn = document.getElementById('sliderNext');

  let currentIndex = 0;
  let autoAdvanceTimer = null;

  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'slider-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
    dot.addEventListener('click', () => goToSlide(i));
    dotsContainer.appendChild(dot);
  });
  const dots = Array.from(dotsContainer.children);

  function goToSlide(index) {
    currentIndex = (index + slides.length) % slides.length;
    track.style.transform = `translateX(-${currentIndex * 100}%)`;
    dots.forEach((dot, i) => dot.classList.toggle('active', i === currentIndex));
  }

  function startAutoAdvance() {
    stopAutoAdvance();
    autoAdvanceTimer = setInterval(() => goToSlide(currentIndex + 1), 6000);
  }
  function stopAutoAdvance() {
    if (autoAdvanceTimer) clearInterval(autoAdvanceTimer);
  }

  prevBtn.addEventListener('click', () => { goToSlide(currentIndex - 1); startAutoAdvance(); });
  nextBtn.addEventListener('click', () => { goToSlide(currentIndex + 1); startAutoAdvance(); });
  slider.addEventListener('mouseenter', stopAutoAdvance);
  slider.addEventListener('mouseleave', startAutoAdvance);

  startAutoAdvance();
}

initOfficialsSlider();
loadIntroStats();
loadLatestUpdates();

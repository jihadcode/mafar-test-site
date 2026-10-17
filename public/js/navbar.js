// public/js/navbar.js
// Used by EVERY public page (not the dashboard, which keeps its own sidebar).
// Builds the green banner header + full dropdown navigation + mobile
// slide-out menu, and injects it into <div id="site-header"></div>.
//
// Why one shared file instead of copy-pasting this into every page: if you
// ever want to add/remove/rename a nav item, you only ever edit the NAV_ITEMS
// list below — every page picks up the change automatically.

const NAV_ITEMS = [
  { label: 'Home', href: '/index.html' },
  {
    label: 'About Us', href: '/about.html',
    dropdown: [
      { label: 'Vision, Mission and Mandate', href: '/about.html#vision' },
      { label: 'Organizational Structure', href: '/about.html#structure' },
      { label: 'MAFAR Official Logo', href: '/about.html#logo' }
    ]
  },
  {
    label: 'Officials', href: '/officials.html',
    dropdown: [
      { label: "Minister's Corner", href: '/officials.html#minister' },
      { label: 'Regional Officials', href: '/officials.html#regional-officials' },
      { label: 'Directory of Officials', href: '/officials.html#directory' }
    ]
  },
  {
    label: 'News', href: '/news.html',
    dropdown: [
      { label: 'Regional', href: '/news.html#Regional' },
      { label: 'Provincial', href: '/news.html#Provincial' },
      { label: 'Philippine Rural Development Project', href: '/news.html#Philippine Rural Development Project' },
      { label: 'Mindanao Inclusive Agriculture Development Project', href: '/news.html#Mindanao Inclusive Agriculture Development Project' },
      { label: 'Special Development Fund', href: '/news.html#Special Development Fund' },
      { label: 'Bangsamoro Agriculture and Fisheries Training Institute', href: '/news.html#Bangsamoro Agriculture and Fisheries Training Institute' }
    ]
  },
  {
    label: 'Flagship Programs', href: '/programs.html',
    dropdown: [
      { label: 'BInHI', href: '/programs.html#binhi' },
      { label: 'LUPA', href: '/programs.html#lupa' },
      { label: 'ISDA', href: '/programs.html#isda' }
    ]
  },
  {
    label: 'Transparency', href: '/transparency.html',
    dropdown: [
      { label: 'Transparency Seal', href: '/transparency.html#seal' },
      { label: "Citizen's Charter", href: '/transparency.html#charter' },
      { label: 'Procurement', href: '/transparency.html#procurement' },
      { label: 'Vacant Position', href: '/transparency.html#vacant' }
    ]
  },
  {
    label: 'Issuances', href: '/issuances.html',
    dropdown: [
      { label: 'Memorandum Orders', href: '/issuances.html#Memorandum Orders' },
      { label: 'Administrative Orders', href: '/issuances.html#Administrative Orders' }
    ]
  },
  {
    label: 'Knowledge Corner', href: '/knowledge-corner.html',
    dropdown: [
      { label: 'Pull Quotes', href: '/knowledge-corner.html#Pull Quotes' },
      { label: 'Updates', href: '/knowledge-corner.html#Updates' },
      { label: 'Infographic Videos', href: '/knowledge-corner.html#InfoGraphic Videos' },
      { label: 'Trivia', href: '/knowledge-corner.html#Trivia' },
      { label: 'Audio Video Presentation', href: '/knowledge-corner.html#Audio-Video Presentation' },
      { label: 'Radio Program', href: '/knowledge-corner.html#Radio Program' },
      { label: 'Publications', href: '/knowledge-corner.html#Publications' },
      { label: 'IEC Materials', href: '/knowledge-corner.html#IEC Materials' },
      { label: 'MAFAR Annual Reports', href: '/knowledge-corner.html#Annual Reports' },
      { label: 'Project Papers', href: '/knowledge-corner.html#Project Papers' }
    ]
  },
  { label: 'Downloads', href: '/downloads.html' },
  { label: 'FAQs', href: '/faqs.html' },
  { label: 'Contact Us', href: '/contact.html' }
];

function navItemHtml(item, currentPath) {
  const isActive = currentPath === item.href.split('#')[0].split('?')[0];
  const hasDropdown = Array.isArray(item.dropdown) && item.dropdown.length > 0;

  if (!hasDropdown) {
    return `<li class="nav-item">
      <a href="${item.href}" class="${isActive ? 'active' : ''}">${item.label}</a>
    </li>`;
  }

  return `<li class="nav-item has-dropdown">
    <a href="${item.href}" class="${isActive ? 'active' : ''}">${item.label} <span class="caret">&#9662;</span></a>
    <ul class="dropdown-menu">
      ${item.dropdown.map(sub => `<li><a href="${sub.href}">${sub.label}</a></li>`).join('')}
    </ul>
  </li>`;
}

function mobileNavItemHtml(item, index) {
  const hasDropdown = Array.isArray(item.dropdown) && item.dropdown.length > 0;
  if (!hasDropdown) {
    return `<div class="mnav-row">
      <a href="${item.href}" class="mnav-label">${item.label}</a>
    </div>`;
  }
  return `<div class="mnav-row mnav-expandable" data-index="${index}">
      <a href="${item.href}" class="mnav-label">${item.label}</a>
      <button class="mnav-toggle" aria-label="Expand ${item.label}">+</button>
    </div>
    <div class="mnav-submenu" id="mnav-sub-${index}">
      ${item.dropdown.map(sub => `<a href="${sub.href}">${sub.label}</a>`).join('')}
    </div>`;
}

function renderNavbar() {
  const mount = document.getElementById('site-header');
  if (!mount) return;

  const currentPath = window.location.pathname;

  mount.innerHTML = `
    <div class="brand-ribbon"></div>

    <div class="mafar-banner">
      <img src="/images/mafar-seal.png" alt="MAFAR-LDS Seal" class="banner-seal">
      <div class="banner-text">
        <div class="banner-line-1">Republic of the Philippines</div>
        <div class="banner-line-1">Bangsamoro Autonomous Region in Muslim Mindanao</div>
        <div class="banner-line-2">Ministry of Agriculture, Fisheries, and Agrarian Reform</div>
      </div>
      <button class="hamburger-btn" id="mobileMenuBtn" aria-label="Open menu">&#9776;</button>
    </div>

    <nav class="mega-nav" id="megaNav">
      <ul class="nav-list">
        ${NAV_ITEMS.map(item => navItemHtml(item, currentPath)).join('')}
      </ul>
      <div class="nav-right">
        <button class="nav-search-btn" id="navSearchBtn" aria-label="Search">&#128269;</button>
        <a href="/register.html" class="btn nav-register">Create a Staff Account</a>
        <div class="nav-login">
          <a href="/login.html" class="btn secondary">Log In</a>
        </div>
      </div>
    </nav>

    <div class="nav-search-bar" id="navSearchBar">
      <input type="text" id="navSearchInput" placeholder="Search news and updates&hellip;">
      <button id="navSearchSubmit">Search</button>
    </div>

    <div class="mobile-menu-backdrop" id="mobileMenuBackdrop"></div>
    <div class="mobile-menu-panel" id="mobileMenuPanel">
      <div class="mnav-header">
        <span>MAFAR-LDS</span>
        <button class="mnav-close" id="mobileMenuClose" aria-label="Close menu">&times;</button>
      </div>
      <div class="mnav-body">
        <div class="mnav-search">
          <input type="text" id="mobileSearchInput" placeholder="Search news and updates&hellip;">
        </div>
        ${NAV_ITEMS.map((item, i) => mobileNavItemHtml(item, i)).join('')}
        <div class="mnav-row"><a href="/register.html" class="mnav-label">Create a Staff Account</a></div>
        <div class="mnav-row"><a href="/login.html" class="mnav-label">Log In</a></div>
      </div>
    </div>
  `;

  wireMobileMenu();
}

function wireMobileMenu() {
  const btn = document.getElementById('mobileMenuBtn');
  const closeBtn = document.getElementById('mobileMenuClose');
  const backdrop = document.getElementById('mobileMenuBackdrop');
  const panel = document.getElementById('mobileMenuPanel');

  function open() {
    panel.classList.add('open');
    backdrop.classList.add('open');
  }
  function close() {
    panel.classList.remove('open');
    backdrop.classList.remove('open');
  }

  btn.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  backdrop.addEventListener('click', close);

  document.querySelectorAll('.mnav-expandable').forEach(row => {
    row.querySelector('.mnav-toggle').addEventListener('click', (e) => {
      e.preventDefault();
      const sub = document.getElementById('mnav-sub-' + row.dataset.index);
      const isOpen = sub.classList.toggle('open');
      row.querySelector('.mnav-toggle').textContent = isOpen ? '\u2212' : '+';
    });
  });

  wireSearch();
}

function goToSearch(query) {
  if (!query || !query.trim()) return;
  window.location.href = '/search.html?q=' + encodeURIComponent(query.trim());
}

function wireSearch() {
  const searchBtn = document.getElementById('navSearchBtn');
  const searchBar = document.getElementById('navSearchBar');
  const searchInput = document.getElementById('navSearchInput');
  const searchSubmit = document.getElementById('navSearchSubmit');
  const mobileSearchInput = document.getElementById('mobileSearchInput');

  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      searchBar.classList.toggle('open');
      if (searchBar.classList.contains('open')) searchInput.focus();
    });
  }
  if (searchSubmit) searchSubmit.addEventListener('click', () => goToSearch(searchInput.value));
  if (searchInput) searchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') goToSearch(searchInput.value); });
  if (mobileSearchInput) mobileSearchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') goToSearch(mobileSearchInput.value); });
}

renderNavbar();

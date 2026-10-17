// public/js/dashboard.js
// Handles everything on the dashboard page: loading data from the API,
// switching between Registry/Programs views, search & filter, and the
// Add/Edit modals.

let currentType = 'All';
let currentQuery = '';

const VIEW_IDS = {
  dashboard: 'dashboardView',
  registry: 'registryView',
  programs: 'programsView',
  projects: 'projectsView',
  reports: 'reportsView',
  news: 'newsView',
  resources: 'resourcesView',
  faqs: 'faqsView',
  users: 'usersView'
};

let currentUser = null;

// ---------- Boot ----------
async function boot() {
  const meRes = await fetch('/api/auth/me');
  const me = await meRes.json();
  if (!me.user) {
    window.location.href = '/login.html';
    return;
  }
  currentUser = me.user;
  renderProfile(me.user);

  if (me.user.role === 'admin') {
    document.getElementById('adminNavGroup').style.display = 'block';
    document.getElementById('contentNavGroup').style.display = 'block';
    wireUserControls();
    wireNewsControls();
    wireResourceControls();
    wireFaqControls();
  }

  wireNav();
  wireClientControls();
  wireProgramControls();
  wireProjectControls();
  wireModals();

  await loadClients();
  await loadPrograms();
  await loadProjects();
  await loadSummary(); // powers both Dashboard and Reports views
}

function initials(name) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
}

function renderProfile(user) {
  document.getElementById('profileAvatar').textContent = initials(user.fullName || 'U');
  document.getElementById('profileName').textContent = user.fullName;
  document.getElementById('profileRole').textContent = user.position || (user.role === 'admin' ? 'Administrator' : 'Staff');
}

// ---------- Sidebar navigation ----------
function wireNav() {
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebarBackdrop');
  const toggleBtn = document.getElementById('sidebarToggle');

  function openSidebar() {
    sidebar.classList.add('open');
    backdrop.classList.add('open');
  }
  function closeSidebar() {
    sidebar.classList.remove('open');
    backdrop.classList.remove('open');
  }

  toggleBtn.addEventListener('click', () => {
    sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
  });
  backdrop.addEventListener('click', closeSidebar);

  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      const view = link.dataset.view;

      Object.entries(VIEW_IDS).forEach(([key, elId]) => {
        document.getElementById(elId).style.display = (key === view) ? 'block' : 'none';
      });

      if (view === 'dashboard' || view === 'reports') loadSummary();
      if (view === 'users') loadUsers();
      if (view === 'news') loadNews();
      if (view === 'resources') loadResources();
      if (view === 'faqs') loadFaqs();

      closeSidebar(); // no-op on desktop, tidies up the menu on mobile
    });
  });

  document.getElementById('logoutLink').addEventListener('click', async (e) => {
    e.preventDefault();
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login.html';
  });
}

// ================= CLIENTS (Registry) =================

function wireClientControls() {
  document.querySelectorAll('#clientTabs button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#clientTabs button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentType = btn.dataset.type;
      loadClients();
    });
  });

  let searchTimer;
  document.getElementById('clientSearch').addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      currentQuery = e.target.value.trim();
      loadClients();
    }, 250);
  });

  document.getElementById('openAddClient').addEventListener('click', () => openClientModal());

  document.getElementById('clientForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('clientId').value;
    const payload = {
      name: document.getElementById('c_name').value.trim(),
      type: document.getElementById('c_type').value,
      sex: document.getElementById('c_sex').value,
      municipality: document.getElementById('c_municipality').value.trim(),
      barangay: document.getElementById('c_barangay').value.trim(),
      keyDetail: document.getElementById('c_keyDetail').value.trim(),
      contact: document.getElementById('c_contact').value.trim()
    };

    const url = id ? `/api/clients/${id}` : '/api/clients';
    const method = id ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      closeModal('clientModalBackdrop');
      loadClients();
    } else {
      const data = await res.json();
      alert(data.error || 'Could not save client.');
    }
  });
}

async function loadClients() {
  const params = new URLSearchParams();
  if (currentType) params.set('type', currentType);
  if (currentQuery) params.set('q', currentQuery);

  const res = await fetch('/api/clients?' + params.toString());
  const clients = await res.json();
  renderClients(clients);
}

function badgeClass(type) {
  if (type === 'Farmer') return 'farmer';
  if (type === 'Fisherfolk') return 'fisherfolk';
  return 'arb';
}

function renderClients(clients) {
  const tbody = document.getElementById('clientsTbody');
  const empty = document.getElementById('clientsEmpty');
  tbody.innerHTML = '';

  if (clients.length === 0) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  clients.forEach(c => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="name-cell">${escapeHtml(c.name)}</td>
      <td><span class="badge ${badgeClass(c.type)}"><span class="dot"></span>${escapeHtml(c.type)}</span></td>
      <td>${escapeHtml(c.sex)}</td>
      <td>${escapeHtml(c.municipality)}<div class="sub-cell">${escapeHtml(c.barangay)}</div></td>
      <td>${escapeHtml(c.keyDetail)}</td>
      <td>${escapeHtml(c.contact)}</td>
      <td class="row-actions">
        <button class="link-btn" data-edit="${c.id}">Edit</button>
        <button class="link-btn" data-delete="${c.id}" style="color:var(--brand-red);">Delete</button>
      </td>`;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', () => editClient(btn.dataset.edit, clients));
  });
  tbody.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', () => deleteClient(btn.dataset.delete));
  });
}

function openClientModal(client) {
  document.getElementById('clientModalTitle').textContent = client ? 'Edit Client Record' : 'Add Client Record';
  document.getElementById('clientId').value = client ? client.id : '';
  document.getElementById('c_type').value = client ? client.type : 'Farmer';
  document.getElementById('c_sex').value = client ? client.sex : 'Female';
  document.getElementById('c_name').value = client ? client.name : '';
  document.getElementById('c_contact').value = client ? client.contact : '';
  document.getElementById('c_municipality').value = client ? client.municipality : '';
  document.getElementById('c_barangay').value = client ? client.barangay : '';
  document.getElementById('c_keyDetail').value = client ? client.keyDetail : '';
  openModal('clientModalBackdrop');
}

function editClient(id, clients) {
  const client = clients.find(c => String(c.id) === String(id));
  openClientModal(client);
}

async function deleteClient(id) {
  if (!confirm('Delete this client record?')) return;
  const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
  if (res.ok) loadClients();
}

// ================= PROGRAMS =================

function wireProgramControls() {
  document.getElementById('openAddProgram').addEventListener('click', () => openProgramModal());

  document.getElementById('programForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('programId').value;
    const payload = {
      name: document.getElementById('p_name').value.trim(),
      description: document.getElementById('p_description').value.trim(),
      fundingSource: document.getElementById('p_fundingSource').value.trim(),
      coverageArea: document.getElementById('p_coverageArea').value.trim(),
      status: document.getElementById('p_status').value
    };

    const url = id ? `/api/programs/${id}` : '/api/programs';
    const method = id ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      closeModal('programModalBackdrop');
      loadPrograms();
    } else {
      const data = await res.json();
      alert(data.error || 'Could not save program.');
    }
  });
}

async function loadPrograms() {
  const res = await fetch('/api/programs');
  const programs = await res.json();
  renderPrograms(programs);
}

function renderPrograms(programs) {
  const tbody = document.getElementById('programsTbody');
  const empty = document.getElementById('programsEmpty');
  tbody.innerHTML = '';

  if (programs.length === 0) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  programs.forEach(p => {
    const statusClass = p.status === 'Active' ? 'active' : (p.status === 'Pending' ? 'pending' : '');
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="name-cell">${escapeHtml(p.name)}</td>
      <td>${escapeHtml(p.fundingSource)}</td>
      <td>${escapeHtml(p.coverageArea)}</td>
      <td>${p.linkedProjects} project${p.linkedProjects === 1 ? '' : 's'}</td>
      <td><span class="status-pill ${statusClass}">${escapeHtml(p.status)}</span></td>
      <td class="row-actions">
        <button class="link-btn" data-edit="${p.id}">Edit</button>
        <button class="link-btn" data-delete="${p.id}" style="color:var(--brand-red);">Delete</button>
      </td>`;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', () => editProgram(btn.dataset.edit, programs));
  });
  tbody.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', () => deleteProgram(btn.dataset.delete));
  });
}

function openProgramModal(program) {
  document.getElementById('programModalTitle').textContent = program ? 'Edit Program' : 'Add Program';
  document.getElementById('programId').value = program ? program.id : '';
  document.getElementById('p_name').value = program ? program.name : '';
  document.getElementById('p_description').value = program ? program.description : '';
  document.getElementById('p_fundingSource').value = program ? program.fundingSource : '';
  document.getElementById('p_coverageArea').value = program ? program.coverageArea : '';
  document.getElementById('p_status').value = program ? program.status : 'Active';
  openModal('programModalBackdrop');
}

function editProgram(id, programs) {
  const program = programs.find(p => String(p.id) === String(id));
  openProgramModal(program);
}

async function deleteProgram(id) {
  if (!confirm('Delete this program?')) return;
  const res = await fetch(`/api/programs/${id}`, { method: 'DELETE' });
  if (res.ok) loadPrograms();
}

// ================= PROJECTS =================

let programsCache = []; // used to populate the "Linked Program" dropdown

function wireProjectControls() {
  document.getElementById('openAddProject').addEventListener('click', () => openProjectModal());

  document.getElementById('projectForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('projectId').value;
    const payload = {
      name: document.getElementById('pr_name').value.trim(),
      programId: document.getElementById('pr_programId').value,
      location: document.getElementById('pr_location').value.trim(),
      status: document.getElementById('pr_status').value,
      budget: document.getElementById('pr_budget').value,
      beneficiaries: document.getElementById('pr_beneficiaries').value,
      startDate: document.getElementById('pr_startDate').value,
      endDate: document.getElementById('pr_endDate').value
    };

    const url = id ? `/api/projects/${id}` : '/api/projects';
    const method = id ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      closeModal('projectModalBackdrop');
      loadProjects();
      loadPrograms(); // linked-project counts may have changed
    } else {
      const data = await res.json();
      alert(data.error || 'Could not save project.');
    }
  });
}

async function loadProjects() {
  const res = await fetch('/api/projects');
  const projects = await res.json();
  renderProjects(projects);
}

function peso(n) {
  const amount = Number(n || 0).toLocaleString('en-PH');
  return `<span class="currency-symbol">&#8369;</span> ${amount}`;
}

function renderProjects(projects) {
  const tbody = document.getElementById('projectsTbody');
  const empty = document.getElementById('projectsEmpty');
  tbody.innerHTML = '';

  if (projects.length === 0) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  const statusClassMap = { Ongoing: 'active', Completed: 'active', Planning: 'pending', 'On Hold': 'pending' };

  projects.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="name-cell">${escapeHtml(p.name)}<div class="sub-cell">${escapeHtml(p.startDate || '')}${p.endDate ? ' &rarr; ' + escapeHtml(p.endDate) : ''}</div></td>
      <td>${escapeHtml(p.programName)}</td>
      <td>${escapeHtml(p.location)}</td>
      <td>${peso(p.budget)}</td>
      <td>${Number(p.beneficiaries || 0).toLocaleString()}</td>
      <td><span class="status-pill ${statusClassMap[p.status] || ''}">${escapeHtml(p.status)}</span></td>
      <td class="row-actions">
        <button class="link-btn" data-edit="${p.id}">Edit</button>
        <button class="link-btn" data-delete="${p.id}" style="color:var(--brand-red);">Delete</button>
      </td>`;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', () => editProject(btn.dataset.edit, projects));
  });
  tbody.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', () => deleteProject(btn.dataset.delete));
  });
}

async function populateProgramDropdown(selectedProgramId) {
  const res = await fetch('/api/programs');
  programsCache = await res.json();
  const select = document.getElementById('pr_programId');
  select.innerHTML = programsCache.map(p =>
    `<option value="${p.id}">${escapeHtml(p.name)}</option>`
  ).join('');
  if (selectedProgramId) select.value = selectedProgramId;
}

async function openProjectModal(project) {
  document.getElementById('projectModalTitle').textContent = project ? 'Edit Project' : 'Add Project';
  document.getElementById('projectId').value = project ? project.id : '';
  await populateProgramDropdown(project ? project.programId : undefined);
  document.getElementById('pr_name').value = project ? project.name : '';
  document.getElementById('pr_location').value = project ? project.location : '';
  document.getElementById('pr_status').value = project ? project.status : 'Planning';
  document.getElementById('pr_budget').value = project ? project.budget : '';
  document.getElementById('pr_beneficiaries').value = project ? project.beneficiaries : '';
  document.getElementById('pr_startDate').value = project ? project.startDate : '';
  document.getElementById('pr_endDate').value = project ? project.endDate : '';
  openModal('projectModalBackdrop');
}

function editProject(id, projects) {
  const project = projects.find(p => String(p.id) === String(id));
  openProjectModal(project);
}

async function deleteProject(id) {
  if (!confirm('Delete this project?')) return;
  const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
  if (res.ok) {
    loadProjects();
    loadPrograms();
  }
}

// ================= DASHBOARD OVERVIEW & REPORTS =================

async function loadSummary() {
  const res = await fetch('/api/reports/summary');
  const summary = await res.json();
  renderDashboardSummary(summary);
  renderReportsSummary(summary);
}

function renderBarChart(container, dataObj, maxOverride) {
  const entries = Object.entries(dataObj);
  const max = maxOverride || Math.max(1, ...entries.map(([, v]) => v));
  container.innerHTML = entries.map(([label, value]) => `
    <div class="bar-row">
      <div class="bar-label">${escapeHtml(label)}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${(value / max) * 100}%"></div></div>
      <div class="bar-count">${value}</div>
    </div>
  `).join('') || '<div class="lede">No data yet.</div>';
}

function renderDashboardSummary(summary) {
  document.getElementById('statClients').textContent = summary.totals.clients;

  const activePrograms = summary.programsByStatus['Active'] || 0;
  document.getElementById('statPrograms').textContent = activePrograms;
  document.getElementById('statProgramsSub').textContent = `${summary.totals.programs} total programs`;

  const ongoingProjects = summary.projectsByStatus['Ongoing'] || 0;
  document.getElementById('statProjects').textContent = ongoingProjects;
  document.getElementById('statProjectsSub').textContent = `${summary.totals.projects} total projects`;

  document.getElementById('statBudget').innerHTML = peso(summary.totals.totalBudget);
  document.getElementById('statBeneficiaries').textContent =
    `${summary.totals.totalBeneficiaries.toLocaleString()} beneficiaries targeted`;

  renderBarChart(document.getElementById('clientsByTypeChart'), summary.clientsByType);
  renderBarChart(document.getElementById('clientsByMuniChart'), summary.clientsByMunicipality);
}

function renderReportsSummary(summary) {
  document.getElementById('rClientsFarmer').textContent = summary.clientsByType['Farmer'] || 0;
  document.getElementById('rClientsFisherfolk').textContent = summary.clientsByType['Fisherfolk'] || 0;
  document.getElementById('rClientsArb').textContent = summary.clientsByType['ARB'] || 0;
  document.getElementById('rBeneficiaries').textContent = summary.totals.totalBeneficiaries.toLocaleString();

  renderBarChart(document.getElementById('programsByStatusChart'), summary.programsByStatus);
}

// ================= NEWS & ANNOUNCEMENTS (admin only) =================

let newsCategoriesBySection = { KnowledgeCorner: [], News: [] };

async function loadNewsCategories() {
  const res = await fetch('/api/news/categories');
  if (res.ok) newsCategoriesBySection = await res.json();
}

function populateNewsCategoryDropdown(section, selectedCategory) {
  const select = document.getElementById('n_category');
  const options = newsCategoriesBySection[section] || [];
  select.innerHTML = options.map(cat => `<option>${cat}</option>`).join('');
  if (selectedCategory && options.includes(selectedCategory)) select.value = selectedCategory;
}

function wireNewsControls() {
  document.getElementById('openAddNews').addEventListener('click', () => openNewsModal());

  document.getElementById('n_section').addEventListener('change', (e) => {
    populateNewsCategoryDropdown(e.target.value);
  });

  document.getElementById('newsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('newsId').value;
    const payload = {
      title: document.getElementById('n_title').value.trim(),
      body: document.getElementById('n_body').value.trim(),
      section: document.getElementById('n_section').value,
      category: document.getElementById('n_category').value,
      date: document.getElementById('n_date').value,
      status: document.getElementById('n_status').value,
      youtubeUrl: document.getElementById('n_youtube').value.trim(),
      facebookUrl: document.getElementById('n_facebook').value.trim()
    };

    const url = id ? `/api/news/${id}` : '/api/news';
    const method = id ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      closeModal('newsModalBackdrop');
      loadNews();
    } else {
      const data = await res.json();
      alert(data.error || 'Could not save news post.');
    }
  });
}

async function loadNews() {
  if (newsCategoriesBySection.KnowledgeCorner.length === 0) await loadNewsCategories();
  const res = await fetch('/api/news');
  if (!res.ok) return; // non-admins simply won't see this view
  const news = await res.json();
  renderNews(news);
}

function renderNews(news) {
  const tbody = document.getElementById('newsTbody');
  const empty = document.getElementById('newsEmpty');
  tbody.innerHTML = '';

  if (news.length === 0) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  news.forEach(n => {
    const tr = document.createElement('tr');
    const hasMedia = n.youtubeUrl || n.facebookUrl;
    tr.innerHTML = `
      <td class="name-cell">${escapeHtml(n.title)}${hasMedia ? ' <span class="sub-cell">&#127909; media attached</span>' : ''}</td>
      <td>${escapeHtml(n.section === 'News' ? 'News' : 'Knowledge Corner')}</td>
      <td>${escapeHtml(n.category || '')}</td>
      <td>${escapeHtml(n.date)}</td>
      <td><span class="status-pill ${n.status === 'Published' ? 'active' : 'pending'}">${escapeHtml(n.status)}</span></td>
      <td class="row-actions">
        <button class="link-btn" data-edit="${n.id}">Edit</button>
        <button class="link-btn" data-delete="${n.id}" style="color:var(--brand-red);">Delete</button>
      </td>`;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', () => openNewsModal(news.find(n => String(n.id) === btn.dataset.edit)));
  });
  tbody.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', () => deleteNews(btn.dataset.delete));
  });
}

async function openNewsModal(post) {
  if (newsCategoriesBySection.KnowledgeCorner.length === 0) await loadNewsCategories();

  document.getElementById('newsModalTitle').textContent = post ? 'Edit News Post' : 'Add News Post';
  document.getElementById('newsId').value = post ? post.id : '';
  document.getElementById('n_title').value = post ? post.title : '';
  document.getElementById('n_body').value = post ? post.body : '';
  document.getElementById('n_section').value = post ? (post.section || 'KnowledgeCorner') : 'KnowledgeCorner';
  populateNewsCategoryDropdown(document.getElementById('n_section').value, post ? post.category : undefined);
  document.getElementById('n_date').value = post ? post.date : new Date().toISOString().slice(0, 10);
  document.getElementById('n_status').value = post ? post.status : 'Published';
  document.getElementById('n_youtube').value = post ? (post.youtubeUrl || '') : '';
  document.getElementById('n_facebook').value = post ? (post.facebookUrl || '') : '';
  openModal('newsModalBackdrop');
}

async function deleteNews(id) {
  if (!confirm('Delete this news post? It will disappear from the homepage immediately.')) return;
  const res = await fetch(`/api/news/${id}`, { method: 'DELETE' });
  if (res.ok) loadNews();
}

// ================= ISSUANCES & DOWNLOADS (admin only) =================

let resourceCategoriesBySection = {};
let currentResourceSection = 'Issuances';

async function loadResourceCategories() {
  const res = await fetch('/api/resources/categories');
  if (res.ok) resourceCategoriesBySection = await res.json();
}

function populateResourceCategoryDropdown(section, selectedCategory) {
  const select = document.getElementById('r_category');
  const options = resourceCategoriesBySection[section] || [];
  select.innerHTML = options.map(cat => `<option>${cat}</option>`).join('');
  if (selectedCategory && options.includes(selectedCategory)) select.value = selectedCategory;
}

function wireResourceControls() {
  document.getElementById('openAddResource').addEventListener('click', () => openResourceModal());

  document.querySelectorAll('#resourceSectionTabs button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#resourceSectionTabs button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentResourceSection = btn.dataset.section;
      loadResources();
    });
  });

  document.getElementById('r_section').addEventListener('change', (e) => {
    populateResourceCategoryDropdown(e.target.value);
  });

  document.getElementById('resourceForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('resourceId').value;
    const payload = {
      title: document.getElementById('r_title').value.trim(),
      description: document.getElementById('r_description').value.trim(),
      section: document.getElementById('r_section').value,
      category: document.getElementById('r_category').value,
      date: document.getElementById('r_date').value,
      status: document.getElementById('r_status').value,
      fileUrl: document.getElementById('r_fileUrl').value.trim()
    };

    const url = id ? `/api/resources/${id}` : '/api/resources';
    const method = id ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      closeModal('resourceModalBackdrop');
      loadResources();
    } else {
      const data = await res.json();
      alert(data.error || 'Could not save item.');
    }
  });
}

async function loadResources() {
  if (Object.keys(resourceCategoriesBySection).length === 0) await loadResourceCategories();
  const res = await fetch(`/api/resources?section=${encodeURIComponent(currentResourceSection)}`);
  if (!res.ok) return;
  const resources = await res.json();
  renderResources(resources);
}

function renderResources(resources) {
  const tbody = document.getElementById('resourcesTbody');
  const empty = document.getElementById('resourcesEmpty');
  tbody.innerHTML = '';

  if (resources.length === 0) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  resources.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="name-cell">${escapeHtml(r.title)}</td>
      <td>${escapeHtml(r.category)}</td>
      <td>${escapeHtml(r.date)}</td>
      <td><span class="status-pill ${r.status === 'Published' ? 'active' : 'pending'}">${escapeHtml(r.status)}</span></td>
      <td class="row-actions">
        <button class="link-btn" data-edit="${r.id}">Edit</button>
        <button class="link-btn" data-delete="${r.id}" style="color:var(--brand-red);">Delete</button>
      </td>`;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', () => openResourceModal(resources.find(r => String(r.id) === btn.dataset.edit)));
  });
  tbody.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', () => deleteResource(btn.dataset.delete));
  });
}

async function openResourceModal(resource) {
  if (Object.keys(resourceCategoriesBySection).length === 0) await loadResourceCategories();

  document.getElementById('resourceModalTitle').textContent = resource ? 'Edit Item' : 'Add Item';
  document.getElementById('resourceId').value = resource ? resource.id : '';
  document.getElementById('r_title').value = resource ? resource.title : '';
  document.getElementById('r_description').value = resource ? resource.description : '';
  document.getElementById('r_section').value = resource ? resource.section : currentResourceSection;
  populateResourceCategoryDropdown(document.getElementById('r_section').value, resource ? resource.category : undefined);
  document.getElementById('r_date').value = resource ? resource.date : new Date().toISOString().slice(0, 10);
  document.getElementById('r_status').value = resource ? resource.status : 'Published';
  document.getElementById('r_fileUrl').value = resource ? (resource.fileUrl || '') : '';
  openModal('resourceModalBackdrop');
}

async function deleteResource(id) {
  if (!confirm('Delete this item? It will disappear from the public page immediately.')) return;
  const res = await fetch(`/api/resources/${id}`, { method: 'DELETE' });
  if (res.ok) loadResources();
}

// ================= FAQS (admin only) =================

function wireFaqControls() {
  document.getElementById('openAddFaq').addEventListener('click', () => openFaqModal());

  document.getElementById('faqForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('faqId').value;
    const payload = {
      question: document.getElementById('f_question').value.trim(),
      answer: document.getElementById('f_answer').value.trim(),
      status: document.getElementById('f_status').value
    };

    const url = id ? `/api/faqs/${id}` : '/api/faqs';
    const method = id ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      closeModal('faqModalBackdrop');
      loadFaqs();
    } else {
      const data = await res.json();
      alert(data.error || 'Could not save FAQ.');
    }
  });
}

async function loadFaqs() {
  const res = await fetch('/api/faqs');
  if (!res.ok) return;
  const faqs = await res.json();
  renderFaqs(faqs);
}

function renderFaqs(faqs) {
  const tbody = document.getElementById('faqsTbody');
  const empty = document.getElementById('faqsEmpty');
  tbody.innerHTML = '';

  if (faqs.length === 0) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  faqs.forEach(f => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="name-cell">${escapeHtml(f.question)}</td>
      <td><span class="status-pill ${f.status === 'Published' ? 'active' : 'pending'}">${escapeHtml(f.status)}</span></td>
      <td class="row-actions">
        <button class="link-btn" data-edit="${f.id}">Edit</button>
        <button class="link-btn" data-delete="${f.id}" style="color:var(--brand-red);">Delete</button>
      </td>`;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', () => openFaqModal(faqs.find(f => String(f.id) === btn.dataset.edit)));
  });
  tbody.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', () => deleteFaq(btn.dataset.delete));
  });
}

function openFaqModal(faq) {
  document.getElementById('faqModalTitle').textContent = faq ? 'Edit FAQ' : 'Add FAQ';
  document.getElementById('faqId').value = faq ? faq.id : '';
  document.getElementById('f_question').value = faq ? faq.question : '';
  document.getElementById('f_answer').value = faq ? faq.answer : '';
  document.getElementById('f_status').value = faq ? faq.status : 'Published';
  openModal('faqModalBackdrop');
}

async function deleteFaq(id) {
  if (!confirm('Delete this FAQ?')) return;
  const res = await fetch(`/api/faqs/${id}`, { method: 'DELETE' });
  if (res.ok) loadFaqs();
}

// ================= MANAGE USERS (admin only) =================

function wireUserControls() {
  document.getElementById('userForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('userId').value;
    const payload = {
      fullName: document.getElementById('u_fullName').value.trim(),
      position: document.getElementById('u_position').value.trim(),
      role: document.getElementById('u_role').value
    };
    const res = await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      closeModal('userModalBackdrop');
      loadUsers();
    } else {
      const data = await res.json();
      alert(data.error || 'Could not update user.');
    }
  });

  document.getElementById('resetPasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('resetUserId').value;
    const newPassword = document.getElementById('rp_newPassword').value;
    const confirmPassword = document.getElementById('rp_confirmPassword').value;
    const errBox = document.getElementById('resetPasswordError');
    errBox.style.display = 'none';

    if (newPassword !== confirmPassword) {
      errBox.textContent = "Those passwords don't match.";
      errBox.style.display = 'block';
      return;
    }

    const res = await fetch(`/api/users/${id}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword })
    });
    if (res.ok) {
      closeModal('resetPasswordModalBackdrop');
      alert('Password reset. Be sure to share the new password with them securely.');
    } else {
      const data = await res.json();
      errBox.textContent = data.error || 'Could not reset password.';
      errBox.style.display = 'block';
    }
  });
}

async function loadUsers() {
  const res = await fetch('/api/users');
  if (!res.ok) return; // non-admins simply won't see this view
  const users = await res.json();
  renderUsers(users);
}

function renderUsers(users) {
  const tbody = document.getElementById('usersTbody');
  const empty = document.getElementById('usersEmpty');
  tbody.innerHTML = '';

  if (users.length === 0) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  users.forEach(u => {
    const isSelf = currentUser && currentUser.id === u.id;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="name-cell">${escapeHtml(u.fullName)}${isSelf ? ' <span class="sub-cell">(you)</span>' : ''}</td>
      <td>${escapeHtml(u.username)}</td>
      <td>${escapeHtml(u.email)}</td>
      <td>${escapeHtml(u.position || '')}</td>
      <td><span class="badge ${u.role === 'admin' ? 'arb' : 'farmer'}"><span class="dot"></span>${escapeHtml(u.role)}</span></td>
      <td class="row-actions">
        <button class="link-btn" data-edit="${u.id}">Edit</button>
        <button class="link-btn" data-reset="${u.id}">Reset Password</button>
        ${isSelf ? '' : `<button class="link-btn" data-delete="${u.id}" style="color:var(--brand-red);">Delete</button>`}
      </td>`;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', () => openUserModal(users.find(u => String(u.id) === btn.dataset.edit)));
  });
  tbody.querySelectorAll('[data-reset]').forEach(btn => {
    btn.addEventListener('click', () => openResetPasswordModal(users.find(u => String(u.id) === btn.dataset.reset)));
  });
  tbody.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', () => deleteUser(btn.dataset.delete));
  });
}

function openUserModal(user) {
  document.getElementById('userId').value = user.id;
  document.getElementById('u_fullName').value = user.fullName;
  document.getElementById('u_position').value = user.position || '';
  document.getElementById('u_role').value = user.role;
  openModal('userModalBackdrop');
}

function openResetPasswordModal(user) {
  document.getElementById('resetUserId').value = user.id;
  document.getElementById('resetUserName').textContent = user.fullName;
  document.getElementById('rp_newPassword').value = '';
  document.getElementById('rp_confirmPassword').value = '';
  document.getElementById('resetPasswordError').style.display = 'none';
  openModal('resetPasswordModalBackdrop');
}

async function deleteUser(id) {
  if (!confirm('Remove this user account? They will no longer be able to log in.')) return;
  const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
  if (res.ok) {
    loadUsers();
  } else {
    const data = await res.json();
    alert(data.error || 'Could not delete user.');
  }
}

// ================= Modal helpers =================

function wireModals() {
  document.querySelectorAll('[data-close]').forEach(el => {
    el.addEventListener('click', () => closeModal(el.dataset.close));
  });
  document.querySelectorAll('.modal-backdrop').forEach(bd => {
    bd.addEventListener('click', (e) => {
      if (e.target === bd) closeModal(bd.id);
    });
  });
}
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

function escapeHtml(str) {
  if (str === undefined || str === null) return '';
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

boot();

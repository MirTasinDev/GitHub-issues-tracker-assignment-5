
const defaultUsername = "admin";
const defaultPassword = "admin123";

// login
function loginUser(event) {

    event.preventDefault();

    const usernameInput = document.querySelector("input[type='text']").value;
    const passwordInput = document.querySelector("input[type='password']").value;

    if (usernameInput === defaultUsername && passwordInput === defaultPassword) {

        alert("Login Successful");

        window.location.href = "dashboard.html";

    } else {

        alert("Invalid Username or Password");

    }

}
// dashboard

const API_BASE = 'https://phi-lab-server.vercel.app/api/v1/lab';
let allIssues = [];
let currentFilter = 'all';


window.addEventListener('DOMContentLoaded', loadAllIssues);

async function loadAllIssues() {
  showLoader(true);
  try {
    const res = await fetch(`${API_BASE}/issues`);
    const data = await res.json();
    allIssues = data.data || data || [];
    renderIssues(allIssues);
  } catch (err) {
    console.error('Error:', err);
    document.getElementById('noResults').textContent = 'Failed to load issues.';
    document.getElementById('noResults').classList.remove('hidden');
  } finally {
    showLoader(false);
  }
}

function filterIssues(type) {
  currentFilter = type;
  updateTabStyles(type);
  const filtered = type === 'all'
    ? allIssues
    : allIssues.filter(i => i.status?.toLowerCase() === type);
  renderIssues(filtered);
}

function updateTabStyles(active) {
  ['all', 'open', 'closed'].forEach(key => {
    const btn = document.getElementById(key + 'Btn');
    if (key === active) {
      btn.classList.add('tab-active');
      btn.classList.remove('border-gray-200', 'text-gray-600');
    } else {
      btn.classList.remove('tab-active');
      btn.classList.add('border-gray-200', 'text-gray-600');
    }
  });
}


function searchIssues() {
  const q = document.getElementById('searchInput').value.trim();
  if (!q) { filterIssues(currentFilter); return; }
  showLoader(true);
  fetch(`${API_BASE}/issues/search?q=${encodeURIComponent(q)}`)
    .then(r => r.json())
    .then(data => renderIssues(data.data || data || []))
    .catch(console.error)
    .finally(() => showLoader(false));
}

function handleSearchKey(e) {
  if (e.key === 'Enter') searchIssues();
}

// ========================
// RENDER CARDS
// ========================
function renderIssues(issues) {
  const container = document.getElementById('issueContainer');
  const noResults = document.getElementById('noResults');
  document.getElementById('issueCount').textContent = `${issues.length} Issues`;
  container.innerHTML = '';

  if (!issues.length) {
    noResults.classList.remove('hidden');
    return;
  }
  noResults.classList.add('hidden');
  issues.forEach(issue => container.appendChild(createCard(issue)));
}

function createCard(issue) {
  const isOpen = issue.status?.toLowerCase() === 'open';
  const labels = getLabels(issue);
  const date = formatDate(issue.created_at || issue.createdAt);

  const div = document.createElement('div');
  div.className = `issue-card bg-white rounded-xl shadow-sm ${isOpen ? 'card-open' : 'card-closed'} p-5 cursor-pointer`;
  div.onclick = () => openModal(issue.id);

  div.innerHTML = `
    <div class="flex justify-between items-center mb-3">
      <span class="${isOpen ? 'text-green-500' : 'text-purple-500'}">
        ${isOpen
          ? `<img src="./assets/Open-Status.png" class="w-5 h-5" alt="open">`
          : `<img src="./assets/Closed- Status.png" class="w-5 h-5" alt="closed">`
        }
      </span>
      <span class="${getPriorityClass(issue.priority)} text-xs font-semibold px-3 py-1 rounded-full">
        ${(issue.priority || 'N/A').toUpperCase()}
      </span>
    </div>

    <h3 class="font-semibold text-gray-800 text-sm mb-2 leading-snug line-clamp-2">
      ${issue.title || 'Untitled Issue'}
    </h3>

    <p class="text-gray-500 text-xs mb-4 line-clamp-2 leading-relaxed">
      ${issue.description || issue.body || 'No description available.'}
    </p>

    <div class="flex flex-wrap gap-1.5 mb-4">
      <span class="bg-red-100 text-red-500 border border-red-200 text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1"><img src="./assets/BugDroid.png" class="w-3.5 h-3.5" alt="bug"> BUG</span>
      <span class="bg-orange-100 text-orange-500 border border-orange-200 text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1"><img src="./assets/Lifebuoy.png" class="w-3.5 h-3.5" alt="help"> HELP WANTED</span>
    </div>

    <hr class="border-gray-100 mb-3">

    <div class="flex flex-col gap-0.5 text-xs text-gray-400">
      <span>#${issue.id} by <span class="text-gray-600 font-medium">${issue.author || issue.user?.login || 'unknown'}</span></span>
      <span>${date}</span>
    </div>
  `;
  return div;
}

// ========================
// MODAL
// ========================
async function openModal(id) {
  const modal = document.getElementById('modal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  document.getElementById('modalContent').innerHTML = `<div class="flex justify-center py-8"><div class="spinner"></div></div>`;

  try {
    const res = await fetch(`${API_BASE}/issue/${id}`);
    const data = await res.json();
    renderModal(data.data || data);
  } catch {
    document.getElementById('modalContent').innerHTML = `<p class="text-red-500 text-sm">Failed to load issue.</p>`;
  }
}

function renderModal(issue) {
  const isOpen = issue.status?.toLowerCase() === 'open';
  const date = formatDate(issue.created_at || issue.createdAt);
  const author = issue.author || issue.user?.login || 'Unknown';
  const priority = (issue.priority || 'N/A').toUpperCase();
  const priorityClass = getPriorityModalClass(issue.priority);

  document.getElementById('modalContent').innerHTML = `
    <h2 class="font-bold text-gray-900 text-lg leading-snug mb-3 pr-6">${issue.title || 'Untitled'}</h2>

    <div class="flex flex-wrap items-center gap-2 mb-4 text-xs text-gray-500">
      <span class="${isOpen ? 'bg-green-500' : 'bg-purple-500'} text-white px-2.5 py-1 rounded-full font-semibold">
        ${isOpen ? 'Opened' : 'Closed'}
      </span>
      <span>• Opened by <span class="font-medium text-gray-700">${author}</span></span>
      <span>• ${date}</span>
    </div>

    <div class="flex flex-wrap gap-1.5 mb-4">
      <span class="bg-red-100 text-red-500 border border-red-200 text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
        <img src="./assets/BugDroid.png" class="w-3.5 h-3.5" alt="bug"> BUG
      </span>
      <span class="bg-orange-100 text-orange-500 border border-orange-200 text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
        <img src="./assets/Lifebuoy.png" class="w-3.5 h-3.5" alt="help"> HELP WANTED
      </span>
    </div>

    <p class="text-sm text-gray-600 leading-relaxed mb-5">${issue.description || issue.body || 'No description available.'}</p>

    <div class="bg-gray-50 rounded-lg p-4 flex gap-10 mb-5">
      <div>
        <p class="text-xs text-gray-400 mb-1">Assignee:</p>
        <p class="text-sm font-semibold text-gray-800">${author}</p>
      </div>
      <div>
        <p class="text-xs text-gray-400 mb-1">Priority:</p>
        <span class="${priorityClass} text-xs font-semibold px-3 py-1 rounded-full">${priority}</span>
      </div>
    </div>

    <div class="flex justify-end">
      <button onclick="closeModal()" class="bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-6 py-2 rounded-lg transition">
        Close
      </button>
    </div>
  `;
}

function closeModal() {
  const modal = document.getElementById('modal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

document.getElementById('modal').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});

// ========================
// HELPERS
// ========================
function showLoader(show) {
  document.getElementById('loader').classList.toggle('hidden', !show);
  if (show) document.getElementById('issueContainer').innerHTML = '';
}

function getPriorityModalClass(p) {
  const v = p?.toLowerCase();
  if (v === 'high')   return 'bg-red-500 text-white';
  if (v === 'medium') return 'bg-yellow-400 text-white';
  if (v === 'low')    return 'bg-green-500 text-white';
  return 'bg-gray-200 text-gray-600';
}

function getPriorityClass(p) {
  const v = p?.toLowerCase();
  if (v === 'high')   return 'priority-high';
  if (v === 'medium') return 'priority-medium';
  if (v === 'low')    return 'priority-low';
  return 'bg-gray-100 text-gray-500';
}

function getLabelClass(l) {
  const v = l?.toLowerCase();
  if (v?.includes('bug'))  return 'bg-red-100 text-red-500 border border-red-200';
  if (v?.includes('help')) return 'bg-orange-100 text-orange-500 border border-orange-200';
  if (v?.includes('feat')) return 'bg-blue-100 text-blue-500 border border-blue-200';
  if (v?.includes('doc'))  return 'bg-purple-100 text-purple-500 border border-purple-200';
  return 'bg-gray-100 text-gray-500 border border-gray-200';
}

function getLabelIcon(l) {
  const v = l?.toLowerCase();
  if (v?.includes('bug'))  return '🐛';
  if (v?.includes('help')) return '🤝';
  if (v?.includes('feat')) return '✨';
  if (v?.includes('doc'))  return '📄';
  return '🏷️';
}

function getLabels(issue) {
  if (Array.isArray(issue.labels)) return issue.labels.map(l => typeof l === 'string' ? l : l.name);
  if (typeof issue.labels === 'string') return [issue.labels];
  if (issue.label) return [issue.label];
  return [];
}

function formatDate(d) {
  if (!d) return 'N/A';
  const dt = new Date(d);
  return isNaN(dt) ? d : dt.toLocaleDateString('en-US');
}
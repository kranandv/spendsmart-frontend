const API_BASE_URL = "https://spendsmart-backend-ce6i.onrender.com";

// ── Main categories with monthly budget (order = display order) ──
const catMeta = {
  'Groceries':         { emoji:'🛒', color:'#FF7A45', budget:10000 },
  'Papa':              { emoji:'👴', color:'#45B4FF', budget:5000  },
  'Mummy':             { emoji:'👵', color:'#8B7FFF', budget:5000  },
  'Shikha':            { emoji:'👩', color:'#FFD166', budget:3000  },
  'Maid':              { emoji:'🧹', color:'#00E5A0', budget:2200  },
  'Electric bill':     { emoji:'💡', color:'#FF4D6A', budget:2000  },
  'Milk':              { emoji:'🥛', color:'#A8EDEA', budget:2000  },
  'Fruits':            { emoji:'🍎', color:'#F78FB3', budget:2000  },
  'Recharge':          { emoji:'📱', color:'#7BED9F', budget:1800  },
  'Maintenance':       { emoji:'🔧', color:'#70A1FF', budget:1575  },
  'Vegetable':         { emoji:'🥦', color:'#ECCC68', budget:1500  },
  'Gas':               { emoji:'🔥', color:'#FF6B81', budget:1100  },
  'Medicine':          { emoji:'💊', color:'#A29BFE', budget:1000  },
  'Petrol':            { emoji:'⛽', color:'#55E6C1', budget:700   },
  'Bathroom cleaning': { emoji:'🚿', color:'#FDA7DF', budget:200   },
  'Donation Temple':   { emoji:'🛕', color:'#FEA47F', budget:200   },
  'Others':            { emoji:'📦', color:'#6B7280', budget:15000 },
};

// ── Sub-categories of "Others" ──
const subMeta = {
  'Food Outside': { emoji:'🍔', budget:2000 },
  'Onetime':      { emoji:'🎯', budget:5000 },
  'Pp':           { emoji:'👤', budget:1000 },
  'Mm':           { emoji:'👤', budget:1000 },
  'An':           { emoji:'👤', budget:1000 },
  'Sh':           { emoji:'👤', budget:1000 },
  'Ab':           { emoji:'👤', budget:1000 },
  'Mn':           { emoji:'👤', budget:1000 },
  'Misc':         { emoji:'📌', budget:2000 },
};

// DB stores the main category name, or the sub-category name directly for "Others" items.
// Anything whose category is not a main category (other than 'Others' itself) is an Others item.
const OTHERS_ALL = '__OTHERS_ALL__';   // filter value meaning "every Others item"
const isMain   = c => c !== 'Others' && Object.prototype.hasOwnProperty.call(catMeta, c);
const isOthers = c => !isMain(c);      // sub-categories, legacy/unknown names, or 'Others'

let editingId    = null;
let deletingId   = null;
let selectedCat  = '';
let selectedSub  = '';
let selectedMode = 'CC';
let selectedType = 'Need';
let cat  = null;
let from = null;
let to   = null;

// ── Date helpers ──
function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}
const nowDt     = new Date();
const firstDate = new Date(nowDt.getFullYear(), nowDt.getMonth(), 1);
const lastDate  = new Date(nowDt.getFullYear(), nowDt.getMonth() + 1, 0);
document.getElementById('filter-from').value = formatDate(firstDate);
document.getElementById('filter-to').value   = formatDate(lastDate);

// ── Build category pills / filter options from catMeta ──
function buildCategoryUI() {
  // filter dropdown
  const sel = document.getElementById('filter-cat');
  sel.innerHTML = '<option value="">All Categories</option>' +
    Object.keys(catMeta).filter(c => c !== 'Others').map(c => `<option value="${c}">${c}</option>`).join('') +
    `<option value="${OTHERS_ALL}">Others (all)</option>` +
    '<optgroup label="Others — sub-category">' +
    Object.keys(subMeta).map(s => `<option value="${s}">${s}</option>`).join('') +
    '</optgroup>';

  // modal pills
  document.getElementById('cat-pills').innerHTML = Object.keys(catMeta).map(c =>
    `<button type="button" class="cat-pill" data-cat="${c}" onclick="selectCat(this,'${c}')">${catMeta[c].emoji} ${c}</button>`
  ).join('');

  // sub-category pills (shown only when Others is selected)
  document.getElementById('sub-pills').innerHTML = Object.keys(subMeta).map(s =>
    `<button type="button" class="sub-pill" data-sub="${s}" onclick="selectSub(this,'${s}')">${subMeta[s].emoji} ${s}</button>`
  ).join('');
}
buildCategoryUI();

function toggleSubGroup() {
  document.getElementById('sub-group').style.display = (selectedCat === 'Others') ? '' : 'none';
}

// ── Render table ─────────────────────────────────────────────
function renderTable(data) {
  const tbody = document.getElementById('expense-tbody');
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state"><div class="emoji">💸</div>No expenses found. Add your first one!</div></td></tr>`;
    return;
  }
  tbody.innerHTML = data.map(e => {
    const m = isMain(e.category) ? catMeta[e.category] : catMeta['Others'];
    const bg = m.color + '26'; // ~15% alpha
    const d = new Date(e.date);
    const dateStr = d.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});
    const catLabel = isMain(e.category) ? e.category
                   : (e.category === 'Others' ? 'Others' : `Others › ${e.category}`);
    return `
    <tr>
      <td class="td-date">${dateStr}</td>
      <td class="td-desc">
        ${e.description}
        ${e.notes ? `<small>${e.notes}</small>` : ''}
      </td>
      <td>
        <span class="cat-badge" style="background:${bg};color:${m.color}">
          ${m.emoji} ${catLabel}
        </span>
      </td>
      <td class="td-amt" style="color:var(--green)">₹${e.amount.toLocaleString('en-IN')}</td>
      <td>
        <div class="td-actions">
          <button class="icon-btn edit"   onclick="openEditModal(${e.id})" title="Edit">✏️</button>
          <button class="icon-btn delete" onclick="openDeleteModal(${e.id},'${encodeURIComponent(e.description)}')" title="Delete">🗑️</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

// ── Charts ───────────────────────────────────────────────────
let spendChart;
let othersChart;

// Generic "spent vs budget" bar chart. Bars turn red when spent > budget;
// budget is drawn as a horizontal marker on each bar.
function drawBudgetChart(existing, canvasId, labels, spent, budgets, colors) {
  if (existing) existing.destroy();
  const ctx = document.getElementById(canvasId).getContext('2d');
  const barColors = spent.map((v, i) => v > budgets[i] ? 'rgba(255,77,106,.9)' : colors[i]);
  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          type: 'bar',
          label: 'Spent (₹)',
          data: spent,
          backgroundColor: barColors,
          borderColor: 'transparent',
          borderRadius: 8,
          borderSkipped: false,
          order: 2,
        },
        {
          type: 'line',
          label: 'Budget (₹)',
          data: budgets,
          showLine: false,
          pointStyle: 'line',
          pointRadius: 10,
          pointHoverRadius: 12,
          borderColor: '#E8E6F0',
          borderWidth: 2,
          order: 1,
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#12141E',
          borderColor: '#1E2030',
          borderWidth: 1,
          titleColor: '#E8E6F0',
          bodyColor: '#6B7280',
          titleFont: { family: 'Syne', weight: '700', size: 12 },
          bodyFont: { family: 'DM Mono', size: 11 },
          callbacks: {
            label: c => `  ${c.dataset.label}: ₹${c.raw.toLocaleString('en-IN')}`
          }
        }
      },
      scales: {
        x: {
          grid: { color: '#1E2030' },
          ticks: { color: '#6B7280', font: { family: 'DM Mono', size: 10 }, maxRotation: 60, minRotation: 40 },
          border: { color: '#1E2030' }
        },
        y: {
          grid: { color: '#1E2030' },
          ticks: {
            color: '#6B7280',
            font: { family: 'DM Mono', size: 10 },
            callback: v => '₹' + (v / 1000).toFixed(0) + 'K'
          },
          border: { color: '#1E2030' }
        }
      }
    }
  });
}

// Main chart: ALL main categories (zero if no spend), in budget order.
// Every non-main category name (sub-categories etc.) is rolled into the "Others" bar.
function generateCharts(summary) {
  const totals = {};
  summary.forEach(item => {
    const key = isMain(item.category) ? item.category : 'Others';
    totals[key] = (totals[key] || 0) + item.total;
  });
  const labels  = Object.keys(catMeta);
  const spent   = labels.map(c => totals[c] || 0);
  const budgets = labels.map(c => catMeta[c].budget);
  const colors  = labels.map(c => catMeta[c].color + 'D9'); // ~85% alpha
  spendChart = drawBudgetChart(spendChart, 'spendChart', labels, spent, budgets, colors);
}

// Others chart: sub-categories only.
function generateOthersChart(summary) {
  const totals = {};
  let unmapped = 0;   // old/unknown category names, or rows saved as plain "Others"
  summary.filter(item => isOthers(item.category)).forEach(item => {
    if (subMeta[item.category]) totals[item.category] = (totals[item.category] || 0) + item.total;
    else unmapped += item.total;
  });
  const labels  = Object.keys(subMeta);
  const spent   = labels.map(s => totals[s] || 0);
  const budgets = labels.map(s => subMeta[s].budget);
  if (unmapped > 0) { labels.push('Unmapped'); spent.push(unmapped); budgets.push(0); }
  const colors  = labels.map(() => 'rgba(107,114,128,.9)');
  othersChart = drawBudgetChart(othersChart, 'othersChart', labels, spent, budgets, colors);
  const sum = spent.reduce((a, b) => a + b, 0);
  document.getElementById('othersTotal').textContent =
    '₹' + sum.toLocaleString('en-IN') + ' of ₹' + catMeta['Others'].budget.toLocaleString('en-IN');
}

async function loadSpendChart() {
  try {
    const token = getCookie('access_token');
    getFilterData();
    // "Others (all)" is not a DB value: fetch everything and keep only Others rows below
    const apiCat = (cat === OTHERS_ALL) ? '' : encodeURIComponent(cat);
    const response = await apiFetch(`${API_BASE_URL}/expenses/chart-data?category=${apiCat}&start_date=${from}&end_date=${to}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });

    if (response.ok) {
      const result = await response.json();
      let summary       = result.chart_data || [];
      const typeSummary = result.typeSummary || [];
      if (cat === OTHERS_ALL) summary = summary.filter(i => isOthers(i.category));

      generateCharts(summary);
      generateOthersChart(summary);
      generateCategoryBars(typeSummary);
    } else {
      if (response.status == 401) window.location.href = '/login.html';
      const errorData = await response.json();
      alert(`Error: ${errorData.detail}`);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('An error occurred. Please try again.');
  }
}

function generateCategoryBars(summary) {
  if (summary.length === 0) {
    document.getElementById('categoryBars').innerHTML = '<p>No expenses found.</p>';
    return;
  }
  const maxAmount = Math.max(...summary.map(item => item.total));
  const sumAmount = summary.reduce((sum, item) => sum + item.total, 0);
  let html = '';
  summary.forEach(item => {
    const percentage = maxAmount > 0 ? Math.round((item.total / maxAmount) * 100) : 0;
    const emoji = getEtypeEmoji(item.etype);
    const color = getEtypeColor(item.etype);
    html += `
      <div class="cat-row">
        <div class="cat-info">
          <span class="cat-name">${emoji} ${item.etype}</span>
          <span class="cat-amt">₹${item.total.toLocaleString('en-IN')}</span>
        </div>
        <div class="bar-track">
          <div class="bar-fill" style="width: ${percentage}%; background: ${color}"></div>
        </div>
      </div>`;
  });
  document.getElementById('catTotal').innerHTML = '₹' + sumAmount.toLocaleString('en-IN') + ' total';
  document.getElementById('categoryBars').innerHTML = html;
}
document.addEventListener('DOMContentLoaded', loadSpendChart);

function getEtypeColor(t) {
  const colors = { 'Need': 'var(--orange)', 'Saving': 'var(--green)', 'Want': 'var(--red)' };
  return colors[t] || 'var(--primary)';
}
function getEtypeEmoji(t) {
  const emojis = { 'Need': '🍔', 'Want': '🛍️', 'Saving': '🏥' };
  return emojis[t] || '📌';
}

async function getSummary() {
  try {
    const token = getCookie('access_token');
    const response = await apiFetch(`${API_BASE_URL}/expenses/summary`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });

    if (response.ok) {
      const e = await response.json();
      let card1 = '<div class="trend down">▼ ' + e.incr_percentage + '%</div>';
      if (e.incr_percentage > 0)
        card1 = '<div class="trend up">▲ ' + e.incr_percentage + '%</div>';
      card1 += '<div class="icon">💰</div>' +
        '<div class="label">Total This Month</div>' +
        '<div class="value" id="card-total">₹' + e.this_month_total + '</div>';
      const card2 = '<div class="icon">🔥</div>' +
        '<div class="label">Highest Category</div>' +
        '<div class="value" id="card-top-cat">' + e.highest_category + '</div>' +
        '<div class="sub" id="card-top-amt">₹' + e.highest_amount + ' spent · ' + e.highest_percentage + '%</div>';
      let card3 = '<div class="trend down">▼ ' + e.count_change + '</div>';
      if (e.count_change > 0)
        card3 = '<div class="trend up">▲ ' + e.count_change + '</div>';
      card3 += '<div class="icon">📋</div>' +
        '<div class="label">Total Expenses</div>' +
        '<div class="value" id="card-count">' + e.this_month_count + '</div>' +
        '<div class="sub">transactions this month</div>';
      document.getElementById('card1').innerHTML = card1;
      document.getElementById('card2').innerHTML = card2;
      document.getElementById('card3').innerHTML = card3;
      document.getElementById('card-avg').innerHTML = '₹' + e.month_avg;
    } else {
      if (response.status == 401) window.location.href = '/login.html';
      const errorData = await response.json();
      alert(`Error: ${errorData.detail}`);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('An error occurred. Please try again.');
  }
}
getSummary();

// ── Filter ────────────────────────────────────────────────────
function getFilterData() {
  cat  = document.getElementById('filter-cat').value;
  from = document.getElementById('filter-from').value;
  to   = document.getElementById('filter-to').value;
}
function applyFilter() {
  getFilterData();
  getExpenseDetails(cat, from, to);
  loadSpendChart();
  renderChips(cat, from, to);
}
function resetFilter() {
  document.getElementById('filter-cat').value  = '';
  document.getElementById('filter-from').value = formatDate(firstDate);
  document.getElementById('filter-to').value   = formatDate(lastDate);
  document.getElementById('active-chips').style.display = 'none';
  getFilterData();
  getExpenseDetails(cat, from, to);
  loadSpendChart();
}
function renderChips(cat, from, to) {
  const wrap = document.getElementById('active-chips');
  const chips = [];
  if (cat)  chips.push(`<div class="chip">${cat} <span class="chip-x" onclick="resetFilter()">✕</span></div>`);
  if (from) chips.push(`<div class="chip">${from} – ${to} <span class="chip-x" onclick="resetFilter()">✕</span></div>`);
  if (chips.length) {
    wrap.style.display = 'flex';
    wrap.innerHTML = `<span style="font-family:'DM Mono',monospace;font-size:10px;color:var(--muted);align-self:center">Active:</span>` + chips.join('');
  } else {
    wrap.style.display = 'none';
  }
}

// ── Modal: Add / Edit ─────────────────────────────────────────
function openAddModal() {
  editingId    = null;
  selectedCat  = '';
  selectedSub  = '';
  selectedMode = 'CC';
  selectedType = 'Need';
  document.getElementById('modal-title').textContent = 'Add Expense';
  document.getElementById('modal-sub').textContent   = 'FILL IN THE DETAILS BELOW';
  document.getElementById('save-btn').textContent    = 'Save Expense';
  document.getElementById('f-id').value     = '';
  document.getElementById('f-amount').value = '';
  document.getElementById('f-date').value   = formatDate(new Date());
  document.getElementById('f-desc').value   = '';
  document.getElementById('f-notes').value  = '';
  document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('selected'));
  document.querySelectorAll('.sub-pill').forEach(p => p.classList.remove('selected'));
  document.querySelectorAll('.mode-pill').forEach(p => p.classList.toggle('selected', p.textContent.includes('Credit Card')));
  document.querySelectorAll('.type-pill').forEach(p => p.classList.toggle('selected', p.textContent.includes('Need')));
  toggleSubGroup();
  document.getElementById('expense-modal').classList.add('open');
}

async function openEditModal(id) {
  editingId = id;
  try {
    const token = getCookie('access_token');
    const response = await apiFetch(`${API_BASE_URL}/expenses/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });

    if (response.ok) {
      const e = await response.json();
      // DB holds either a main category or a sub-category name
      if (isMain(e.category)) { selectedCat = e.category; selectedSub = ''; }
      else { selectedCat = 'Others'; selectedSub = subMeta[e.category] ? e.category : ''; }
      selectedMode = e.mode;
      selectedType = e.etype;
      document.getElementById('modal-title').textContent = 'Edit Expense';
      document.getElementById('modal-sub').textContent   = 'UPDATE THE DETAILS BELOW';
      document.getElementById('save-btn').textContent    = 'Update Expense';
      document.getElementById('f-amount').value = e.amount;
      document.getElementById('f-date').value   = e.date;
      document.getElementById('f-desc').value   = e.description;
      document.getElementById('f-id').value     = e.id;
      document.getElementById('f-notes').value  = e.notes || '';
      document.querySelectorAll('.cat-pill').forEach(p => p.classList.toggle('selected', p.dataset.cat === selectedCat));
      document.querySelectorAll('.sub-pill').forEach(p => p.classList.toggle('selected', p.dataset.sub === selectedSub));
      const modeLabel = e.mode == "CC" ? "Credit Card" : e.mode;
      document.querySelectorAll('.mode-pill').forEach(p => p.classList.toggle('selected', p.textContent.includes(modeLabel)));
      document.querySelectorAll('.type-pill').forEach(p => p.classList.toggle('selected', p.textContent.includes(e.etype)));
      toggleSubGroup();
      document.getElementById('expense-modal').classList.add('open');
    } else {
      if (response.status == 401) window.location.href = '/login.html';
      const errorData = await response.json();
      alert(`Error: ${errorData.detail}`);
    }
  } catch (error) {
    console.error('Error:', error);
    showToast('An error occurred. Please try again.', 'error');
  }
}

// "Others (all)" has no DB value, so load every page for the range, keep non-main rows,
// and paginate on the client.
let othersCache = null;
async function getOthersExpenses(start_date, end_date, page = 1, per_page = 15) {
  try {
    if (page === 1 || !othersCache) {
      const token = getCookie('access_token');
      let all = [], p = 1, more = true;
      while (more && p <= 50) {
        const response = await apiFetch(`${API_BASE_URL}/expenses/expenses?category=&start_date=${start_date}&end_date=${end_date}&page=${p}&per_page=100`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) {
          if (response.status == 401) window.location.href = '/login.html';
          const errorData = await response.json();
          alert(`Error: ${errorData.detail}`);
          return;
        }
        const e = await response.json();
        all = all.concat(e.expenses || []);
        more = e.has_next;
        p++;
      }
      othersCache = all.filter(x => isOthers(x.category));
    }
    const total = othersCache.length;
    const totalPages = Math.max(1, Math.ceil(total / per_page));
    const slice = othersCache.slice((page - 1) * per_page, page * per_page);
    let btns = '';
    if (page > 1)          btns += `<a class="page-btn" onclick="getOthersExpenses('${start_date}','${end_date}',${page - 1},${per_page})">Previous</a>`;
    if (page < totalPages) btns += `<a class="page-btn" onclick="getOthersExpenses('${start_date}','${end_date}',${page + 1},${per_page})">Next</a>`;
    document.getElementById('page-btns').innerHTML = btns;
    document.getElementById('page-info').innerHTML = 'Page ' + page + ' of ' + totalPages;
    document.getElementById('table-heading').innerHTML = 'Showing ' + slice.length + ' of ' + total + ' expenses';
    renderTable(slice);
  } catch (error) {
    console.error('Error:', error);
    alert('An error occurred. Please try again.');
  }
}

async function getExpenseDetails(cat = "", start_date = "", end_date = "", page = 1, per_page = 15) {
  if (cat === OTHERS_ALL) return getOthersExpenses(start_date, end_date, page, per_page);
  try {
    const token = getCookie('access_token');
    const response = await apiFetch(`${API_BASE_URL}/expenses/expenses?category=${encodeURIComponent(cat)}&start_date=${start_date}&end_date=${end_date}&page=${page}&per_page=${per_page}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });

    if (response.ok) {
      const e = await response.json();
      let pagebtnhtml = '';
      const c = encodeURIComponent(cat);
      if (e.has_prev)
        pagebtnhtml += `<a class="page-btn" onclick="getExpenseDetails(decodeURIComponent('${c}'),'${start_date}','${end_date}',${e.page - 1},${e.per_page})">Previous</a>`;
      if (e.has_next)
        pagebtnhtml += `<a class="page-btn" onclick="getExpenseDetails(decodeURIComponent('${c}'),'${start_date}','${end_date}',${e.page + 1},${e.per_page})">Next</a>`;
      document.getElementById('page-btns').innerHTML = pagebtnhtml;
      document.getElementById('page-info').innerHTML = 'Page ' + e.page + ' of ' + e.total_pages;
      document.getElementById('table-heading').innerHTML = 'Showing ' + (e.expenses ? e.expenses.length : 0) + ' of ' + e.total + ' expenses';
      renderTable(e.expenses);
    } else {
      if (response.status == 401) window.location.href = '/login.html';
      const errorData = await response.json();
      alert(`Error: ${errorData.detail}`);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('An error occurred. Please try again.');
  }
}
getExpenseDetails("", formatDate(firstDate), formatDate(lastDate));

function closeModal() {
  document.getElementById('expense-modal').classList.remove('open');
}
function selectCat(el, c) {
  selectedCat = c;
  document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('selected'));
  el.classList.add('selected');
  if (c !== 'Others') {
    selectedSub = '';
    document.querySelectorAll('.sub-pill').forEach(p => p.classList.remove('selected'));
  }
  toggleSubGroup();
}
function selectSub(el, s) {
  selectedSub = s;
  document.querySelectorAll('.sub-pill').forEach(p => p.classList.remove('selected'));
  el.classList.add('selected');
}
function selectMode(el, mode) {
  selectedMode = mode;
  document.querySelectorAll('.mode-pill').forEach(p => p.classList.remove('selected'));
  el.classList.add('selected');
}
function selectType(el, etype) {
  selectedType = etype;
  document.querySelectorAll('.type-pill').forEach(p => p.classList.remove('selected'));
  el.classList.add('selected');
}

async function saveExpense() {
  const amount = parseFloat(document.getElementById('f-amount').value);
  const date   = document.getElementById('f-date').value;
  const desc   = document.getElementById('f-desc').value.trim();
  const notes  = document.getElementById('f-notes').value.trim();
  if (!amount || amount <= 0) { showToast('Enter a valid amount', 'error'); return; }
  if (!date)        { showToast('Pick a date', 'error'); return; }
  if (!desc)        { showToast('Add a description', 'error'); return; }
  if (!selectedCat) { showToast('Select a category', 'error'); return; }
  if (selectedCat === 'Others' && !selectedSub) { showToast('Select a sub-category for Others', 'error'); return; }

  const payload = {
    // main category name, or the sub-category name directly for Others
    category: selectedCat === 'Others' ? selectedSub : selectedCat,
    mode: selectedMode,
    etype: selectedType,
    description: desc,
    amount: amount,
    date: date,
    notes: notes
  };

  try {
    const token = getCookie('access_token');
    const isEdit = !!editingId;
    const url = isEdit ? `${API_BASE_URL}/expenses/${editingId}` : `${API_BASE_URL}/expenses/`;
    const response = await apiFetch(url, {
      method: isEdit ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    if (response.ok) {
      showToast(isEdit ? 'Expense updated ✓' : 'Expense Added ✓', 'success');
      getFilterData();
      getExpenseDetails(cat, from, to);
      loadSpendChart();
      getSummary();
    } else {
      if (response.status == 401) window.location.href = '/login.html';
      showToast('Some error', 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    showToast('An error occurred. Please try again.', 'error');
  }
  closeModal();
}

// ── Modal: Delete ─────────────────────────────────────────────
function openDeleteModal(id, descEncoded) {
  deletingId = id;
  const desc = decodeURIComponent(descEncoded);
  document.getElementById('del-desc-text').textContent = `"${desc}" will be permanently deleted.`;
  document.getElementById('delete-modal').classList.add('open');
}
function closeDeleteModal() {
  document.getElementById('delete-modal').classList.remove('open');
}
async function confirmDelete() {
  try {
    const token = getCookie('access_token');
    const response = await apiFetch(`${API_BASE_URL}/expenses/${deletingId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (response.ok) {
      showToast('Expense deleted', 'success');
      getFilterData();
      getExpenseDetails(cat, from, to);
      loadSpendChart();
      getSummary();
    } else {
      if (response.status == 401) window.location.href = '/login.html';
      showToast('An error occurred. Please try again.', 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    showToast('An error occurred. Please try again.', 'error');
  }
  closeDeleteModal();
}

// ── Toast ─────────────────────────────────────────────────────
let toastTimer;
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  document.getElementById('toast-icon').textContent = type === 'success' ? '✓' : '✕';
  t.className = `toast ${type} show`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

// Close modals on overlay click
document.getElementById('expense-modal').addEventListener('click', function (e) {
  if (e.target === this) closeModal();
});
document.getElementById('delete-modal').addEventListener('click', function (e) {
  if (e.target === this) closeDeleteModal();
});

function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const c = cookies[i].trim();
      if (c.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(c.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

async function logout() {
  try {
    const response = await apiFetch(`${API_BASE_URL}/expenses/logout`, { method: 'POST' });
    if (response.ok) {
      window.location.href = '/login.html';
    } else {
      const errorData = await response.json();
      alert(`Error: ${errorData.detail}`);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('An error occurred. Please try again.');
  }
}

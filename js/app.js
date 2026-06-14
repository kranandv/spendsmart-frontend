const API_BASE_URL = "https://spendsmart-backend-ce6i.onrender.com";
const catMeta = {
  Food:          { emoji:'🍔', color:'#FF7A45', bg:'rgba(255,122,69,.15)'  },
  Transport:     { emoji:'🚗', color:'#45B4FF', bg:'rgba(69,180,255,.15)'  },
  Shopping:      { emoji:'🛍️', color:'#8B7FFF', bg:'rgba(139,127,255,.15)' },
  Bills:         { emoji:'💡', color:'#FFD166', bg:'rgba(255,209,102,.15)' },
  Health:        { emoji:'🏥', color:'#00E5A0', bg:'rgba(0,229,160,.15)'   },
  Entertainment: { emoji:'🎬', color:'#FF4D6A', bg:'rgba(255,77,106,.15)'  },
  Education:     { emoji:'📚', color:'#A8EDEA', bg:'rgba(168,237,234,.15)' },
  Other:         { emoji:'📦', color:'#6B7280', bg:'rgba(107,114,128,.15)' },
};
let nextId      = 8;
let editingId   = null;
let deletingId  = null;
let selectedCat = '';
let selectedMode= '';
let selectedType= '';
let cat   = null;
let from  = null;
let to    = null;

// ── Render table ─────────────────────────────────────────────
function renderTable(data) {
  const tbody = document.getElementById('expense-tbody');
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state"><div class="emoji">💸</div>No expenses found. Add your first one!</div></td></tr>`;
    return;
  }
  tbody.innerHTML = data.map(e => {
    const m = catMeta[e.category] || catMeta.Other;
    const d = new Date(e.date);
    const dateStr = d.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});
    return `
    <tr>
      <td class="td-date">${dateStr}</td>
      <td class="td-desc">
        ${e.description}
        ${e.notes ? `<small>${e.notes}</small>` : ''}
      </td>
      <td>
        <span class="cat-badge" style="background:${m.bg};color:${m.color}">
          ${m.emoji} ${e.category}
        </span>
      </td>
      <td class="td-amt" style="color:var(--green)">₹${e.amount.toLocaleString('en-IN')}</td>
      <td>
        <div class="td-actions">
          <button class="icon-btn edit"   onclick="openEditModal(${e.id})" title="Edit">✏️</button>
          <button class="icon-btn delete" onclick="openDeleteModal(${e.id},'${e.description}')" title="Delete">🗑️</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}
//renderTable(expenses);
ctx = document.getElementById('spendChart').getContext('2d');
let spendChart;
async function loadSpendChart() {
    try {
        const token = getCookie('access_token');
        // console.log(token)
        // if (!token) {
        //     throw new Error('Authentication token not found');
        // }
        getFilterData();
        const response = await fetch(`${API_BASE_URL}/expenses/chart-data?category=${cat}&start_date=${from}&end_date=${to}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            credentials: 'include',
        });

        if (response.ok) {
        const result = await response.json();
        const summary = result.chart_data || [];


        generateCharts(summary);
        generateCategoryBars(summary);

        } else {
            // Handle error
            const errorData = await response.json();
            alert(`Error: ${errorData.detail}`);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred. Please try again.');
    }
}
function generateCharts(summary)
{
    // Extract labels and data
        const labels = summary.map(item => item.category);
        const data = summary.map(item => item.total);
        const colors = [
            'rgba(255,122,69,.85)', 'rgba(69,180,255,.85)', 'rgba(139,127,255,.85)',
            'rgba(255,209,102,.85)', 'rgba(0,229,160,.85)', 'rgba(255,77,106,.85)',
            'rgba(168,237,234,.85)'
        ];
        if (spendChart) {
            spendChart.destroy();
        }

        spendChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Spent (₹)',
                    data: data,
                    backgroundColor: colors,
                    borderColor: 'transparent',
                    borderRadius: 8,
                    borderSkipped: false,
                }]
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
                            label: c => `  ₹${c.raw.toLocaleString('en-IN')}`
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: '#1E2030' },
                        ticks: { color: '#6B7280', font: { family: 'DM Mono', size: 10 } },
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
function generateCategoryBars(summary)
{
    if (summary.length === 0) {
            document.getElementById('categoryBars').innerHTML = '<p>No expenses found.</p>';
            return;
    }
    const maxAmount = Math.max(...summary.map(item => item.total));
    const sumAmount = summary.length ? summary.reduce((sum, item) => sum + item.total, 0) : 0;
    let html = '';
    summary.forEach(item => {
        const percentage = maxAmount > 0 ? Math.round((item.total / maxAmount) * 100) : 0;
        const emoji = getCategoryEmoji(item.category);
        const color = getCategoryColor(item.category);

        html += `
            <div class="cat-row">
                <div class="cat-info">
                    <span class="cat-name">${emoji} ${item.category}</span>
                    <span class="cat-amt">₹${item.total.toLocaleString('en-IN')}</span>
                </div>
                <div class="bar-track">
                    <div class="bar-fill"
                         style="width: ${percentage}%; background: ${color}">
                    </div>
                </div>
            </div>
        `;
    });
    document.getElementById('catTotal').innerHTML = sumAmount+' Total';
    document.getElementById('categoryBars').innerHTML = html;
}
document.addEventListener('DOMContentLoaded', loadSpendChart);
function getCategoryEmoji(category) {
    const emojis = {
        'Food': '🍔',
        'Transport': '🚗',
        'Shopping': '🛍️',
        'Bills': '💡',
        'Health': '🏥',
        'Entertainment': '🎬',
        'Education': '📚',
        // Add more categories
    };
    return emojis[category] || '📌';
}

function getCategoryColor(category) {
    const colors = {
        'Food': 'var(--orange)',
        'Transport': 'var(--blue)',
        'Shopping': 'var(--purple)',
        'Bills': 'var(--yellow)',
        'Health': 'var(--green)',
        'Entertainment': 'var(--red)',
        'Education': '#A8EDEA',
    };
    return colors[category] || 'var(--primary)';
}
async function getSummary()
{
    try {
        const token = getCookie('access_token');
        // console.log(token)
        // if (!token) {
        //     throw new Error('Authentication token not found');
        // }
        const response = await fetch(`${API_BASE_URL}/expenses/summary`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            credentials: 'include',
        });

        if (response.ok) {
        console.log(response);
        const e = await response.json();
        card1='<div class="trend down">▼ '+e.incr_percentage+'%</div>';
        if(e.incr_percentage>0)
            card1='<div class="trend up">▲ '+e.incr_percentage+'%</div>';
        card1+='<div class="icon">💰</div>'+
          '<div class="label">Total This Month</div>'+
          '<div class="value" id="card-total">₹'+e.this_month_total+'</div>'+
          '<div class="sub">vs ₹'+e.last_month_total+' last month</div>';
        card2='<div class="icon">🔥</div>'+
          '<div class="label">Highest Category</div>'+
          '<div class="value" id="card-top-cat">'+e.highest_category+'</div>'+
          '<div class="sub" id="card-top-amt">₹'+e.highest_amount+' spent · '+e.highest_percentage+'%</div>';
        card3='<div class="trend down">▼ '+e.count_change+'</div>';
        if(e.count_change>0)
            card3='<div class="trend up">▲ '+e.count_change+'</div>';
        card3+='<div class="icon">📋</div>'+
          '<div class="label">Total Expenses</div>'+
          '<div class="value" id="card-count">'+e.this_month_count+'</div>'+
          '<div class="sub">transactions this month</div>';
        document.getElementById('card1').innerHTML=card1;
        document.getElementById('card2').innerHTML=card2;
        document.getElementById('card3').innerHTML=card3;
        document.getElementById('card-avg').innerHTML='₹'+e.month_avg;
        } else {
            // Handle error
            console.log(response);
            const errorData = await response.json();
            alert(`Error: ${errorData.detail}`);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred. Please try again.');
    }
}
getSummary();
// ── Chart ─────────────────────────────────────────────────────
//const ctx = document.getElementById('spendChart').getContext('2d');
//const chart = new Chart(ctx, {
//  type: 'bar',
//  data: {
//    labels: ['Food','Transport','Shopping','Bills','Health','Entertain.','Education'],
//    datasets:[{
//      label:'Spent (₹)',
//      data:[5200,3800,3100,2750,1900,1100,600],
//      backgroundColor:['rgba(255,122,69,.85)','rgba(69,180,255,.85)','rgba(139,127,255,.85)',
//        'rgba(255,209,102,.85)','rgba(0,229,160,.85)','rgba(255,77,106,.85)','rgba(168,237,234,.85)'],
//      borderColor:'transparent', borderRadius:8, borderSkipped:false,
//    }]
//  },
//  options:{
//    responsive:true,
//    plugins:{
//      legend:{display:false},
//      tooltip:{
//        backgroundColor:'#12141E', borderColor:'#1E2030', borderWidth:1,
//        titleColor:'#E8E6F0', bodyColor:'#6B7280',
//        titleFont:{family:'Syne',weight:'700',size:12},
//        bodyFont:{family:'DM Mono',size:11},
//        callbacks:{ label: c=>`  ₹${c.raw.toLocaleString('en-IN')}` }
//      }
//    },
//    scales:{
//      x:{ grid:{color:'#1E2030'}, ticks:{color:'#6B7280',font:{family:'DM Mono',size:10}}, border:{color:'#1E2030'} },
//      y:{ grid:{color:'#1E2030'}, ticks:{color:'#6B7280',font:{family:'DM Mono',size:10}, callback:v=>'₹'+(v/1000).toFixed(0)+'K'}, border:{color:'#1E2030'} }
//    }
//  }
//});

// ── Filter ────────────────────────────────────────────────────

function getFilterData()
{
   cat   = document.getElementById('filter-cat').value;
   from  = document.getElementById('filter-from').value;
   to    = document.getElementById('filter-to').value;
}
function applyFilter() {
    getFilterData();
    getExpenseDetails(cat,from,to);
    loadSpendChart();
  renderChips(cat, from, to);
  document.getElementById('table-heading').textContent = `Showing ${filtered.length} of ${expenses.length} expenses`;
}
function resetFilter() {
  document.getElementById('filter-cat').value  = '';
  document.getElementById('filter-from').value = '2026-06-01';
  document.getElementById('filter-to').value   = '2026-06-30';
  renderTable(expenses);
  document.getElementById('active-chips').style.display = 'none';
  document.getElementById('table-heading').textContent = `Showing ${expenses.length} of ${expenses.length} expenses`;
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
  document.getElementById('modal-title').textContent = 'Add Expense';
  document.getElementById('modal-sub').textContent   = 'FILL IN THE DETAILS BELOW';
  document.getElementById('save-btn').textContent    = 'Save Expense';
  document.getElementById('f-amount').value = '';
  document.getElementById('f-date').value   = new Date().toISOString().split('T')[0];
  document.getElementById('f-desc').value   = '';
  document.getElementById('f-notes').value  = '';
  document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('selected'));
  document.getElementById('expense-modal').classList.add('open');
}
async function openEditModal(id) {
    editingId=id;
  expenseId = id;

    try {
        const token = getCookie('access_token');
        console.log(token)
//        if (!token) {
//            throw new Error('Authentication token not found');
//        }

        console.log(`${expenseId}`)

        const response = await fetch(`${API_BASE_URL}/expenses/${expenseId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            credentials: 'include',
        });

        if (response.ok) {
        if(response.redirected)
            window.location.href=response.url;
        const e = await response.json();
          document.getElementById('modal-title').textContent = 'Edit Expense';
          document.getElementById('modal-sub').textContent   = 'UPDATE THE DETAILS BELOW';
          document.getElementById('save-btn').textContent    = 'Update Expense';
          document.getElementById('f-amount').value = e.amount;
          document.getElementById('f-date').value   = e.date;
          document.getElementById('f-desc').value   = e.description;
          document.getElementById('f-id').value   = e.id;
          //document.getElementById('f-notes').value  = e.notes;
          selectedCat = e.category;
          document.querySelectorAll('.cat-pill').forEach(p => {
            p.classList.toggle('selected', p.textContent.includes(e.category));
          });
          document.getElementById('expense-modal').classList.add('open');
        } else {
            // Handle error
            const errorData = await response.json();
            alert(`Error: ${errorData.detail}`);
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('An error occurred. Please try again.','error');
    }
}

async function getExpenseDetails(cat="",start_date="",end_date="",page=1,per_page=5) {
    try {
        const token = getCookie('access_token');
        // console.log(token)
        // if (!token) {
        //     throw new Error('Authentication token not found');
        // }

        const response = await fetch(`${API_BASE_URL}/expenses/expenses?category=${cat}&start_date=${start_date}&end_date=${end_date}&page=${page}&per_page=${per_page}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            credentials: 'include',
        });

        if (response.ok) {
        const e = await response.json();
        pagebtnhtml='';
        getFilterData();
        if(e.has_prev)
            pagebtnhtml+='<a class="page-btn" onclick="getExpenseDetails(\''+cat+'\',\''+from+'\',\''+to+'\','+(e.page-1)+','+e.per_page+')">Previous</a>';
        if(e.has_next)
            pagebtnhtml+='<a class="page-btn" onclick="getExpenseDetails(\''+cat+'\',\''+from+'\',\''+to+'\','+(e.page+1)+','+e.per_page+')">Next</a>';
        document.getElementById('page-btns').innerHTML=pagebtnhtml;
        document.getElementById('page-info').innerHTML='Page '+e.page+' of '+e.total_pages;
        document.getElementById('table-heading').innerHTML='Showing '+(e.total>e.per_page? e.per_page: e.total)+' of '+e.total+' expenses';
        renderTable(e.expenses);
        } else {
            // Handle error
            const errorData = await response.json();
            alert(`Error: ${errorData.detail}`);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred. Please try again.');
    }
}
const now = new Date();
const year = now.getFullYear();
const month = now.getMonth(); // 0-indexed (January is 0)

// 1. Get the first and last Date objects
const firstDay = new Date(year, month, 1);
const lastDay = new Date(year, month + 1, 0); // Day 0 rolls back to the last day of the previous month

// 2. Format a Date object into YYYY-MM-DD manually to respect local timezone
const formatDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};
getExpenseDetails("",formatDate(firstDay),formatDate(lastDay));
function closeModal() {
  document.getElementById('expense-modal').classList.remove('open');
}
function selectCat(el, cat) {
  selectedCat = cat;
  document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('selected'));
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
  const expenseId = parseInt(document.getElementById('f-id').value);
  const amount = parseFloat(document.getElementById('f-amount').value);
  const date   = document.getElementById('f-date').value;
  const desc   = document.getElementById('f-desc').value.trim();
  const notes  = document.getElementById('f-notes').value.trim();
  if (!amount || amount <= 0) { showToast('Enter a valid amount','error'); return; }
  if (!date)       { showToast('Pick a date','error'); return; }
  if (!desc)       { showToast('Add a description','error'); return; }
  if (!selectedCat){ showToast('Select a category','error'); return; }

    const payload = {
        category: selectedCat,
        mode: selectedMode,
        etype: selectedType,
        description: desc,
        amount: parseFloat(amount),
        date: date,
        notes:notes
    };

    try {
        const token = getCookie('access_token');
        //console.log(token)
        // if (!token) {
        //     //throw new Error('Authentication token not found');
        //     showToast('Authentication token not found','error');

        // }
        //console.log(`${expenseId}`)
        if(editingId)
        {
            const response = await fetch(`${API_BASE_URL}/expenses/${expenseId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include',
                body: JSON.stringify(payload)
            });
            if (response.ok) {
                showToast('Expense updated ✓','success');
                getFilterData();
                getExpenseDetails(cat,from,to);
            } else {
                const errorData = await response.json();
                //alert(`Error: ${errorData.detail}`);
                showToast('Some error','error');
            }
        }
        else
        {
            const response = await fetch(`${API_BASE_URL}/expenses/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include',
                body: JSON.stringify(payload)
            });
            if (response.ok) {
                showToast('Expense Added ✓','success');
                getFilterData();
                getExpenseDetails(cat,from,to);
            } else {
                const errorData = await response.json();
                //alert(`Error: ${errorData.detail}`);
                showToast('Some error','error');
            }
        }


    } catch (error) {
        console.error('Error:', error);
        showToast('An error occurred. Please try again.','error');
    }

  closeModal();
  //renderTable(expenses);
  //document.getElementById('table-heading').textContent = `Showing ${expenses.length} of ${expenses.length} expenses`;
}

// ── Modal: Delete ─────────────────────────────────────────────
function openDeleteModal(id, desc) {
  deletingId = id;
  document.getElementById('del-desc-text').textContent = `"${desc}" will be permanently deleted.`;
  document.getElementById('delete-modal').classList.add('open');
}
function closeDeleteModal() {
  document.getElementById('delete-modal').classList.remove('open');
}
async function confirmDelete() {
  try {
    const token = getCookie('access_token');
    // if (!token) {
    //     throw new Error('Authentication token not found');
    // }
    const response = await fetch(`${API_BASE_URL}/expenses/${deletingId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
    });
    if (response.ok) {
        showToast('Expense deleted','success');
        getFilterData();
        getExpenseDetails(cat,from,to);
    } else {
        // Handle error
        const errorData = await response.json();
        alert(`Error: ${errorData.detail}`);
        showToast('An error occurred. Please try again.','error');
    }
} catch (error) {
    console.error('Error:', error);
    showToast('An error occurred. Please try again.','error');
}
  closeDeleteModal();
}

// ── Pagination (UI only) ──────────────────────────────────────
function prevPage() { showToast('Previous page — connect to API','error'); }
function nextPage() { showToast('Next page — connect to API','error'); }

// ── Toast ─────────────────────────────────────────────────────
let toastTimer;
function showToast(msg, type='success') {
  const t = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  document.getElementById('toast-icon').textContent = type === 'success' ? '✓' : '✕';
  t.className = `toast ${type} show`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

// Close modals on overlay click
document.getElementById('expense-modal').addEventListener('click', function(e){
  if (e.target === this) closeModal();
});
document.getElementById('delete-modal').addEventListener('click', function(e){
  if (e.target === this) closeDeleteModal();
});
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
};
function logout() {
    // Get all cookies
    const cookies = document.cookie.split(";");

    // Iterate through all cookies and delete each one
    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        // Set the cookie's expiry date to a past date to delete it
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    }

    // Redirect to the login page
    window.location.href = '/login.html';
    };

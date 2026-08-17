import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://fdhzdsqqtlaxjnuvohzs.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ZtPoum30151tCVKD7pOPpg_PK1SBOmt';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const STATUSES = ['new', 'contacted', 'follow-up', 'interested', 'closed'];
const STATUS_LABELS = { 'new': 'New', 'contacted': 'Contacted', 'follow-up': 'Follow-up', 'interested': 'Interested', 'closed': 'Closed' };

// Auth guard
const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  window.location.href = 'login.html';
}
const displayName = session.user.user_metadata?.name || session.user.email;
document.getElementById('userEmail').textContent = displayName;
document.getElementById('userAvatar').textContent = displayName.charAt(0).toUpperCase();

document.getElementById('signOutBtn').addEventListener('click', async () => {
  await supabase.auth.signOut();
  window.location.href = 'login.html';
});

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

async function loadStats() {
  const { data: leads, error: leadsError } = await supabase.from('leads').select('*');
  const { data: activities, error: actError } = await supabase
    .from('activities')
    .select('*, leads(name)')
    .order('created_at', { ascending: false })
    .limit(8);

  if (leadsError) {
    console.error(leadsError);
    return;
  }

  const total = leads.length;
  const closed = leads.filter(l => l.status === 'closed').length;
  const conversionRate = total > 0 ? Math.round((closed / total) * 100) : 0;
  const activeCount = leads.filter(l => l.status !== 'closed').length;

  // Summary cards
  const summaryRow = document.getElementById('summaryRow');
  summaryRow.innerHTML = `
    <div class="summary-card">
      <div class="summary-value">${total}</div>
      <div class="summary-label">Total leads</div>
    </div>
    <div class="summary-card">
      <div class="summary-value">${activeCount}</div>
      <div class="summary-label">Active</div>
    </div>
    <div class="summary-card">
      <div class="summary-value">${closed}</div>
      <div class="summary-label">Closed</div>
    </div>
    <div class="summary-card">
      <div class="summary-value">${conversionRate}%</div>
      <div class="summary-label">Conversion rate</div>
    </div>
  `;

  // By stage bars
  const stageBars = document.getElementById('stageBars');
  if (total === 0) {
    stageBars.innerHTML = '<div class="empty-state">Add leads to see this breakdown.</div>';
  } else {
    stageBars.innerHTML = STATUSES.map(status => {
      const count = leads.filter(l => l.status === status).length;
      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
      return `
        <div class="bar-row">
          <div class="bar-row-head"><span>${STATUS_LABELS[status]}</span><span>${count}</span></div>
          <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
        </div>
      `;
    }).join('');
  }

  // By source bars
  const sourceBars = document.getElementById('sourceBars');
  const sourceCounts = {};
  leads.forEach(l => {
    const src = l.source && l.source.trim() ? l.source.trim() : 'Unknown';
    sourceCounts[src] = (sourceCounts[src] || 0) + 1;
  });
  const sourceEntries = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1]);

  if (sourceEntries.length === 0) {
    sourceBars.innerHTML = '<div class="empty-state">Add leads to see this breakdown.</div>';
  } else {
    sourceBars.innerHTML = sourceEntries.map(([source, count]) => {
      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
      return `
        <div class="bar-row">
          <div class="bar-row-head"><span>${escapeHtml(source)}</span><span>${count}</span></div>
          <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
        </div>
      `;
    }).join('');
  }

  // Recent activity
  const recentList = document.getElementById('recentList');
  if (actError || !activities || activities.length === 0) {
    recentList.innerHTML = '<div class="empty-state">No activity logged yet.</div>';
  } else {
    recentList.innerHTML = activities.map(a => `
      <div class="recent-item">
        <span class="recent-lead">${escapeHtml(a.leads ? a.leads.name : 'Unknown')}</span>
        <span class="recent-desc">${escapeHtml(a.description)}</span>
        <span class="recent-time">${timeAgo(a.created_at)}</span>
      </div>
    `).join('');
  }
}

// Sweep-fill hover for ghost buttons
document.querySelectorAll('.btn-ghost').forEach(btn => {
  const fill = btn.querySelector('.btn-fill');
  const label = btn.querySelector('.btn-label');
  const baseColor = getComputedStyle(label).color;
  const EASE = 'transform 0.45s cubic-bezier(0.65,0,0.35,1)';

  btn.addEventListener('mouseenter', () => {
    fill.style.transition = EASE;
    fill.style.transform = 'translateX(0%)';
    label.style.color = '#161616';
  });
  btn.addEventListener('mouseleave', () => {
    fill.style.transition = EASE;
    fill.style.transform = 'translateX(100%)';
    label.style.color = baseColor;
  });
  fill.addEventListener('transitionend', (e) => {
    if (e.propertyName !== 'transform') return;
    if (!btn.matches(':hover')) {
      fill.style.transition = 'none';
      fill.style.transform = 'translateX(-100%)';
      void fill.offsetWidth;
    }
  });
});

loadStats();
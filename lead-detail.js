import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://fdhzdsqqtlaxjnuvohzs.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ZtPoum30151tCVKD7pOPpg_PK1SBOmt';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const params = new URLSearchParams(window.location.search);
const leadId = params.get('id');

if (!leadId) {
  window.location.href = 'dashboard.html';
}

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

// Load lead
async function loadLead() {
  const { data: lead, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single();

  if (error || !lead) {
    document.getElementById('leadNameDisplay').textContent = 'Lead not found';
    return;
  }

  document.getElementById('leadNameDisplay').textContent = lead.name;
  document.getElementById('leadName').value = lead.name || '';
  document.getElementById('leadCompany').value = lead.company || '';
  document.getElementById('leadEmail').value = lead.email || '';
  document.getElementById('leadPhone').value = lead.phone || '';
  document.getElementById('leadSource').value = lead.source || '';
  document.getElementById('leadNotes').value = lead.notes || '';
  document.getElementById('statusSelect').value = lead.status || 'new';
}

// Save lead edits
document.getElementById('leadForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = document.getElementById('formMsg');
  const name = document.getElementById('leadName').value.trim();

  if (!name) {
    msg.className = 'form-msg error';
    msg.textContent = 'Name is required.';
    return;
  }

  msg.className = 'form-msg';
  msg.textContent = 'Saving…';

  const { error } = await supabase.from('leads').update({
    name,
    company: document.getElementById('leadCompany').value.trim(),
    email: document.getElementById('leadEmail').value.trim(),
    phone: document.getElementById('leadPhone').value.trim(),
    source: document.getElementById('leadSource').value.trim(),
    notes: document.getElementById('leadNotes').value.trim(),
    status: document.getElementById('statusSelect').value
  }).eq('id', leadId);

  if (error) {
    msg.className = 'form-msg error';
    msg.textContent = error.message;
    return;
  }

  msg.className = 'form-msg success';
  msg.textContent = 'Saved.';
  document.getElementById('leadNameDisplay').textContent = name;
});

// Status dropdown updates instantly too, without needing full form save
document.getElementById('statusSelect').addEventListener('change', async () => {
  const newStatus = document.getElementById('statusSelect').value;
  const msg = document.getElementById('formMsg');
  msg.className = 'form-msg';
  msg.textContent = 'Updating status…';

  const { error } = await supabase.from('leads')
    .update({ status: newStatus })
    .eq('id', leadId);

  if (error) {
    msg.className = 'form-msg error';
    msg.textContent = error.message;
  } else {
    msg.className = 'form-msg success';
    msg.textContent = `Status changed to "${newStatus}". This lead will show in that column on the pipeline.`;
  }
});

// Delete lead
document.getElementById('deleteLeadBtn').addEventListener('click', async () => {
  if (!confirm('Delete this lead? This also removes its activity log. This can\'t be undone.')) return;
  const { error } = await supabase.from('leads').delete().eq('id', leadId);
  if (error) {
    alert(error.message);
    return;
  }
  window.location.href = 'dashboard.html';
});

// Load + render activities
async function loadActivities() {
  const { data: activities, error } = await supabase
    .from('activities')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });

  const list = document.getElementById('activityList');
  list.innerHTML = '';

  if (error) {
    list.innerHTML = '<div class="empty-state">Couldn\'t load activity log.</div>';
    return;
  }

  if (!activities || activities.length === 0) {
    list.innerHTML = '<div class="empty-state">No activity logged yet.</div>';
    return;
  }

  activities.forEach(a => {
    const item = document.createElement('div');
    item.className = 'activity-item';
    const time = new Date(a.created_at).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
    });
    item.innerHTML = `
      <div class="activity-item-head">
        <span class="activity-type">${escapeHtml(a.activity_type)}</span>
        <span class="activity-time">${time}</span>
      </div>
      <div class="activity-desc">${escapeHtml(a.description)}</div>
    `;
    list.appendChild(item);
  });
}

// Log new activity
document.getElementById('activityForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const type = document.getElementById('activityType').value;
  const desc = document.getElementById('activityDesc').value.trim();

  if (!desc) return;

  const { error } = await supabase.from('activities').insert({
    lead_id: leadId,
    activity_type: type,
    description: desc
  });

  if (error) {
    alert(error.message);
    return;
  }

  document.getElementById('activityDesc').value = '';
  loadActivities();
});

// Sweep-fill hover, matches login.js / dashboard.js behavior
function wireSweepButton(btn, textColorOnFill) {
  const fill = btn.querySelector('.btn-fill');
  const label = btn.querySelector('.btn-label');
  const baseColor = getComputedStyle(label).color;
  const EASE = 'transform 0.45s cubic-bezier(0.65,0,0.35,1)';

  btn.addEventListener('mouseenter', () => {
    fill.style.transition = EASE;
    fill.style.transform = 'translateX(0%)';
    label.style.color = textColorOnFill;
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
}

document.querySelectorAll('.btn-primary').forEach(b => wireSweepButton(b, '#F2F1ED'));
document.querySelectorAll('.btn-ghost').forEach(b => wireSweepButton(b, '#161616'));
document.querySelectorAll('.btn-danger').forEach(b => wireSweepButton(b, '#F2F1ED'));

loadLead();
loadActivities();
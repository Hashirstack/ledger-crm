import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://fdhzdsqqtlaxjnuvohzs.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ZtPoum30151tCVKD7pOPpg_PK1SBOmt';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const STATUSES = ['new', 'contacted', 'follow-up', 'interested', 'closed'];

// Auth guard: bounce to login if no session.
// If arriving fresh from a Google OAuth redirect, give Supabase a moment
// to finish processing the login token in the URL before deciding.
async function getSessionWithGrace() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) return session;

  const hasOAuthParams = window.location.hash.includes('access_token') || window.location.search.includes('code=');
  if (!hasOAuthParams) return null;

  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(null), 2000);
    const { data: listener } = supabase.auth.onAuthStateChange((event, sess) => {
      if (sess) {
        clearTimeout(timeout);
        listener.subscription.unsubscribe();
        resolve(sess);
      }
    });
  });
}

const session = await getSessionWithGrace();
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

// Keep dashboard in sync if session expires elsewhere
supabase.auth.onAuthStateChange((_event, sess) => {
  if (!sess) window.location.href = 'login.html';
});

async function loadLeads() {
  const { data: leads, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  STATUSES.forEach(status => {
    const container = document.getElementById(`cards-${status}`);
    container.innerHTML = '';
    const leadsInColumn = leads.filter(l => l.status === status);
    document.getElementById(`count-${status}`).textContent = leadsInColumn.length;

    if (leadsInColumn.length === 0) {
      container.innerHTML = '<div class="empty-state">No leads here yet</div>';
      return;
    }

    leadsInColumn.forEach(lead => {
      const card = document.createElement('div');
      card.className = 'lead-card';
      card.innerHTML = `
        <div class="lead-name">${escapeHtml(lead.name)}</div>
        ${lead.company ? `<div class="lead-company">${escapeHtml(lead.company)}</div>` : ''}
        <span class="lead-time" data-created="${lead.created_at}">${timeAgo(lead.created_at)}</span>
      `;
      card.addEventListener('click', () => {
        window.location.href = `lead-detail.html?id=${lead.id}`;
      });
      container.appendChild(card);
    });
  });
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

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Sweep-fill hover, same behavior as login.js: fills in from left,
// exits to the right on hover-out (never reverses back through itself)
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

// Add lead modal
const modal = document.getElementById('addModal');
document.getElementById('addLeadBtn').addEventListener('click', () => modal.classList.add('open'));
function closeModal() {
  modal.classList.add('closing');
  modal.classList.remove('open');
  setTimeout(() => {
    modal.classList.remove('closing');
  }, 200);
}

document.getElementById('cancelAddBtn').addEventListener('click', closeModal);
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

document.getElementById('addLeadForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = document.getElementById('addLeadMsg');
  const name = document.getElementById('leadName').value.trim();
  const company = document.getElementById('leadCompany').value.trim();
  const email = document.getElementById('leadEmail').value.trim();
  const phone = document.getElementById('leadPhone').value.trim();
  const source = document.getElementById('leadSource').value.trim();

  if (!name) {
    msg.className = 'modal-msg error';
    msg.textContent = 'Name is required.';
    return;
  }

  msg.className = 'modal-msg';
  msg.textContent = 'Adding…';

  const { error } = await supabase.from('leads').insert({
    name, company, email, phone, source, status: 'new'
  });

  if (error) {
    msg.className = 'modal-msg error';
    msg.textContent = error.message;
    return;
  }

  msg.className = 'modal-msg success';
  msg.textContent = 'Lead added.';
  document.getElementById('addLeadForm').reset();
  setTimeout(() => {
    modal.classList.remove('open');
    msg.textContent = '';
  }, 600);
  loadLeads();
});

loadLeads();

// If the browser restores this page from back/forward cache (bfcache),
// force a fresh fetch so status changes made on lead-detail always show up
window.addEventListener('pageshow', (e) => {
  if (e.persisted) loadLeads();
});

// Keep "time ago" labels current without needing a full data refetch
setInterval(() => {
  document.querySelectorAll('.lead-time').forEach(el => {
    el.textContent = timeAgo(el.dataset.created);
  });
}, 30000);
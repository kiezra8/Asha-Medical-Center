// ===== UI UTILITIES =====
const UI = {
  fmt: {
    currency(n, sym) {
      const settings = DB.getSettings();
      const s = sym || settings.currency || 'KES';
      return `${s} ${Number(n || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    },
    date(iso) {
      if (!iso) return '—';
      return new Date(iso).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' });
    },
    time(iso) {
      if (!iso) return '—';
      return new Date(iso).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });
    },
    datetime(iso) {
      if (!iso) return '—';
      return `${this.date(iso)} ${this.time(iso)}`;
    },
    age(dob) {
      if (!dob) return '—';
      const diff = Date.now() - new Date(dob).getTime();
      return Math.floor(diff / (365.25 * 24 * 3600 * 1000)) + ' yrs';
    },
    initials(name) {
      return (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    }
  },

  // Modal
  modal: {
    open(title, bodyHTML, large = false) {
      document.getElementById('modalTitle').textContent = title;
      document.getElementById('modalBody').innerHTML = bodyHTML;
      document.getElementById('modal').className = large ? 'modal modal-lg' : 'modal';
      document.getElementById('modalOverlay').classList.add('active');
    },
    close() {
      document.getElementById('modalOverlay').classList.remove('active');
      document.getElementById('modalBody').innerHTML = '';
    }
  },

  // Toast
  toast(msg, type = 'info') {
    const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.innerHTML = `<span>${icons[type] || ''}</span> ${msg}`;
    document.getElementById('toastContainer').appendChild(el);
    setTimeout(() => el.remove(), 3500);
  },

  // Confirm dialog
  confirm(msg) { return window.confirm(msg); },

  // Page navigation
  navigate(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const pageEl = document.getElementById(`page-${page}`);
    if (pageEl) {
      pageEl.classList.add('active');
      pageEl.classList.add('fade-in');
    }
    const navEl = document.querySelector(`[data-page="${page}"]`);
    if (navEl) navEl.classList.add('active');
    document.getElementById('pageTitle').textContent =
      { dashboard: 'Dashboard', patients: 'Patients', pharmacy: 'Pharmacy',
        sales: 'Sales & Billing', appointments: 'Appointments', reports: 'Reports & Analytics',
        staff: 'Staff Management', settings: 'Settings' }[page] || page;
    // Render page
    APP.renderPage(page);
    // Close mobile sidebar
    document.getElementById('sidebar').classList.remove('mobile-open');
  },

  // Empty state
  emptyState(msg, emoji = '📭') {
    return `<div class="empty-state"><div class="emoji">${emoji}</div><p>${msg}</p></div>`;
  },

  // Badge helper
  badge(text, type = 'info') {
    return `<span class="badge badge-${type}">${text}</span>`;
  },

  // Stock color
  stockColor(qty, minStock) {
    if (qty <= 0) return '#e63946';
    if (qty <= minStock) return '#ffd166';
    return '#06d6a0';
  },

  // Chart defaults
  chartDefaults() {
    return {
      plugins: {
        legend: { labels: { color: '#8ca8bc', font: { family: 'Inter', size: 12 } } },
        tooltip: { backgroundColor: '#111827', titleColor: '#e8f4f8', bodyColor: '#8ca8bc', borderColor: 'rgba(0,180,216,0.3)', borderWidth: 1 }
      },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#8ca8bc', font: { family: 'Inter' } } },
        y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#8ca8bc', font: { family: 'Inter' } } }
      }
    };
  }
};

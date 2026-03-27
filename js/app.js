// ===== APP CONTROLLER =====
const APP = {
  currentPage: 'dashboard',

  init() {
    // App starts with clean slate — no demo data seeded

    // Set date in topbar
    this.updateDate();
    setInterval(() => this.updateDate(), 60000);

    // Sidebar toggle
    document.getElementById('sidebarToggle').addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('collapsed');
    });
    document.getElementById('menuBtn').addEventListener('click', () => {
      const sb = document.getElementById('sidebar');
      if (window.innerWidth <= 768) {
        sb.classList.toggle('mobile-open');
      } else {
        sb.classList.toggle('collapsed');
      }
    });

    // Nav items
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        UI.navigate(item.dataset.page);
      });
    });

    // Modal close
    document.getElementById('modalClose').addEventListener('click', () => UI.modal.close());
    document.getElementById('modalOverlay').addEventListener('click', (e) => {
      if (e.target === document.getElementById('modalOverlay')) UI.modal.close();
    });

    // Register Service Worker for PWA (offline & install)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js')
        .then(reg => console.log('SW registered:', reg.scope))
        .catch(err => console.log('SW registration failed:', err));
    }

    // PWA Install Prompt handling
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      const installBtn = document.getElementById('installBtn');
      if (installBtn) {
        installBtn.style.display = 'block';
        installBtn.addEventListener('click', () => {
          deferredPrompt.prompt();
          deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') installBtn.style.display = 'none';
            deferredPrompt = null;
          });
        });
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') UI.modal.close();
    });

    // Initial render
    UI.navigate('dashboard');
  },

  updateDate() {
    const now = new Date();
    document.getElementById('dateDisplay').textContent =
      now.toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) +
      ' — ' + now.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });
  },

  renderPage(page) {
    this.currentPage = page;
    switch (page) {
      case 'dashboard':    renderDashboard();    break;
      case 'patients':     renderPatients();     break;
      case 'pharmacy':     renderPharmacy();     break;
      case 'sales':        renderSales();        break;
      case 'appointments': renderAppointments(); break;
      case 'reports':      renderReports();      break;
      case 'staff':        renderStaff();        break;
      case 'settings':     renderSettings();     break;
    }
  }
};

// Start app
document.addEventListener('DOMContentLoaded', () => APP.init());

// ===== DASHBOARD =====
let dashCharts = {};

function renderDashboard() {
  const settings = DB.getSettings();
  const todaySales = DB.getToday();
  const weekSales = DB.getThisWeek();
  const monthSales = DB.getThisMonth();
  const patients = DB.getPatients();
  const drugs = DB.getDrugs();
  const lowStock = drugs.filter(d => d.quantity <= (d.minStock || 10));
  const appts = DB.getAppointments();
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppts = appts.filter(a => a.date === todayStr);

  const el = document.getElementById('page-dashboard');
  el.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card" style="--gradient:linear-gradient(90deg,#00b4d8,#06d6a0)">
        <div class="stat-icon">💰</div>
        <div class="stat-value">${UI.fmt.currency(DB.totalRevenue(todaySales))}</div>
        <div class="stat-label">Today's Revenue</div>
        <span class="stat-change up">${todaySales.length} sales</span>
      </div>
      <div class="stat-card" style="--gradient:linear-gradient(90deg,#f4a261,#e63946)">
        <div class="stat-icon">📅</div>
        <div class="stat-value">${UI.fmt.currency(DB.totalRevenue(weekSales))}</div>
        <div class="stat-label">This Week</div>
        <span class="stat-change up">${weekSales.length} sales</span>
      </div>
      <div class="stat-card" style="--gradient:linear-gradient(90deg,#a855f7,#3b82f6)">
        <div class="stat-icon">📊</div>
        <div class="stat-value">${UI.fmt.currency(DB.totalRevenue(monthSales))}</div>
        <div class="stat-label">This Month</div>
        <span class="stat-change up">${monthSales.length} sales</span>
      </div>
      <div class="stat-card" style="--gradient:linear-gradient(90deg,#06d6a0,#0077b6)">
        <div class="stat-icon">👥</div>
        <div class="stat-value">${patients.length}</div>
        <div class="stat-label">Total Patients</div>
        <span class="stat-change up">Registered</span>
      </div>
      <div class="stat-card" style="--gradient:linear-gradient(90deg,#ffd166,#f4a261)">
        <div class="stat-icon">💊</div>
        <div class="stat-value">${drugs.length}</div>
        <div class="stat-label">Drug Items</div>
        <span class="stat-change ${lowStock.length > 0 ? 'down' : 'up'}">${lowStock.length} low stock</span>
      </div>
      <div class="stat-card" style="--gradient:linear-gradient(90deg,#e63946,#f4a261)">
        <div class="stat-icon">📋</div>
        <div class="stat-value">${todayAppts.length}</div>
        <div class="stat-label">Today's Appointments</div>
        <span class="stat-change up">Scheduled</span>
      </div>
    </div>

    <div class="grid-2" style="margin-bottom:24px">
      <div class="card">
        <div class="card-header">
          <span class="card-title">📈 Revenue (Last 7 Days)</span>
          <div style="display:flex;gap:8px">
            <button class="btn btn-xs btn-outline" onclick="setDashChart('bar')">Bar</button>
            <button class="btn btn-xs btn-primary" onclick="setDashChart('line')">Line</button>
          </div>
        </div>
        <div class="chart-container"><canvas id="dashWeekChart"></canvas></div>
      </div>
      <div class="card">
        <div class="card-header">
          <span class="card-title">📊 Monthly Revenue</span>
        </div>
        <div class="chart-container"><canvas id="dashMonthChart"></canvas></div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-header">
          <span class="card-title">⚠️ Low Stock Alerts</span>
          <button class="btn btn-sm btn-outline" onclick="UI.navigate('pharmacy')">View All</button>
        </div>
        <div id="dashLowStock">
          ${lowStock.length === 0 ? UI.emptyState('All stocks are adequate!','✅') :
            lowStock.map(d => `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border);">
                <div><div style="font-size:13px;font-weight:600">${d.name}</div>
                <div style="font-size:11px;color:var(--text-secondary)">${d.category}</div></div>
                <div style="text-align:right">
                  <div style="font-size:15px;font-weight:700;color:${UI.stockColor(d.quantity,d.minStock)}">${d.quantity}</div>
                  <div style="font-size:10px;color:var(--text-muted)">Min: ${d.minStock||10}</div>
                </div>
              </div>`).join('')}
        </div>
      </div>
      <div class="card">
        <div class="card-header">
          <span class="card-title">📅 Today's Appointments</span>
          <button class="btn btn-sm btn-outline" onclick="UI.navigate('appointments')">View All</button>
        </div>
        ${todayAppts.length === 0 ? UI.emptyState('No appointments today','📋') :
          todayAppts.slice(0,5).map(a => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border);">
              <div>
                <div style="font-size:13px;font-weight:600">${a.patientName}</div>
                <div style="font-size:11px;color:var(--text-secondary)">${a.reason}</div>
              </div>
              <div>${UI.badge(a.time,'info')} ${UI.badge(a.status||'Scheduled','success')}</div>
            </div>`).join('')}
      </div>
    </div>
  `;

  // Destroy old charts
  if (dashCharts.week) dashCharts.week.destroy();
  if (dashCharts.month) dashCharts.month.destroy();

  // Weekly chart
  const weekLabels = [];
  const weekData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    weekLabels.push(d.toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric' }));
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const end = new Date(start); end.setDate(end.getDate() + 1);
    weekData.push(DB.totalRevenue(DB.getSalesByRange(start, end)));
  }
  const wCtx = document.getElementById('dashWeekChart').getContext('2d');
  dashCharts.week = new Chart(wCtx, {
    type: window._dashChartType || 'bar',
    data: {
      labels: weekLabels,
      datasets: [{ label: 'Revenue', data: weekData,
        backgroundColor: 'rgba(0,180,216,0.3)', borderColor: '#00b4d8',
        borderWidth: 2, borderRadius: 6, fill: true,
        tension: 0.4 }]
    },
    options: { responsive: true, maintainAspectRatio: false, ...UI.chartDefaults() }
  });

  // Monthly chart (last 6 months)
  const monthLabels = [];
  const monthData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
    monthLabels.push(m.toLocaleDateString('en-KE', { month: 'short', year: '2-digit' }));
    const start = m;
    const end = new Date(m.getFullYear(), m.getMonth() + 1, 1);
    monthData.push(DB.totalRevenue(DB.getSalesByRange(start, end)));
  }
  const mCtx = document.getElementById('dashMonthChart').getContext('2d');
  dashCharts.month = new Chart(mCtx, {
    type: 'line',
    data: {
      labels: monthLabels,
      datasets: [{ label: 'Revenue', data: monthData,
        backgroundColor: 'rgba(6,214,160,0.15)', borderColor: '#06d6a0',
        borderWidth: 2, fill: true, tension: 0.4, pointBackgroundColor: '#06d6a0', pointRadius: 5 }]
    },
    options: { responsive: true, maintainAspectRatio: false, ...UI.chartDefaults() }
  });
}

function setDashChart(type) {
  window._dashChartType = type;
  renderDashboard();
}

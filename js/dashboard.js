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

  // Stock analytics
  const totalStocked = DB.getTotalStocked();
  const currentStock = DB.getCurrentStock();
  const totalSoldQty = DB.getTotalSoldQty();

  const el = document.getElementById('page-dashboard');
  el.innerHTML = `
    <!-- Revenue Stats -->
    <div style="font-size:12px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:12px">Revenue Overview</div>
    <div class="stats-grid" style="margin-bottom:28px">
      <div class="stat-card" style="--gradient:linear-gradient(90deg,#00b4d8,#06d6a0)">
        <div class="stat-icon">📆</div>
        <div class="stat-value" style="font-size:20px">${UI.fmt.currency(DB.totalRevenue(todaySales))}</div>
        <div class="stat-label">Today's Revenue</div>
        <span class="stat-change up">${todaySales.length} sale${todaySales.length!==1?'s':''}</span>
      </div>
      <div class="stat-card" style="--gradient:linear-gradient(90deg,#f4a261,#e63946)">
        <div class="stat-icon">📅</div>
        <div class="stat-value" style="font-size:20px">${UI.fmt.currency(DB.totalRevenue(weekSales))}</div>
        <div class="stat-label">This Week's Revenue</div>
        <span class="stat-change up">${weekSales.length} sale${weekSales.length!==1?'s':''}</span>
      </div>
      <div class="stat-card" style="--gradient:linear-gradient(90deg,#a855f7,#3b82f6)">
        <div class="stat-icon">📊</div>
        <div class="stat-value" style="font-size:20px">${UI.fmt.currency(DB.totalRevenue(monthSales))}</div>
        <div class="stat-label">This Month's Revenue</div>
        <span class="stat-change up">${monthSales.length} sale${monthSales.length!==1?'s':''}</span>
      </div>
      <div class="stat-card" style="--gradient:linear-gradient(90deg,#06d6a0,#0077b6)">
        <div class="stat-icon">👥</div>
        <div class="stat-value">${patients.length}</div>
        <div class="stat-label">Registered Patients</div>
      </div>
    </div>

    <!-- Stock Overview -->
    <div style="font-size:12px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:12px">Stock Overview (Auto-calculated)</div>
    <div class="stats-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:28px">
      <div class="stat-card" style="--gradient:linear-gradient(90deg,#3b82f6,#a855f7)">
        <div class="stat-icon">📦</div>
        <div class="stat-value">${totalStocked.toLocaleString()}</div>
        <div class="stat-label">Total Units Stocked</div>
        <span class="stat-change up">All time</span>
      </div>
      <div class="stat-card" style="--gradient:linear-gradient(90deg,#06d6a0,#00b4d8)">
        <div class="stat-icon">🏪</div>
        <div class="stat-value">${currentStock.toLocaleString()}</div>
        <div class="stat-label">Units In Stock Now</div>
        <span class="stat-change ${lowStock.length > 0 ? 'down' : 'up'}">${drugs.length} drug type${drugs.length!==1?'s':''}</span>
      </div>
      <div class="stat-card" style="--gradient:linear-gradient(90deg,#f4a261,#ffd166)">
        <div class="stat-icon">🛒</div>
        <div class="stat-value">${totalSoldQty.toLocaleString()}</div>
        <div class="stat-label">Total Units Sold</div>
        <span class="stat-change up">Auto from sales</span>
      </div>
    </div>

    <!-- Charts -->
    <div class="grid-2" style="margin-bottom:24px">
      <div class="card">
        <div class="card-header">
          <span class="card-title">📈 Revenue — Last 7 Days</span>
          <div style="display:flex;gap:8px">
            <button class="btn btn-xs btn-outline" id="dashBarBtn" onclick="setDashChart('bar')">Bar</button>
            <button class="btn btn-xs btn-primary" id="dashLineBtn" onclick="setDashChart('line')">Line</button>
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

    <!-- Low stock + Today's appointments -->
    <div class="grid-2">
      <div class="card">
        <div class="card-header">
          <span class="card-title">⚠️ Low Stock Alerts</span>
          <button class="btn btn-sm btn-outline" onclick="UI.navigate('pharmacy')">View All</button>
        </div>
        <div id="dashLowStock">
          ${lowStock.length === 0
            ? (drugs.length === 0
                ? UI.emptyState('No drugs added yet. Go to Pharmacy to add stock.','💊')
                : UI.emptyState('All stock levels are adequate!','✅'))
            : lowStock.map(d => `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border);">
                <div><div style="font-size:13px;font-weight:600">${d.name}</div>
                <div style="font-size:11px;color:var(--text-secondary)">${d.category||''}</div></div>
                <div style="text-align:right">
                  <div style="font-size:15px;font-weight:700;color:${UI.stockColor(d.quantity,d.minStock||10)}">${d.quantity}</div>
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
                <div style="font-size:11px;color:var(--text-secondary)">${a.reason||''}</div>
              </div>
              <div>${UI.badge(a.time||'—','info')} ${UI.badge(a.status||'Scheduled','success')}</div>
            </div>`).join('')}
      </div>
    </div>
  `;

  // Destroy old charts
  if (dashCharts.week) { try { dashCharts.week.destroy(); } catch(e){} }
  if (dashCharts.month) { try { dashCharts.month.destroy(); } catch(e){} }

  // Weekly chart
  const weekLabels = [];
  const weekData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    weekLabels.push(d.toLocaleDateString('en-UG', { weekday: 'short', day: 'numeric' }));
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const end = new Date(start); end.setDate(end.getDate() + 1);
    weekData.push(DB.totalRevenue(DB.getSalesByRange(start, end)));
  }
  const wCtx = document.getElementById('dashWeekChart').getContext('2d');
  const chartType = window._dashChartType || 'bar';
  dashCharts.week = new Chart(wCtx, {
    type: chartType,
    data: {
      labels: weekLabels,
      datasets: [{ label: 'Revenue (UGX)', data: weekData,
        backgroundColor: chartType === 'bar' ? 'rgba(0,180,216,0.4)' : 'rgba(0,180,216,0.15)',
        borderColor: '#00b4d8', borderWidth: 2, borderRadius: chartType === 'bar' ? 6 : 0,
        fill: true, tension: 0.4, pointBackgroundColor: '#00b4d8', pointRadius: 5 }]
    },
    options: { responsive: true, maintainAspectRatio: false, ...UI.chartDefaults() }
  });

  // Monthly chart (last 6 months)
  const monthLabels = [];
  const monthData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
    monthLabels.push(m.toLocaleDateString('en-UG', { month: 'short', year: '2-digit' }));
    const start = m;
    const end = new Date(m.getFullYear(), m.getMonth() + 1, 1);
    monthData.push(DB.totalRevenue(DB.getSalesByRange(start, end)));
  }
  const mCtx = document.getElementById('dashMonthChart').getContext('2d');
  dashCharts.month = new Chart(mCtx, {
    type: 'line',
    data: {
      labels: monthLabels,
      datasets: [{ label: 'Revenue (UGX)', data: monthData,
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

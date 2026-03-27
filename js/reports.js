// ===== REPORTS & ANALYTICS =====
let reportCharts = {};

function renderReports() {
  const el = document.getElementById('page-reports');
  el.innerHTML = `
    <div class="section-header">
      <div class="section-title">📈 Reports & Analytics</div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-outline" onclick="exportSalesReport()">📥 Export Report</button>
      </div>
    </div>

    <div class="tabs" id="reportTabs">
      <button class="tab-btn active" onclick="switchReportTab('daily')">Daily</button>
      <button class="tab-btn" onclick="switchReportTab('monthly')">Monthly</button>
      <button class="tab-btn" onclick="switchReportTab('yearly')">Yearly</button>
      <button class="tab-btn" onclick="switchReportTab('drugs')">Drug Sales</button>
    </div>
    <div id="reportContent"></div>
  `;
  switchReportTab('daily');
}

function switchReportTab(tab) {
  window._reportTab = tab;
  document.querySelectorAll('#reportTabs .tab-btn').forEach((b,i) => {
    b.classList.toggle('active', ['daily','monthly','yearly','drugs'][i] === tab);
  });
  Object.values(reportCharts).forEach(c => { try { c.destroy(); } catch(e) {} });
  reportCharts = {};
  const el = document.getElementById('reportContent');

  if (tab === 'daily') {
    // Last 14 days
    const labels = [], barData = [], lineData = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      labels.push(d.toLocaleDateString('en-KE', { month: 'short', day: 'numeric' }));
      const s = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const e = new Date(s); e.setDate(e.getDate() + 1);
      const daySales = DB.getSalesByRange(s, e);
      barData.push(DB.totalRevenue(daySales));
      lineData.push(daySales.length);
    }
    el.innerHTML = `
      <div class="grid-2" style="margin-bottom:24px">
        <div class="card">
          <div class="card-header"><span class="card-title">Bar Chart — Daily Revenue (14 Days)</span></div>
          <div class="chart-container"><canvas id="rDailyBar"></canvas></div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">Line Chart — Daily Sales Count</span></div>
          <div class="chart-container"><canvas id="rDailyLine"></canvas></div>
        </div>
      </div>
      ${summaryTable(DB.getThisWeek(), 'This Week Summary')}
    `;
    reportCharts.dailyBar = buildBarChart('rDailyBar', labels, barData, 'Revenue (KES)', '#00b4d8');
    reportCharts.dailyLine = buildLineChart('rDailyLine', labels, lineData, 'No. of Sales', '#06d6a0');

  } else if (tab === 'monthly') {
    const labels = [], barData = [], lineData = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
      labels.push(m.toLocaleDateString('en-KE', { month: 'short', year: '2-digit' }));
      const start = m;
      const end = new Date(m.getFullYear(), m.getMonth() + 1, 1);
      const mSales = DB.getSalesByRange(start, end);
      barData.push(DB.totalRevenue(mSales));
      lineData.push(mSales.length);
    }
    el.innerHTML = `
      <div class="grid-2" style="margin-bottom:24px">
        <div class="card">
          <div class="card-header"><span class="card-title">Bar Chart — Monthly Revenue (12 Months)</span></div>
          <div class="chart-container"><canvas id="rMonthBar"></canvas></div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">Line Chart — Monthly Sales Count</span></div>
          <div class="chart-container"><canvas id="rMonthLine"></canvas></div>
        </div>
      </div>
      ${summaryTable(DB.getThisMonth(), 'This Month Summary')}
    `;
    reportCharts.monthBar = buildBarChart('rMonthBar', labels, barData, 'Revenue (KES)', '#a855f7');
    reportCharts.monthLine = buildLineChart('rMonthLine', labels, lineData, 'No. of Sales', '#f4a261');

  } else if (tab === 'yearly') {
    const labels = [], barData = [], lineData = [];
    const thisYear = new Date().getFullYear();
    for (let y = thisYear - 2; y <= thisYear; y++) {
      labels.push(String(y));
      const start = new Date(y, 0, 1);
      const end = new Date(y + 1, 0, 1);
      const ySales = DB.getSalesByRange(start, end);
      barData.push(DB.totalRevenue(ySales));
      lineData.push(ySales.length);
    }
    const allSales = DB.getSales();
    el.innerHTML = `
      <div class="grid-2" style="margin-bottom:24px">
        <div class="card">
          <div class="card-header"><span class="card-title">Bar Chart — Yearly Revenue</span></div>
          <div class="chart-container"><canvas id="rYearBar"></canvas></div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">Line Chart — Yearly Sales Count</span></div>
          <div class="chart-container"><canvas id="rYearLine"></canvas></div>
        </div>
      </div>
      ${summaryTable(allSales, 'All-Time Summary')}
    `;
    reportCharts.yearBar = buildBarChart('rYearBar', labels, barData, 'Revenue (KES)', '#e63946');
    reportCharts.yearLine = buildLineChart('rYearLine', labels, lineData, 'No. of Sales', '#ffd166');

  } else if (tab === 'drugs') {
    // Top selling drugs from all sales
    const drugMap = {};
    DB.getSales().forEach(s => {
      (s.items || []).forEach(item => {
        if (!drugMap[item.drugName]) drugMap[item.drugName] = { qty: 0, revenue: 0 };
        drugMap[item.drugName].qty += item.qty || 0;
        drugMap[item.drugName].revenue += item.subtotal || 0;
      });
    });
    const sorted = Object.entries(drugMap).sort((a,b) => b[1].revenue - a[1].revenue).slice(0, 10);
    const labels = sorted.map(([name]) => name);
    const revenueData = sorted.map(([,v]) => v.revenue);
    const qtyData = sorted.map(([,v]) => v.qty);
    el.innerHTML = `
      <div class="grid-2" style="margin-bottom:24px">
        <div class="card">
          <div class="card-header"><span class="card-title">Top Drugs by Revenue</span></div>
          <div class="chart-container"><canvas id="rDrugRev"></canvas></div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">Top Drugs by Quantity Sold</span></div>
          <div class="chart-container"><canvas id="rDrugQty"></canvas></div>
        </div>
      </div>
      <div class="card">
        <div class="card-title" style="margin-bottom:16px">Drug Sales Breakdown</div>
        <div class="table-wrap"><table>
          <thead><tr><th>Drug</th><th>Qty Sold</th><th>Revenue</th></tr></thead>
          <tbody>${sorted.map(([name,v]) => `<tr><td>${name}</td><td>${v.qty}</td><td>${UI.fmt.currency(v.revenue)}</td></tr>`).join('')}</tbody>
        </table></div>
      </div>
    `;
    reportCharts.drugRev = buildBarChart('rDrugRev', labels, revenueData, 'Revenue', '#00b4d8', true);
    reportCharts.drugQty = buildBarChart('rDrugQty', labels, qtyData, 'Qty Sold', '#06d6a0', true);
  }
}

function summaryTable(sales, title) {
  const total = DB.totalRevenue(sales);
  const avg = sales.length ? total / sales.length : 0;
  const cash = DB.totalRevenue(sales.filter(s => s.paymentMethod === 'Cash'));
  const mpesa = DB.totalRevenue(sales.filter(s => s.paymentMethod === 'M-Pesa'));
  const ins = DB.totalRevenue(sales.filter(s => s.paymentMethod === 'Insurance'));
  return `<div class="card">
    <div class="card-title" style="margin-bottom:16px">${title}</div>
    <div class="grid-3">
      <div>${infoRow2('Total Sales', sales.length)} ${infoRow2('Total Revenue', UI.fmt.currency(total))} ${infoRow2('Avg per Sale', UI.fmt.currency(avg))}</div>
      <div>${infoRow2('Cash', UI.fmt.currency(cash))} ${infoRow2('M-Pesa', UI.fmt.currency(mpesa))} ${infoRow2('Insurance', UI.fmt.currency(ins))}</div>
      <div>
        <div style="height:120px"><canvas id="payMethodChart"></canvas></div>
      </div>
    </div>
  </div>`;
}

function infoRow2(label, value) {
  return `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);font-size:13px">
    <span style="color:var(--text-secondary)">${label}</span><span style="font-weight:600">${value}</span>
  </div>`;
}

function buildBarChart(canvasId, labels, data, label, color, horizontal = false) {
  const ctx = document.getElementById(canvasId)?.getContext('2d');
  if (!ctx) return null;
  const colors = ['#00b4d8','#06d6a0','#a855f7','#f4a261','#e63946','#ffd166','#3b82f6','#ec4899','#14b8a6','#f59e0b'];
  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{ label, data,
        backgroundColor: horizontal ? colors.slice(0, data.length).map(c => c + '99') : color + '55',
        borderColor: horizontal ? colors.slice(0, data.length) : color,
        borderWidth: 2, borderRadius: 5 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      indexAxis: horizontal ? 'y' : 'x',
      ...UI.chartDefaults()
    }
  });
}

function buildLineChart(canvasId, labels, data, label, color) {
  const ctx = document.getElementById(canvasId)?.getContext('2d');
  if (!ctx) return null;
  return new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{ label, data, borderColor: color, backgroundColor: color + '20',
        borderWidth: 2, fill: true, tension: 0.4, pointBackgroundColor: color, pointRadius: 4 }]
    },
    options: { responsive: true, maintainAspectRatio: false, ...UI.chartDefaults() }
  });
}

function exportSalesReport() {
  const tab = window._reportTab || 'daily';
  const sales = DB.getSales();
  let csv = 'Date,Patient,Items,Total,Payment\n';
  sales.forEach(s => {
    const items = (s.items||[]).map(i => `${i.drugName}x${i.qty}`).join('; ');
    csv += `"${UI.fmt.datetime(s.date)}","${s.patientName||'Walk-in'}","${items}",${s.total},"${s.paymentMethod||'Cash'}"\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `asha_report_${tab}_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  UI.toast('Report exported!', 'success');
}

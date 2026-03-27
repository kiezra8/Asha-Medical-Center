// ===== SETTINGS MODULE =====
function renderSettings() {
  const s = DB.getSettings();
  const el = document.getElementById('page-settings');
  el.innerHTML = `
    <div class="section-title" style="margin-bottom:24px">⚙️ Settings</div>
    <div class="grid-2">
      <div class="card">
        <div class="card-header"><span class="card-title">🏥 Clinic Information</span></div>
        <div class="form-group"><label class="form-label">Clinic Name</label>
          <input class="form-control" id="sClinicName" value="${s.clinicName||'Asha Medical Center'}" /></div>
        <div class="form-group"><label class="form-label">Address</label>
          <textarea class="form-control" id="sAddress">${s.address||''}</textarea></div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Phone</label>
            <input class="form-control" id="sPhone" value="${s.phone||''}" /></div>
          <div class="form-group"><label class="form-label">Email</label>
            <input class="form-control" id="sEmail" value="${s.email||''}" /></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Default Doctor</label>
            <input class="form-control" id="sDoctorName" value="${s.doctorName||''}" placeholder="Dr. Name" /></div>
          <div class="form-group"><label class="form-label">Currency</label>
            <select class="form-control" id="sCurrency">
              ${['KES','USD','UGX','TZS','ETB','NGN','GHS','ZAR']
                .map(c=>`<option ${s.currency===c?'selected':''}>${c}</option>`).join('')}
            </select></div>
        </div>
        <div class="form-group"><label class="form-label">Low Stock Alert Threshold</label>
          <input class="form-control" id="sLowStock" type="number" value="${s.lowStockThreshold||10}" min="1" /></div>
        <button class="btn btn-primary" onclick="saveSettings()">💾 Save Settings</button>
      </div>

      <div>
        <div class="card" style="margin-bottom:20px">
          <div class="card-header"><span class="card-title">💾 Data Management</span></div>
          <p style="font-size:13px;color:var(--text-secondary);margin-bottom:16px">
            All data is stored locally on this device using browser localStorage. Data persists across sessions.
          </p>
          <div style="display:flex;flex-direction:column;gap:10px">
            <button class="btn btn-outline" onclick="backupData()">📤 Backup All Data (JSON)</button>
            <label class="btn btn-outline" style="cursor:pointer">
              📥 Restore from Backup
              <input type="file" accept=".json" onchange="restoreData(event)" style="display:none" />
            </label>
            <button class="btn btn-danger" onclick="clearAllData()">🗑 Clear All Data</button>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><span class="card-title">ℹ️ System Info</span></div>
          <div id="dataStats"></div>
          <div class="divider"></div>
          <div style="font-size:12px;color:var(--text-muted)">
            <div>Version: 1.0.0</div>
            <div>Asha Medical Center Management System</div>
            <div>Works 100% offline — no internet required</div>
          </div>
        </div>
      </div>
    </div>
  `;
  // Show data stats
  const statsEl = document.getElementById('dataStats');
  const patients = DB.getPatients().length;
  const drugs = DB.getDrugs().length;
  const sales = DB.getSales().length;
  const appointments = DB.getAppointments().length;
  const staff = DB.getStaff().length;
  const storageSize = new Blob([JSON.stringify(localStorage)]).size;
  statsEl.innerHTML = [
    ['Patients', patients], ['Drugs in Inventory', drugs],
    ['Sales Records', sales], ['Appointments', appointments],
    ['Staff Members', staff],
    ['Storage Used', `~${(storageSize / 1024).toFixed(1)} KB`]
  ].map(([k,v]) => `<div class="info-row"><span class="info-label">${k}</span><span class="info-value">${v}</span></div>`).join('');
}

function saveSettings() {
  DB.saveSettings({
    clinicName: document.getElementById('sClinicName').value,
    address: document.getElementById('sAddress').value,
    phone: document.getElementById('sPhone').value,
    email: document.getElementById('sEmail').value,
    doctorName: document.getElementById('sDoctorName').value,
    currency: document.getElementById('sCurrency').value,
    lowStockThreshold: parseInt(document.getElementById('sLowStock').value) || 10
  });
  UI.toast('Settings saved!', 'success');
}

function backupData() {
  const data = {
    patients: DB.getPatients(),
    drugs: DB.getDrugs(),
    sales: DB.getSales(),
    appointments: DB.getAppointments(),
    staff: DB.getStaff(),
    settings: DB.getSettings(),
    exportedAt: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `asha_backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  UI.toast('Backup downloaded!', 'success');
}

function restoreData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (UI.confirm('Restore backup? This will OVERWRITE all current data.')) {
        if (data.patients) DB.savePatients(data.patients);
        if (data.drugs) DB.saveDrugs(data.drugs);
        if (data.sales) DB.saveSales(data.sales);
        if (data.appointments) DB.saveAppointments(data.appointments);
        if (data.staff) DB.saveStaff(data.staff);
        if (data.settings) DB.saveSettings(data.settings);
        UI.toast('Data restored successfully!', 'success');
        renderSettings();
      }
    } catch (err) {
      UI.toast('Invalid backup file', 'error');
    }
  };
  reader.readAsText(file);
}

function clearAllData() {
  if (!UI.confirm('⚠️ This will DELETE ALL data permanently. Are you sure?')) return;
  if (!UI.confirm('FINAL WARNING: All patients, sales, and inventory will be removed. Continue?')) return;
  Object.values(DB.KEYS).forEach(k => localStorage.removeItem(k));
  UI.toast('All data cleared', 'warning');
  DB.seed();
  renderSettings();
}

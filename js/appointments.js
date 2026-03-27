// ===== APPOINTMENTS MODULE =====
function renderAppointments() {
  const appts = DB.getAppointments().slice().reverse();
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppts = appts.filter(a => a.date === todayStr);
  const upcoming = appts.filter(a => a.date > todayStr);
  const el = document.getElementById('page-appointments');
  el.innerHTML = `
    <div class="section-header">
      <div class="section-title">📅 Appointments</div>
      <button class="btn btn-primary" onclick="openAddApptModal()">+ New Appointment</button>
    </div>
    <div class="tabs" id="apptTabs">
      <button class="tab-btn active" onclick="switchApptTab('today')">Today (${todayAppts.length})</button>
      <button class="tab-btn" onclick="switchApptTab('upcoming')">Upcoming (${upcoming.length})</button>
      <button class="tab-btn" onclick="switchApptTab('all')">All</button>
    </div>
    <div id="apptContent"></div>
  `;
  window._apptActive = 'today';
  renderApptList(todayAppts);
}

function switchApptTab(tab) {
  window._apptActive = tab;
  const all = DB.getAppointments().slice().reverse();
  const todayStr = new Date().toISOString().split('T')[0];
  document.querySelectorAll('#apptTabs .tab-btn').forEach((b,i) => {
    b.classList.toggle('active', ['today','upcoming','all'][i] === tab);
  });
  const filtered = tab === 'today' ? all.filter(a => a.date === todayStr) :
                   tab === 'upcoming' ? all.filter(a => a.date > todayStr) : all;
  renderApptList(filtered);
}

function renderApptList(appts) {
  const el = document.getElementById('apptContent');
  if (!el) return;
  if (appts.length === 0) { el.innerHTML = UI.emptyState('No appointments found','📅'); return; }
  el.innerHTML = `<div class="table-wrap"><table>
    <thead><tr><th>Patient</th><th>Date</th><th>Time</th><th>Reason</th><th>Doctor</th><th>Status</th><th>Actions</th></tr></thead>
    <tbody>
    ${appts.map(a => `<tr>
      <td style="font-weight:600">${a.patientName}</td>
      <td>${UI.fmt.date(a.date)}</td>
      <td>${a.time || '—'}</td>
      <td style="max-width:200px">${a.reason || '—'}</td>
      <td>${a.doctor || '—'}</td>
      <td>${UI.badge(a.status || 'Scheduled',
        a.status === 'Completed' ? 'success' : a.status === 'Cancelled' ? 'danger' : 'info')}</td>
      <td><div style="display:flex;gap:4px">
        ${a.status !== 'Completed' ? `<button class="btn btn-xs btn-accent" onclick="completeAppt('${a.id}')">✓ Done</button>` : ''}
        ${a.status !== 'Cancelled' ? `<button class="btn btn-xs btn-warning" onclick="cancelAppt('${a.id}')">Cancel</button>` : ''}
        <button class="btn btn-xs btn-danger" onclick="deleteApptConfirm('${a.id}')">Del</button>
      </div></td>
    </tr>`).join('')}
    </tbody></table></div>`;
}

function openAddApptModal(editId) {
  const a = editId ? DB.getAppointments().find(x => x.id === editId) : null;
  const patients = DB.getPatients();
  const settings = DB.getSettings();
  const staff = DB.getStaff();
  UI.modal.open(a ? 'Edit Appointment' : 'New Appointment', `
    <div class="form-group"><label class="form-label">Patient Name *</label>
      <input class="form-control" id="aPatient" list="aPatientList" placeholder="Patient or Walk-in" value="${a?.patientName||''}" />
      <datalist id="aPatientList">${patients.map(p=>`<option value="${p.name}">`).join('')}</datalist></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Date *</label>
        <input class="form-control" id="aDate" type="date" value="${a?.date || new Date().toISOString().split('T')[0]}" /></div>
      <div class="form-group"><label class="form-label">Time</label>
        <input class="form-control" id="aTime" type="time" value="${a?.time||''}" /></div>
    </div>
    <div class="form-group"><label class="form-label">Reason / Type</label>
      <input class="form-control" id="aReason" value="${a?.reason||''}" list="aReasonList" placeholder="e.g. Follow-up, Consultation" />
      <datalist id="aReasonList">${['Follow-up','Consultation','Lab Results','Antenatal','Vaccination','Dental','Eye Checkup','General Checkup']
        .map(r=>`<option>${r}</option>`).join('')}</datalist></div>
    <div class="form-group"><label class="form-label">Doctor / Clinician</label>
      <input class="form-control" id="aDoctor" value="${a?.doctor||settings.doctorName||''}" list="aDoctorList" />
      <datalist id="aDoctorList">${staff.map(s=>`<option value="${s.name}">`).join('')}</datalist></div>
    <div class="form-group"><label class="form-label">Notes</label>
      <textarea class="form-control" id="aNotes">${a?.notes||''}</textarea></div>
    <div style="display:flex;justify-content:flex-end;gap:12px;margin-top:16px">
      <button class="btn btn-outline" onclick="UI.modal.close()">Cancel</button>
      <button class="btn btn-primary" onclick="${a ? `saveApptEdit('${a.id}')` : 'saveApptNew()'}">
        ${a ? 'Save' : 'Book Appointment'}
      </button>
    </div>
  `);
}

function saveApptNew() {
  const name = document.getElementById('aPatient').value.trim();
  const date = document.getElementById('aDate').value;
  if (!name || !date) { UI.toast('Patient and date required', 'error'); return; }
  DB.addAppointment({
    patientName: name, date, time: document.getElementById('aTime').value,
    reason: document.getElementById('aReason').value,
    doctor: document.getElementById('aDoctor').value,
    notes: document.getElementById('aNotes').value, status: 'Scheduled'
  });
  UI.modal.close();
  UI.toast('Appointment booked!', 'success');
  renderAppointments();
}

function saveApptEdit(id) {
  const name = document.getElementById('aPatient').value.trim();
  const date = document.getElementById('aDate').value;
  if (!name || !date) { UI.toast('Patient and date required', 'error'); return; }
  DB.updateAppointment(id, {
    patientName: name, date, time: document.getElementById('aTime').value,
    reason: document.getElementById('aReason').value,
    doctor: document.getElementById('aDoctor').value,
    notes: document.getElementById('aNotes').value
  });
  UI.modal.close();
  UI.toast('Appointment updated!', 'success');
  renderAppointments();
}

function completeAppt(id) {
  DB.updateAppointment(id, { status: 'Completed', completedAt: new Date().toISOString() });
  UI.toast('Marked as completed', 'success');
  renderAppointments();
}
function cancelAppt(id) {
  if (!UI.confirm('Cancel this appointment?')) return;
  DB.updateAppointment(id, { status: 'Cancelled' });
  UI.toast('Appointment cancelled', 'warning');
  renderAppointments();
}
function deleteApptConfirm(id) {
  if (!UI.confirm('Delete this appointment?')) return;
  DB.deleteAppointment(id);
  UI.toast('Appointment deleted', 'warning');
  renderAppointments();
}

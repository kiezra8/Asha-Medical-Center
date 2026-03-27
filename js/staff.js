// ===== STAFF MODULE =====
function renderStaff() {
  const staff = DB.getStaff();
  const el = document.getElementById('page-staff');
  el.innerHTML = `
    <div class="section-header">
      <div class="section-title">👨‍⚕️ Staff Management</div>
      <button class="btn btn-primary" onclick="openAddStaffModal()">+ Add Staff</button>
    </div>
    <div class="grid-auto" id="staffGrid">
      ${staff.length === 0 ? UI.emptyState('No staff added yet','👨‍⚕️') : ''}
    </div>
  `;
  renderStaffCards(staff);
}

function renderStaffCards(staff) {
  const grid = document.getElementById('staffGrid');
  if (!grid) return;
  if (staff.length === 0) { grid.innerHTML = UI.emptyState('No staff added yet','👨‍⚕️'); return; }
  const roleColors = { Doctor:'info', Nurse:'success', Pharmacist:'warning', Receptionist:'secondary', 'Lab Tech':'info' };
  grid.innerHTML = staff.map(s => `
    <div class="card">
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px">
        <div style="width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--accent));display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;color:#fff">
          ${UI.fmt.initials(s.name)}
        </div>
        <div>
          <div style="font-size:15px;font-weight:700">${s.name}</div>
          ${UI.badge(s.role || 'Staff', roleColors[s.role] || 'secondary')}
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;font-size:13px">
        <div>📞 ${s.phone || '—'}</div>
        <div>📧 ${s.email || '—'}</div>
        <div>🏥 ${s.department || '—'}</div>
        <div>📅 Joined: ${UI.fmt.date(s.joinDate || s.createdAt)}</div>
      </div>
      <div style="margin-top:14px;display:flex;gap:8px">
        <button class="btn btn-sm btn-primary" onclick="openAddStaffModal('${s.id}')">Edit</button>
        <button class="btn btn-sm btn-danger" onclick="deleteStaffConfirm('${s.id}')">Delete</button>
      </div>
    </div>
  `).join('');
}

function openAddStaffModal(editId) {
  const s = editId ? DB.getStaff().find(x => x.id === editId) : null;
  const isEdit = !!s;
  UI.modal.open(isEdit ? 'Edit Staff' : 'Add Staff Member', `
    <div class="form-row">
      <div class="form-group"><label class="form-label">Full Name *</label>
        <input class="form-control" id="stName" value="${s?.name||''}" placeholder="Full name" /></div>
      <div class="form-group"><label class="form-label">Role</label>
        <select class="form-control" id="stRole">
          ${['Doctor','Nurse','Pharmacist','Receptionist','Lab Tech','Accountant','Driver','Other']
            .map(r=>`<option ${s?.role===r?'selected':''}>${r}</option>`).join('')}
        </select></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Phone</label>
        <input class="form-control" id="stPhone" value="${s?.phone||''}" placeholder="0712345678" /></div>
      <div class="form-group"><label class="form-label">Email</label>
        <input class="form-control" id="stEmail" value="${s?.email||''}" placeholder="email@example.com" /></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Department</label>
        <input class="form-control" id="stDept" value="${s?.department||''}" placeholder="e.g. OPD, Lab" /></div>
      <div class="form-group"><label class="form-label">Join Date</label>
        <input class="form-control" id="stJoin" type="date" value="${s?.joinDate||''}" /></div>
    </div>
    <div class="form-group"><label class="form-label">Qualifications</label>
      <textarea class="form-control" id="stQual">${s?.qualifications||''}</textarea></div>
    <div style="display:flex;justify-content:flex-end;gap:12px;margin-top:16px">
      <button class="btn btn-outline" onclick="UI.modal.close()">Cancel</button>
      <button class="btn btn-primary" onclick="${isEdit?`saveStaffEdit('${s.id}')`:'saveStaffNew()'}">
        ${isEdit?'Save Changes':'Add Staff'}
      </button>
    </div>
  `);
}

function saveStaffNew() {
  const name = document.getElementById('stName').value.trim();
  if (!name) { UI.toast('Name required', 'error'); return; }
  DB.addStaff({
    name, role: document.getElementById('stRole').value,
    phone: document.getElementById('stPhone').value,
    email: document.getElementById('stEmail').value,
    department: document.getElementById('stDept').value,
    joinDate: document.getElementById('stJoin').value,
    qualifications: document.getElementById('stQual').value
  });
  UI.modal.close();
  UI.toast('Staff added!', 'success');
  renderStaff();
}

function saveStaffEdit(id) {
  const name = document.getElementById('stName').value.trim();
  if (!name) { UI.toast('Name required', 'error'); return; }
  DB.updateStaff(id, {
    name, role: document.getElementById('stRole').value,
    phone: document.getElementById('stPhone').value,
    email: document.getElementById('stEmail').value,
    department: document.getElementById('stDept').value,
    joinDate: document.getElementById('stJoin').value,
    qualifications: document.getElementById('stQual').value
  });
  UI.modal.close();
  UI.toast('Staff updated!', 'success');
  renderStaff();
}

function deleteStaffConfirm(id) {
  if (!UI.confirm('Delete this staff member?')) return;
  DB.deleteStaff(id);
  UI.toast('Staff deleted', 'warning');
  renderStaff();
}

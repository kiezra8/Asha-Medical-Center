// ===== PATIENTS MODULE =====
let currentPatientId = null;

function renderPatients() {
  const patients = DB.getPatients();
  const el = document.getElementById('page-patients');
  el.innerHTML = `
    <div class="section-header">
      <div class="section-title">👥 Patient Records</div>
      <button class="btn btn-primary" onclick="openAddPatientModal()">+ New Patient</button>
    </div>
    <div class="search-bar">
      <div class="search-input-wrap">
        <span class="search-icon">🔍</span>
        <input type="text" id="patientSearch" placeholder="Search by name, phone, ID..." oninput="filterPatients()" />
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <label for="pDateFilter" style="font-size:12px;color:var(--text-secondary);white-space:nowrap">History Date:</label>
        <input type="date" class="form-control" id="pDateFilter" onchange="filterPatients()" style="width:140px" />
      </div>
      <select class="form-control" id="genderFilter" onchange="filterPatients()" style="width:110px">
        <option value="">Gender</option>
        <option value="Male">Male</option>
        <option value="Female">Female</option>
      </select>
      <button class="btn btn-outline" onclick="document.getElementById('pDateFilter').value='';document.getElementById('genderFilter').value='';filterPatients()">Clear</button>
    </div>
    <div class="grid-auto" id="patientGrid">
      ${patients.length === 0 ? UI.emptyState('No patients registered yet','👤') : ''}
    </div>
  `;
  renderPatientCards(patients);
}

function renderPatientCards(patients) {
  const grid = document.getElementById('patientGrid');
  if (!grid) return;
  if (patients.length === 0) { grid.innerHTML = UI.emptyState('No patients found','👤'); return; }
  grid.innerHTML = patients.map(p => `
    <div class="patient-card" onclick="openPatientDetail('${p.id}')">
      <div style="display:flex;gap:12px;align-items:center;margin-bottom:12px">
        <div class="patient-avatar">${UI.fmt.initials(p.name)}</div>
        <div class="patient-info">
          <div class="patient-name">${p.name}</div>
          <div class="patient-meta">${p.age ? p.age + ' yrs' : ''} · ${p.gender || '—'}</div>
        </div>
        <span class="badge badge-${p.gender==='Male'?'info':'secondary'}">${p.gender||'—'}</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:4px">
        <div style="font-size:12px;color:var(--text-secondary)">📞 ${p.phone || '—'}</div>
        <div style="font-size:12px;color:var(--text-secondary)">🩸 ${p.bloodGroup || '—'}</div>
        <div style="font-size:12px;color:var(--text-secondary)">📋 ${p.diagnoses?.length || 0} diagnoses · ${p.treatments?.length || 0} treatments</div>
      </div>
      <div style="margin-top:12px;display:flex;gap:8px">
        <button class="btn btn-sm btn-primary" onclick="event.stopPropagation();openPatientDetail('${p.id}')">View</button>
        <button class="btn btn-sm btn-outline" onclick="event.stopPropagation();openAddPatientModal('${p.id}')">Edit</button>
        <button class="btn btn-sm btn-danger" onclick="event.stopPropagation();deletePatientConfirm('${p.id}')">Delete</button>
      </div>
    </div>
  `).join('');
}

function filterPatients() {
  const q = document.getElementById('patientSearch')?.value.toLowerCase() || '';
  const g = document.getElementById('genderFilter')?.value || '';
  const dateFilter = document.getElementById('pDateFilter')?.value || '';
  const all = DB.getPatients();
  const filtered = all.filter(p => {
    const matchQ = !q || p.name?.toLowerCase().includes(q) || p.phone?.includes(q) || p.nationalID?.includes(q);
    const matchG = !g || p.gender === g;
    const matchDate = !dateFilter || p.createdAt?.startsWith(dateFilter);
    return matchQ && matchG && matchDate;
  });
  renderPatientCards(filtered);
}

function openAddPatientModal(editId) {
  const p = editId ? DB.getPatient(editId) : null;
  const isEdit = !!p;
  UI.modal.open(isEdit ? 'Edit Patient' : 'Register New Patient', `
    <div class="form-row">
      <div class="form-group"><label class="form-label">Full Name *</label>
        <input class="form-control" id="pName" value="${p?.name||''}" placeholder="Patient full name" /></div>
      <div class="form-group"><label class="form-label">Age</label>
        <input class="form-control" id="pAge" type="number" value="${p?.age||''}" placeholder="Age in years" /></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Gender</label>
        <select class="form-control" id="pGender">
          <option ${p?.gender==='Male'?'selected':''}>Male</option>
          <option ${p?.gender==='Female'?'selected':''}>Female</option>
          <option ${p?.gender==='Other'?'selected':''}>Other</option>
        </select></div>
      <div class="form-group"><label class="form-label">Blood Group</label>
        <select class="form-control" id="pBlood">
          ${['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(b=>`<option ${p?.bloodGroup===b?'selected':''}>${b}</option>`).join('')}
          <option ${!p?.bloodGroup?'selected':''} value="">Unknown</option>
        </select></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Phone Number</label>
        <input class="form-control" id="pPhone" value="${p?.phone||''}" placeholder="0712345678" /></div>
      <div class="form-group"><label class="form-label">National ID</label>
        <input class="form-control" id="pID" value="${p?.nationalID||''}" placeholder="ID Number" /></div>
    </div>
    <div class="form-group"><label class="form-label">Address</label>
      <input class="form-control" id="pAddress" value="${p?.address||''}" placeholder="Physical address" /></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Next of Kin</label>
        <input class="form-control" id="pNOK" value="${p?.nextOfKin||''}" placeholder="Name" /></div>
      <div class="form-group"><label class="form-label">Next of Kin Phone</label>
        <input class="form-control" id="pNOKPhone" value="${p?.nextOfKinPhone||''}" placeholder="0712345678" /></div>
    </div>
    <div class="form-group"><label class="form-label">Allergies</label>
      <input class="form-control" id="pAllergies" value="${p?.allergies||''}" placeholder="Known allergies" /></div>
    <div class="form-group"><label class="form-label">Medical History</label>
      <textarea class="form-control" id="pHistory" placeholder="Previous conditions, surgeries...">${p?.medicalHistory||''}</textarea></div>
    
    ${!isEdit ? `
    <div class="divider"></div>
    <div style="font-size:13px;font-weight:600;color:var(--text-secondary);margin-bottom:12px;text-transform:uppercase">Initial Billing</div>
    <div class="form-row" style="margin-bottom:12px">
      <div class="form-group"><label class="form-label">Total Bill Amount (UGX)</label>
        <input class="form-control" id="pBillTotal" type="number" step="1" min="0" placeholder="0" value="0" /></div>
      <div class="form-group"><label class="form-label">Amount Paid Now (UGX)</label>
        <input class="form-control" id="pBillPaid" type="number" step="1" min="0" placeholder="0" value="0" /></div>
    </div>
    ` : ''}
    
    <div class="divider"></div>
    <div style="display:flex;justify-content:flex-end;gap:12px">
      <button class="btn btn-outline" onclick="UI.modal.close()">Cancel</button>
      <button class="btn btn-primary" onclick="${isEdit ? `saveEditPatient('${editId}')` : 'saveNewPatient()'}">
        ${isEdit ? 'Save Changes' : 'Register Patient'}
      </button>
    </div>
  `);
}

function saveNewPatient() {
  const name = document.getElementById('pName').value.trim();
  if (!name) { UI.toast('Patient name is required', 'error'); return; }
  const p = DB.addPatient({
    name, age: document.getElementById('pAge').value,
    gender: document.getElementById('pGender').value,
    bloodGroup: document.getElementById('pBlood').value,
    phone: document.getElementById('pPhone').value,
    nationalID: document.getElementById('pID').value,
    address: document.getElementById('pAddress').value,
    nextOfKin: document.getElementById('pNOK').value,
    nextOfKinPhone: document.getElementById('pNOKPhone').value,
    allergies: document.getElementById('pAllergies').value,
    medicalHistory: document.getElementById('pHistory').value
  });
  
  // Create initial bill if provided
  const billTotal = parseFloat(document.getElementById('pBillTotal').value) || 0;
  if (billTotal > 0) {
    p.bills = [{
      id: Date.now().toString(),
      date: new Date().toISOString(),
      description: 'Initial Registration / Consultation',
      totalAmount: billTotal,
      amountPaid: Math.min(parseFloat(document.getElementById('pBillPaid').value) || 0, billTotal),
      notes: ''
    }];
    DB.updatePatient(p.id, { bills: p.bills });
  }

  UI.modal.close();
  UI.toast('Patient registered successfully!', 'success');
  renderPatients();
}

function saveEditPatient(id) {
  const name = document.getElementById('pName').value.trim();
  if (!name) { UI.toast('Patient name is required', 'error'); return; }
  DB.updatePatient(id, {
    name, age: document.getElementById('pAge').value,
    gender: document.getElementById('pGender').value,
    bloodGroup: document.getElementById('pBlood').value,
    phone: document.getElementById('pPhone').value,
    nationalID: document.getElementById('pID').value,
    address: document.getElementById('pAddress').value,
    nextOfKin: document.getElementById('pNOK').value,
    nextOfKinPhone: document.getElementById('pNOKPhone').value,
    allergies: document.getElementById('pAllergies').value,
    medicalHistory: document.getElementById('pHistory').value
  });
  UI.modal.close();
  UI.toast('Patient updated!', 'success');
  renderPatients();
}

function deletePatientConfirm(id) {
  if (UI.confirm('Delete this patient? This cannot be undone.')) {
    DB.deletePatient(id);
    UI.toast('Patient deleted', 'warning');
    renderPatients();
  }
}

function openPatientDetail(id) {
  const p = DB.getPatient(id);
  if (!p) return;
  currentPatientId = id;
  // Compute billing summary for badge
  const bills = p.bills || [];
  const totalOwed = bills.reduce((s,b) => s + Math.max(0,(b.totalAmount||0)-(b.amountPaid||0)), 0);
  const body = `
    <div style="display:flex;gap:20px;align-items:center;margin-bottom:20px">
      <div class="patient-avatar" style="width:64px;height:64px;font-size:24px">${UI.fmt.initials(p.name)}</div>
      <div style="flex:1">
        <div style="font-size:20px;font-weight:700">${p.name}</div>
        <div style="color:var(--text-secondary)">${p.age ? p.age + ' yrs' : ''}${p.gender ? ' · ' + p.gender : ''} · ${p.bloodGroup || 'Unknown'}</div>
        <div style="font-size:12px;color:var(--text-muted)">Registered: ${UI.fmt.date(p.createdAt)}</div>
      </div>
      ${totalOwed > 0 ? `<div style="background:rgba(230,57,70,0.15);border:1px solid rgba(230,57,70,0.4);border-radius:var(--radius-sm);padding:8px 14px;text-align:center">
        <div style="font-size:11px;color:var(--danger)">BALANCE DUE</div>
        <div style="font-size:18px;font-weight:800;color:var(--danger)">${UI.fmt.currency(totalOwed)}</div>
      </div>` : ''}
    </div>
    <div class="tabs" id="patientTabs">
      <button class="tab-btn active" onclick="switchPatientTab('info')">Info</button>
      <button class="tab-btn" onclick="switchPatientTab('billing')">💰 Billing${totalOwed > 0 ? ' 🔴' : ''}</button>
      <button class="tab-btn" onclick="switchPatientTab('diagnoses')">Diagnoses</button>
      <button class="tab-btn" onclick="switchPatientTab('treatments')">Treatments</button>
      <button class="tab-btn" onclick="switchPatientTab('prescriptions')">Prescriptions</button>
      <button class="tab-btn" onclick="switchPatientTab('visits')">Visits</button>
    </div>
    <div id="patientTabContent"></div>
  `;
  UI.modal.open(p.name + ' — Patient Record', body, true);
  switchPatientTab('info');
}

function switchPatientTab(tab) {
  const tabs = ['info','billing','diagnoses','treatments','prescriptions','visits'];
  document.querySelectorAll('#patientTabs .tab-btn').forEach((b, i) => {
    b.classList.toggle('active', tabs[i] === tab);
  });
  const p = DB.getPatient(currentPatientId);
  const el = document.getElementById('patientTabContent');
  if (!el || !p) return;

  if (tab === 'info') {
    el.innerHTML = `
      <div class="grid-2">
        <div>
          ${infoRow('Phone', p.phone)} ${infoRow('National ID', p.nationalID)}
          ${infoRow('Address', p.address)} ${infoRow('Next of Kin', p.nextOfKin)}
          ${infoRow('NOK Phone', p.nextOfKinPhone)}
        </div>
        <div>
          ${infoRow('Allergies', p.allergies || 'None', p.allergies ? 'var(--warning)' : null)}
          ${infoRow('Medical History', p.medicalHistory)}
        </div>
      </div>`;

  } else if (tab === 'billing') {
    const bills = p.bills || [];
    const totalBilled = bills.reduce((s,b) => s + (b.totalAmount||0), 0);
    const totalPaid   = bills.reduce((s,b) => s + (b.amountPaid||0), 0);
    const totalOwed   = totalBilled - totalPaid;
    el.innerHTML = `
      <!-- Summary row -->
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px">
        <div style="background:var(--bg-card2);border-radius:var(--radius-sm);padding:14px;border:1px solid var(--border);text-align:center">
          <div style="font-size:11px;color:var(--text-secondary);margin-bottom:4px">TOTAL BILLED</div>
          <div style="font-size:20px;font-weight:800;color:var(--primary)">${UI.fmt.currency(totalBilled)}</div>
        </div>
        <div style="background:var(--bg-card2);border-radius:var(--radius-sm);padding:14px;border:1px solid var(--border);text-align:center">
          <div style="font-size:11px;color:var(--text-secondary);margin-bottom:4px">AMOUNT PAID</div>
          <div style="font-size:20px;font-weight:800;color:var(--accent)">${UI.fmt.currency(totalPaid)}</div>
        </div>
        <div style="background:${totalOwed>0?'rgba(230,57,70,0.12)':'var(--bg-card2)'};border-radius:var(--radius-sm);padding:14px;border:1px solid ${totalOwed>0?'rgba(230,57,70,0.4)':'var(--border)'};text-align:center">
          <div style="font-size:11px;color:${totalOwed>0?'var(--danger)':'var(--text-secondary)'};margin-bottom:4px">BALANCE DUE</div>
          <div style="font-size:20px;font-weight:800;color:${totalOwed>0?'var(--danger)':'var(--accent)'}">${UI.fmt.currency(totalOwed)}</div>
        </div>
      </div>
      <div class="section-header"><span></span>
        <div style="display:flex;gap:8px">
          ${totalOwed > 0 ? `<button class="btn btn-sm btn-outline" onclick="waShareStatement()" style="color:#25D366;border-color:#25D366" title="Send Account Statement">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.298-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
            Send WhatsApp Statement
          </button>` : ''}
          <button class="btn btn-sm btn-primary" onclick="addBill()">+ Add Bill</button>
        </div>
      </div>
      ${bills.length === 0 ? UI.emptyState('No bills recorded for this patient','💰') :
        `<div class="table-wrap"><table>
          <thead><tr><th>Date</th><th>Description</th><th>Bill Amount</th><th>Paid</th><th>Balance</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
          ${bills.map(b => {
            const balance = (b.totalAmount||0) - (b.amountPaid||0);
            const isPaid = balance <= 0;
            return `<tr style="${!isPaid?'background:rgba(230,57,70,0.04)':''}">
              <td style="font-size:12px">${UI.fmt.date(b.date)}</td>
              <td>${b.description||'—'}</td>
              <td style="font-weight:600">${UI.fmt.currency(b.totalAmount||0)}</td>
              <td style="color:var(--accent);font-weight:600">${UI.fmt.currency(b.amountPaid||0)}</td>
              <td style="font-weight:800;color:${isPaid?'var(--accent)':'var(--danger)'}">${UI.fmt.currency(balance)}<br><span style="font-size:10px">${!isPaid?'⚠ Still Owed':''}</span></td>
              <td>${UI.badge(isPaid?'Paid':'Unpaid', isPaid?'success':'danger')}</td>
              <td>
                <div style="display:flex;gap:4px">
                  <button class="btn btn-xs btn-outline" onclick="waShareBill('${b.id}')" style="color:#25D366;border-color:#25D366;display:flex;align-items:center;gap:4px" title="WhatsApp Share"><svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.298-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg> WA</button>
                  ${!isPaid ?`<button class="btn btn-xs btn-accent" onclick="recordPayment('${b.id}')">Pay</button>`:''}
                  <button class="btn btn-xs btn-danger" onclick="deleteBill('${b.id}')">Del</button>
                </div>
              </td>
            </tr>`;
          }).join('')}
          </tbody></table></div>`}
    `;

  } else if (tab === 'diagnoses') {
    el.innerHTML = `
      <div class="section-header"><span></span>
        <button class="btn btn-sm btn-primary" onclick="addDiagnosis()">+ Add Diagnosis</button>
      </div>
      ${(!p.diagnoses || p.diagnoses.length === 0) ? UI.emptyState('No diagnoses recorded','🩺') :
        `<div class="timeline">${p.diagnoses.map(d => `
          <div class="timeline-item">
            <div class="timeline-dot"></div>
            <div class="timeline-content">
              <div class="timeline-date">${UI.fmt.datetime(d.date)} — Dr. ${d.doctor || '—'}</div>
              <div class="timeline-text" style="font-weight:600">${d.diagnosis}</div>
              ${d.notes ? `<div style="font-size:12px;color:var(--text-secondary);margin-top:4px">${d.notes}</div>` : ''}
              <div style="margin-top:8px;display:flex;gap:6px">
                <button class="btn btn-xs btn-danger" onclick="deleteDiagnosis('${d.id}')">Delete</button>
              </div>
            </div>
          </div>`).join('')}</div>`}`;
  } else if (tab === 'treatments') {
    el.innerHTML = `
      <div class="section-header"><span></span>
        <button class="btn btn-sm btn-primary" onclick="addTreatment()">+ Add Treatment</button>
      </div>
      ${(!p.treatments || p.treatments.length === 0) ? UI.emptyState('No treatments recorded','💉') :
        `<div class="timeline">${p.treatments.map(t => `
          <div class="timeline-item">
            <div class="timeline-dot" style="background:${t.status==='completed'?'var(--accent)':'var(--warning)'}"></div>
            <div class="timeline-content">
              <div class="timeline-date">${UI.fmt.date(t.date)} ${UI.badge(t.status||'ongoing', t.status==='completed'?'success':'warning')}</div>
              <div class="timeline-text" style="font-weight:600">${t.treatment}</div>
              ${t.notes ? `<div style="font-size:12px;color:var(--text-secondary);margin-top:4px">${t.notes}</div>` : ''}
              <div style="margin-top:8px;display:flex;gap:6px">
                ${t.status!=='completed'?`<button class="btn btn-xs btn-accent" onclick="markTreatmentComplete('${t.id}')">Mark Complete</button>`:''}
                <button class="btn btn-xs btn-danger" onclick="deleteTreatment('${t.id}')">Delete</button>
              </div>
            </div>
          </div>`).join('')}</div>`}`;
  } else if (tab === 'prescriptions') {
    el.innerHTML = `
      <div class="section-header"><span></span>
        <button class="btn btn-sm btn-primary" onclick="addPrescription()">+ Add Prescription</button>
      </div>
      ${(!p.prescriptions || p.prescriptions.length === 0) ? UI.emptyState('No prescriptions recorded','📄') :
        `<div class="table-wrap"><table><thead><tr><th>Date</th><th>Drug</th><th>Dosage</th><th>Duration</th><th>Doctor</th></tr></thead><tbody>
        ${p.prescriptions.map(rx => `<tr><td>${UI.fmt.date(rx.date)}</td><td>${rx.drug}</td><td>${rx.dosage}</td><td>${rx.duration}</td><td>${rx.doctor||'—'}</td></tr>`).join('')}
        </tbody></table></div>`}`;
  } else if (tab === 'visits') {
    el.innerHTML = `
      <div class="section-header"><span></span>
        <button class="btn btn-sm btn-primary" onclick="addVisit()">+ Record Visit</button>
      </div>
      ${(!p.visits || p.visits.length === 0) ? UI.emptyState('No visits recorded','📅') :
        `<div class="timeline">${p.visits.map(v => `
          <div class="timeline-item"><div class="timeline-dot"></div>
          <div class="timeline-content">
            <div class="timeline-date">${UI.fmt.datetime(v.date)}</div>
            <div class="timeline-text">${v.reason}</div>
            ${v.notes ? `<div style="font-size:12px;color:var(--text-secondary);margin-top:4px">${v.notes}</div>` : ''}
          </div></div>`).join('')}</div>`}`;
  }
}

function infoRow(label, value, color) {
  return `<div class="info-row"><span class="info-label">${label}</span>
    <span class="info-value" style="${color?'color:'+color:''}">${value || '—'}</span></div>`;
}

function addDiagnosis() {
  const settings = DB.getSettings();
  const html = `
    <div class="form-group"><label class="form-label">Diagnosis *</label>
      <input class="form-control" id="dxDiagnosis" placeholder="e.g. Malaria, Hypertension" /></div>
    <div class="form-group"><label class="form-label">Notes / Symptoms</label>
      <textarea class="form-control" id="dxNotes" placeholder="Symptom details, test results..."></textarea></div>
    <div class="form-group"><label class="form-label">Doctor</label>
      <input class="form-control" id="dxDoctor" value="${settings.doctorName||''}" /></div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px">
      <button class="btn btn-outline" onclick="UI.modal.close();openPatientDetail('${currentPatientId}')">Cancel</button>
      <button class="btn btn-primary" onclick="saveDiagnosis()">Save</button>
    </div>`;
  UI.modal.open('Add Diagnosis', html);
}

function saveDiagnosis() {
  const diagnosis = document.getElementById('dxDiagnosis').value.trim();
  if (!diagnosis) { UI.toast('Diagnosis is required', 'error'); return; }
  const p = DB.getPatient(currentPatientId);
  const diagList = p.diagnoses || [];
  diagList.unshift({ id: Date.now().toString(), date: new Date().toISOString(),
    diagnosis, notes: document.getElementById('dxNotes').value, doctor: document.getElementById('dxDoctor').value });
  DB.updatePatient(currentPatientId, { diagnoses: diagList });
  UI.toast('Diagnosis saved!', 'success');
  openPatientDetail(currentPatientId);
  switchPatientTab('diagnoses');
}

function deleteDiagnosis(dxId) {
  if (!UI.confirm('Delete this diagnosis?')) return;
  const p = DB.getPatient(currentPatientId);
  DB.updatePatient(currentPatientId, { diagnoses: (p.diagnoses || []).filter(d => d.id !== dxId) });
  UI.toast('Deleted', 'warning');
  openPatientDetail(currentPatientId);
  switchPatientTab('diagnoses');
}

function addTreatment() {
  const html = `
    <div class="form-group"><label class="form-label">Treatment Plan *</label>
      <input class="form-control" id="txTreatment" placeholder="e.g. Amoxicillin 500mg TDS x 7 days" /></div>
    <div class="form-group"><label class="form-label">Notes</label>
      <textarea class="form-control" id="txNotes" placeholder="Additional instructions..."></textarea></div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px">
      <button class="btn btn-outline" onclick="UI.modal.close();openPatientDetail('${currentPatientId}')">Cancel</button>
      <button class="btn btn-primary" onclick="saveTreatment()">Save</button>
    </div>`;
  UI.modal.open('Add Treatment', html);
}

function saveTreatment() {
  const treatment = document.getElementById('txTreatment').value.trim();
  if (!treatment) { UI.toast('Treatment is required', 'error'); return; }
  const p = DB.getPatient(currentPatientId);
  const list = p.treatments || [];
  list.unshift({ id: Date.now().toString(), date: new Date().toISOString(),
    treatment, notes: document.getElementById('txNotes').value, status: 'ongoing' });
  DB.updatePatient(currentPatientId, { treatments: list });
  UI.toast('Treatment plan saved!', 'success');
  openPatientDetail(currentPatientId);
  switchPatientTab('treatments');
}

function markTreatmentComplete(txId) {
  const p = DB.getPatient(currentPatientId);
  const list = (p.treatments || []).map(t => t.id === txId ? { ...t, status: 'completed' } : t);
  DB.updatePatient(currentPatientId, { treatments: list });
  UI.toast('Marked as complete!', 'success');
  openPatientDetail(currentPatientId);
  switchPatientTab('treatments');
}

function deleteTreatment(txId) {
  if (!UI.confirm('Delete this treatment?')) return;
  const p = DB.getPatient(currentPatientId);
  DB.updatePatient(currentPatientId, { treatments: (p.treatments || []).filter(t => t.id !== txId) });
  UI.toast('Deleted', 'warning');
  openPatientDetail(currentPatientId);
  switchPatientTab('treatments');
}

function addPrescription() {
  const drugs = DB.getDrugs();
  const settings = DB.getSettings();
  const html = `
    <div class="form-group"><label class="form-label">Drug *</label>
      <input class="form-control" id="rxDrug" list="rxDrugList" placeholder="Drug name" />
      <datalist id="rxDrugList">${drugs.map(d=>`<option value="${d.name}">`).join('')}</datalist></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Dosage *</label>
        <input class="form-control" id="rxDosage" placeholder="e.g. 500mg TDS" /></div>
      <div class="form-group"><label class="form-label">Duration</label>
        <input class="form-control" id="rxDuration" placeholder="e.g. 7 days" /></div>
    </div>
    <div class="form-group"><label class="form-label">Doctor</label>
      <input class="form-control" id="rxDoctor" value="${settings.doctorName||''}" /></div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px">
      <button class="btn btn-outline" onclick="UI.modal.close();openPatientDetail('${currentPatientId}')">Cancel</button>
      <button class="btn btn-primary" onclick="savePrescription()">Save</button>
    </div>`;
  UI.modal.open('Add Prescription', html);
}

function savePrescription() {
  const drug = document.getElementById('rxDrug').value.trim();
  if (!drug) { UI.toast('Drug name is required', 'error'); return; }
  const p = DB.getPatient(currentPatientId);
  const list = p.prescriptions || [];
  list.unshift({ id: Date.now().toString(), date: new Date().toISOString(),
    drug, dosage: document.getElementById('rxDosage').value,
    duration: document.getElementById('rxDuration').value,
    doctor: document.getElementById('rxDoctor').value });
  DB.updatePatient(currentPatientId, { prescriptions: list });
  UI.toast('Prescription saved!', 'success');
  openPatientDetail(currentPatientId);
  switchPatientTab('prescriptions');
}

function addVisit() {
  const html = `
    <div class="form-group"><label class="form-label">Reason for Visit *</label>
      <input class="form-control" id="vReason" placeholder="e.g. Follow-up, Fever, Checkup" /></div>
    <div class="form-group"><label class="form-label">Notes</label>
      <textarea class="form-control" id="vNotes" placeholder="Consultation notes..."></textarea></div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px">
      <button class="btn btn-outline" onclick="UI.modal.close();openPatientDetail('${currentPatientId}')">Cancel</button>
      <button class="btn btn-primary" onclick="saveVisit()">Record</button>
    </div>`;
  UI.modal.open('Record Visit', html);
}

function saveVisit() {
  const reason = document.getElementById('vReason').value.trim();
  if (!reason) { UI.toast('Reason is required', 'error'); return; }
  const p = DB.getPatient(currentPatientId);
  const list = p.visits || [];
  list.unshift({ id: Date.now().toString(), date: new Date().toISOString(),
    reason, notes: document.getElementById('vNotes').value });
  DB.updatePatient(currentPatientId, { visits: list });
  UI.toast('Visit recorded!', 'success');
  openPatientDetail(currentPatientId);
  switchPatientTab('visits');
}

// ===== BILLING FUNCTIONS =====
function addBill() {
  UI.modal.open('Add Bill', `
    <div class="form-group"><label class="form-label">Description *</label>
      <input class="form-control" id="billDesc" placeholder="e.g. Consultation, Lab tests, Medication" /></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Total Bill Amount (UGX) *</label>
        <input class="form-control" id="billTotal" type="number" step="1" min="0" placeholder="0" /></div>
      <div class="form-group"><label class="form-label">Amount Paid Now (UGX)</label>
        <input class="form-control" id="billPaid" type="number" step="1" min="0" placeholder="0" value="0" /></div>
    </div>
    <div class="form-group"><label class="form-label">Notes</label>
      <textarea class="form-control" id="billNotes" placeholder="Additional details..."></textarea></div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px">
      <button class="btn btn-outline" onclick="UI.modal.close();openPatientDetail('${currentPatientId}')">Cancel</button>
      <button class="btn btn-primary" onclick="saveBill()">Save Bill</button>
    </div>
  `);
}

function saveBill() {
  const desc = document.getElementById('billDesc').value.trim();
  const totalAmount = parseFloat(document.getElementById('billTotal').value) || 0;
  if (!desc) { UI.toast('Description required', 'error'); return; }
  if (totalAmount <= 0) { UI.toast('Enter a valid total amount', 'error'); return; }
  const amountPaid = Math.min(parseFloat(document.getElementById('billPaid').value) || 0, totalAmount);
  const p = DB.getPatient(currentPatientId);
  const list = p.bills || [];
  list.unshift({
    id: Date.now().toString(),
    date: new Date().toISOString(),
    description: desc,
    totalAmount,
    amountPaid,
    notes: document.getElementById('billNotes').value
  });
  DB.updatePatient(currentPatientId, { bills: list });
  UI.toast('Bill saved!', 'success');
  openPatientDetail(currentPatientId);
  switchPatientTab('billing');
}

function recordPayment(billId) {
  const p = DB.getPatient(currentPatientId);
  const bill = (p.bills || []).find(b => b.id === billId);
  if (!bill) return;
  const balance = (bill.totalAmount || 0) - (bill.amountPaid || 0);
  UI.modal.open('Record Payment', `
    <div style="margin-bottom:16px">
      <div style="font-size:12px;color:var(--text-secondary)">Outstanding Balance</div>
      <div style="font-size:28px;font-weight:800;color:var(--danger)">${UI.fmt.currency(balance)}</div>
      <div style="font-size:12px;color:var(--text-muted)">for: ${bill.description}</div>
    </div>
    <div class="form-group"><label class="form-label">Amount Being Paid (UGX) *</label>
      <input class="form-control" id="payAmount" type="number" step="1" min="1" max="${balance}" value="${balance}" placeholder="Amount" /></div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px">
      <button class="btn btn-outline" onclick="UI.modal.close();openPatientDetail('${currentPatientId}')">Cancel</button>
      <button class="btn btn-accent" onclick="savePayment('${billId}')">Confirm Payment</button>
    </div>
  `);
}

function savePayment(billId) {
  const amount = parseFloat(document.getElementById('payAmount').value) || 0;
  if (amount <= 0) { UI.toast('Enter a valid amount', 'error'); return; }
  const p = DB.getPatient(currentPatientId);
  const bills = (p.bills || []).map(b => {
    if (b.id !== billId) return b;
    const newPaid = Math.min((b.amountPaid || 0) + amount, b.totalAmount);
    return { ...b, amountPaid: newPaid };
  });
  DB.updatePatient(currentPatientId, { bills });
  UI.toast('Payment recorded!', 'success');
  openPatientDetail(currentPatientId);
  switchPatientTab('billing');
}

function deleteBill(billId) {
  if (!UI.confirm('Delete this bill?')) return;
  const p = DB.getPatient(currentPatientId);
  DB.updatePatient(currentPatientId, { bills: (p.bills || []).filter(b => b.id !== billId) });
  UI.toast('Bill deleted', 'warning');
  openPatientDetail(currentPatientId);
  switchPatientTab('billing');
}

function waShareBill(billId) {
  const p = DB.getPatient(currentPatientId);
  if (!p) return;
  const bill = (p.bills || []).find(b => b.id === billId);
  if (!bill) return;

  const settings = DB.getSettings();
  const balance = (bill.totalAmount || 0) - (bill.amountPaid || 0);

  let text = `*${settings.clinicName}*\n`;
  text += `Medical Bill for ${p.name}\n`;
  text += `Date: ${UI.fmt.date(bill.date)}\n`;
  text += `Description: ${bill.description}\n\n`;
  text += `Total Bill: ${UI.fmt.currency(bill.totalAmount || 0)}\n`;
  text += `Amount Paid: ${UI.fmt.currency(bill.amountPaid || 0)}\n`;
  text += `*Balance Due: ${UI.fmt.currency(balance)}*\n`;

  let phone = '';
  if (p.phone) {
     phone = p.phone;
     if (phone.startsWith('0')) phone = '+256' + phone.substring(1);
     phone = phone.replace(/[^\d+]/g, '');
  }

  const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}

function waShareStatement() {
  const p = DB.getPatient(currentPatientId);
  if (!p) return;
  
  if (typeof html2pdf === 'undefined') {
    UI.toast('PDF generator is loading... Please wait.', 'warning');
    return;
  }
  
  const bills = p.bills || [];
  const totalBilled = bills.reduce((s,b) => s + (b.totalAmount||0), 0);
  const totalPaid   = bills.reduce((s,b) => s + (b.amountPaid||0), 0);
  const balance     = totalBilled - totalPaid;
  const settings    = DB.getSettings();

  const unpaidBills = bills.filter(b => (b.totalAmount || 0) - (b.amountPaid || 0) > 0);
  let breakDownHtml = '';
  if (unpaidBills.length > 0) {
    breakDownHtml = `
      <div style="margin-top:20px;text-align:left">
        <div style="font-weight:700;margin-bottom:8px;font-size:14px;border-bottom:1px solid #ccc;padding-bottom:4px">Pending Breakdown:</div>
        <table style="width:100%;font-size:12px;text-align:left;border-collapse:collapse">
          <thead>
            <tr style="border-bottom:1px solid #eee"><th>Date</th><th>Description</th><th style="text-align:right">Balance due</th></tr>
          </thead>
          <tbody>
            ${unpaidBills.map(b => `<tr>
              <td style="padding:4px 0">${UI.fmt.date(b.date)}</td>
              <td>${b.description}</td>
              <td style="text-align:right">${UI.fmt.currency((b.totalAmount||0) - (b.amountPaid||0))}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // Create temporary container for PDF rendering
  const tempDiv = document.createElement('div');
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.style.top = '0';
  document.body.appendChild(tempDiv);

  tempDiv.innerHTML = `
    <div style="background:#fff; color:#000; padding:30px; width:400px; font-family:sans-serif">
      <div style="text-align:center;margin-bottom:16px">
        <div style="font-size:24px;font-weight:800;color:#000">${settings.clinicName}</div>
        <div style="font-size:12px;color:#444">${settings.address || ''} ${settings.phone ? '· Tel: '+settings.phone : ''}</div>
        <div style="margin:16px 0; border-bottom:2px dashed #ccc"></div>
        <div style="font-size:16px;font-weight:700;text-transform:uppercase">Account Statement</div>
        <div style="font-size:12px;color:#666;margin-top:4px">Date: ${UI.fmt.date(new Date().toISOString())}</div>
      </div>
      <div style="font-size:14px; margin-bottom: 20px">
        <strong>Patient Name:</strong> ${p.name}<br>
        <strong>Patient ID:</strong> ${p.id.substring(0,8).toUpperCase()}<br>
      </div>
      <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:14px;">
        <span>Total Billed:</span>
        <span style="font-weight:600">${UI.fmt.currency(totalBilled)}</span>
      </div>
      <div style="display:flex; justify-content:space-between; margin-bottom:16px; font-size:14px;">
        <span>Total Paid:</span>
        <span style="font-weight:600; color:green">${UI.fmt.currency(totalPaid)}</span>
      </div>
      <div style="display:flex; justify-content:space-between; font-size:18px; font-weight:800; padding:12px 0; border-top:2px solid #000; border-bottom:2px solid #000">
        <span>BALANCE DUE:</span>
        <span>${UI.fmt.currency(balance)}</span>
      </div>
      ${breakDownHtml}
      <div style="margin-top:40px; text-align:center; font-size:12px; color:#666">
        Thank you for choosing ${settings.clinicName}.
      </div>
    </div>
  `;

  let phone = '';
  if (p.phone) {
     phone = p.phone;
     if (phone.startsWith('0')) phone = '+256' + phone.substring(1);
     phone = phone.replace(/[^\d+]/g, '');
  }

  const filename = `statement_${p.name.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
  const textMsg = `Account Statement for ${p.name} from ${settings.clinicName}`;
  
  UI.toast('Generating PDF...', 'info');

  html2pdf().set({
    margin: [10, 10, 10, 10],
    filename: filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a5', orientation: 'portrait' }
  }).from(tempDiv.firstElementChild).output('blob').then(function(blob) {
      document.body.removeChild(tempDiv);
      const file = new File([blob], filename, { type: 'application/pdf' });
      
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
          navigator.share({ title: 'Account Statement', text: textMsg, files: [file] })
          .catch(err => downloadAndOpenWAPatient(blob, filename, phone, textMsg));
      } else {
          downloadAndOpenWAPatient(blob, filename, phone, `Attached is your account statement.`);
      }
  });
}

function downloadAndOpenWAPatient(blob, filename, phone, textMsg) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    UI.toast('Statement downloaded. Opening WhatsApp...', 'success');
    setTimeout(() => {
       const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(textMsg)}`;
       window.open(waUrl, '_blank');
    }, 1500);
}

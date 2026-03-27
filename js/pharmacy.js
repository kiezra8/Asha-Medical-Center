// ===== PHARMACY / INVENTORY MODULE =====
function renderPharmacy() {
  const drugs = DB.getDrugs();
  const lowStock = drugs.filter(d => d.quantity <= (d.minStock || 10));
  const el = document.getElementById('page-pharmacy');
  el.innerHTML = `
    <div class="section-header">
      <div class="section-title">💊 Pharmacy & Inventory</div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-outline" onclick="exportInventory()">📥 Export</button>
        <button class="btn btn-primary" onclick="openAddDrugModal()">+ Add Drug</button>
      </div>
    </div>
    ${lowStock.length > 0 ? `<div style="background:rgba(230,57,70,0.1);border:1px solid rgba(230,57,70,0.3);border-radius:var(--radius-sm);padding:12px 16px;margin-bottom:16px;font-size:13px;color:var(--danger)">
      ⚠️ <strong>${lowStock.length} items</strong> are running low: ${lowStock.map(d=>d.name).join(', ')}
    </div>` : ''}
    <div class="search-bar">
      <div class="search-input-wrap">
        <span class="search-icon">🔍</span>
        <input type="text" id="drugSearch" placeholder="Search drugs..." oninput="filterDrugs()" />
      </div>
      <div style="position:relative">
        <input type="text" class="form-control" id="catFilter" list="catFilterList"
          placeholder="Filter by category..." oninput="filterDrugs()" style="width:180px" />
        <datalist id="catFilterList">
          <option value="">All</option>
          ${[...new Set(drugs.map(d=>d.category).filter(Boolean))].map(c=>`<option value="${c}">${c}</option>`).join('')}
        </datalist>
      </div>
      <select class="form-control" id="stockFilter" onchange="filterDrugs()" style="width:150px">
        <option value="">All Stock</option>
        <option value="low">Low Stock</option>
        <option value="out">Out of Stock</option>
        <option value="ok">In Stock</option>
      </select>
    </div>
    <div class="table-wrap">
      <table id="drugTable">
        <thead><tr>
          <th>Drug Name</th><th>Category</th><th>Stock (Unit)</th>
          <th>Sell Price</th><th>Cost Price</th><th>Expiry</th><th>Status</th><th>Actions</th>
        </tr></thead>
        <tbody id="drugTableBody"></tbody>
      </table>
    </div>
  `;
  renderDrugTable(drugs);
}

function renderDrugTable(drugs) {
  const tbody = document.getElementById('drugTableBody');
  if (!tbody) return;
  if (drugs.length === 0) { tbody.innerHTML = `<tr><td colspan="8">${UI.emptyState('No drugs found','💊')}</td></tr>`; return; }
  tbody.innerHTML = drugs.map(d => {
    const pct = d.minStock ? Math.min(100, Math.round((d.quantity / (d.minStock * 3)) * 100)) : 50;
    const color = UI.stockColor(d.quantity, d.minStock || 10);
    const status = d.quantity <= 0 ? 'Out of Stock' : d.quantity <= (d.minStock || 10) ? 'Low Stock' : 'In Stock';
    const badgeType = d.quantity <= 0 ? 'danger' : d.quantity <= (d.minStock || 10) ? 'warning' : 'success';
    return `<tr class="${d.quantity <= (d.minStock||10) ? 'low-stock-row' : ''}">
      <td>
        <div style="font-weight:600">${d.name}</div>
        <div style="font-size:11px;color:var(--text-muted)">${d.supplier || ''}</div>
        <div class="stock-bar"><div class="stock-bar-fill" style="width:${pct}%;background:${color}"></div></div>
      </td>
      <td><span class="badge badge-info">${d.category||'—'}</span></td>
      <td><span style="font-weight:700;color:${color}">${d.quantity}</span> <span style="font-size:11px;color:var(--text-muted)">${d.unit||''}</span></td>
      <td>${UI.fmt.currency(d.price)}</td>
      <td>${UI.fmt.currency(d.costPrice)}</td>
      <td style="font-size:12px">${d.expiry ? UI.fmt.date(d.expiry) : '—'}</td>
      <td>${UI.badge(status, badgeType)}</td>
      <td>
        <div style="display:flex;gap:4px">
          <button class="btn btn-xs btn-outline" onclick="openRestockModal('${d.id}')">Restock</button>
          <button class="btn btn-xs btn-primary" onclick="openAddDrugModal('${d.id}')">Edit</button>
          <button class="btn btn-xs btn-danger" onclick="deleteDrugConfirm('${d.id}')">Del</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

function filterDrugs() {
  const q = document.getElementById('drugSearch')?.value.toLowerCase() || '';
  const cat = document.getElementById('catFilter')?.value.toLowerCase() || '';
  const stock = document.getElementById('stockFilter')?.value || '';
  const all = DB.getDrugs().filter(d => {
    const matchQ = !q || d.name?.toLowerCase().includes(q) || d.category?.toLowerCase().includes(q);
    const matchCat = !cat || d.category?.toLowerCase().includes(cat);
    const matchStock = !stock ||
      (stock === 'low' && d.quantity > 0 && d.quantity <= (d.minStock || 10)) ||
      (stock === 'out' && d.quantity <= 0) ||
      (stock === 'ok' && d.quantity > (d.minStock || 10));
    return matchQ && matchCat && matchStock;
  });
  renderDrugTable(all);
}

function openAddDrugModal(editId) {
  const d = editId ? DB.getDrug(editId) : null;
  const isEdit = !!d;
  // Build category & unit lists from existing drugs (user-defined)
  const drugs = DB.getDrugs();
  const existingCats = [...new Set(drugs.map(x => x.category).filter(Boolean))];
  const existingUnits = [...new Set(drugs.map(x => x.unit).filter(Boolean))];
  UI.modal.open(isEdit ? 'Edit Drug' : 'Add New Drug', `
    <div class="form-group"><label class="form-label">Drug Name *</label>
      <input class="form-control" id="drName" value="${d?.name||''}" placeholder="e.g. Paracetamol 500mg" /></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Category</label>
        <input class="form-control" id="drCat" value="${d?.category||''}" list="catList" placeholder="Type your own category" />
        <datalist id="catList">${existingCats.map(c=>`<option>${c}</option>`).join('')}</datalist></div>
      <div class="form-group"><label class="form-label">Unit</label>
        <input class="form-control" id="drUnit" value="${d?.unit||''}" list="unitList" placeholder="e.g. Tablet, Bottle..." />
        <datalist id="unitList">${existingUnits.map(u=>`<option>${u}</option>`).join('')}</datalist></div>
    </div>
    <div class="form-row-3">
      <div class="form-group"><label class="form-label">Quantity</label>
        <input class="form-control" id="drQty" type="number" value="${d?.quantity||0}" min="0" /></div>
      <div class="form-group"><label class="form-label">Sell Price (UGX)</label>
        <input class="form-control" id="drPrice" type="number" step="1" value="${d?.price||0}" /></div>
      <div class="form-group"><label class="form-label">Cost Price (UGX)</label>
        <input class="form-control" id="drCost" type="number" step="1" value="${d?.costPrice||0}" /></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Min Stock Level</label>
        <input class="form-control" id="drMin" type="number" value="${d?.minStock||10}" /></div>
      <div class="form-group"><label class="form-label">Expiry Date</label>
        <input class="form-control" id="drExpiry" type="date" value="${d?.expiry||''}" /></div>
    </div>
    <div class="form-group"><label class="form-label">Supplier</label>
      <input class="form-control" id="drSupplier" value="${d?.supplier||''}" placeholder="Supplier name" /></div>
    <div style="display:flex;justify-content:flex-end;gap:12px;margin-top:16px">
      <button class="btn btn-outline" onclick="UI.modal.close()">Cancel</button>
      <button class="btn btn-primary" onclick="${isEdit ? `saveDrugEdit('${editId}')` : 'saveDrugNew()'}">
        ${isEdit ? 'Save Changes' : 'Add Drug'}
      </button>
    </div>
  `);
}

function saveDrugNew() {
  const name = document.getElementById('drName').value.trim();
  if (!name) { UI.toast('Drug name required', 'error'); return; }
  DB.addDrug({
    name, category: document.getElementById('drCat').value,
    unit: document.getElementById('drUnit').value,
    quantity: parseInt(document.getElementById('drQty').value) || 0,
    price: parseFloat(document.getElementById('drPrice').value) || 0,
    costPrice: parseFloat(document.getElementById('drCost').value) || 0,
    minStock: parseInt(document.getElementById('drMin').value) || 10,
    expiry: document.getElementById('drExpiry').value,
    supplier: document.getElementById('drSupplier').value
  });
  UI.modal.close();
  UI.toast('Drug added!', 'success');
  renderPharmacy();
}

function saveDrugEdit(id) {
  const name = document.getElementById('drName').value.trim();
  if (!name) { UI.toast('Drug name required', 'error'); return; }
  DB.updateDrug(id, {
    name, category: document.getElementById('drCat').value,
    unit: document.getElementById('drUnit').value,
    quantity: parseInt(document.getElementById('drQty').value) || 0,
    price: parseFloat(document.getElementById('drPrice').value) || 0,
    costPrice: parseFloat(document.getElementById('drCost').value) || 0,
    minStock: parseInt(document.getElementById('drMin').value) || 10,
    expiry: document.getElementById('drExpiry').value,
    supplier: document.getElementById('drSupplier').value
  });
  UI.modal.close();
  UI.toast('Drug updated!', 'success');
  renderPharmacy();
}

function openRestockModal(id) {
  const d = DB.getDrug(id);
  UI.modal.open('Restock: ' + d.name, `
    <div style="margin-bottom:16px">
      <div style="font-size:13px;color:var(--text-secondary)">Current Stock</div>
      <div style="font-size:32px;font-weight:800;color:${UI.stockColor(d.quantity,d.minStock||10)}">${d.quantity} ${d.unit||''}</div>
    </div>
    <div class="form-group"><label class="form-label">Add Quantity</label>
      <input class="form-control" id="restockQty" type="number" value="" min="1" placeholder="Number of units to add" /></div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">New Cost Price (optional)</label>
        <input class="form-control" id="restockCost" type="number" value="${d.costPrice||0}" /></div>
      <div class="form-group"><label class="form-label">New Sell Price (optional)</label>
        <input class="form-control" id="restockPrice" type="number" value="${d.price||0}" /></div>
    </div>
    <div class="form-group"><label class="form-label">New Expiry Date</label>
      <input class="form-control" id="restockExpiry" type="date" value="${d.expiry||''}" /></div>
    <div style="display:flex;justify-content:flex-end;gap:12px;margin-top:16px">
      <button class="btn btn-outline" onclick="UI.modal.close()">Cancel</button>
      <button class="btn btn-accent" onclick="saveRestock('${id}')">Restock</button>
    </div>
  `);
}

function saveRestock(id) {
  const qty = parseInt(document.getElementById('restockQty').value) || 0;
  if (qty <= 0) { UI.toast('Enter a valid quantity', 'error'); return; }
  const d = DB.getDrug(id);
  DB.updateDrug(id, {
    quantity: (d.quantity || 0) + qty,
    totalStocked: (d.totalStocked || d.quantity || 0) + qty,
    costPrice: parseFloat(document.getElementById('restockCost').value) || d.costPrice,
    price: parseFloat(document.getElementById('restockPrice').value) || d.price,
    expiry: document.getElementById('restockExpiry').value || d.expiry
  });
  UI.modal.close();
  UI.toast(`Restocked +${qty} units!`, 'success');
  renderPharmacy();
}

function deleteDrugConfirm(id) {
  if (!UI.confirm('Delete this drug from inventory?')) return;
  DB.deleteDrug(id);
  UI.toast('Drug deleted', 'warning');
  renderPharmacy();
}

function exportInventory() {
  const drugs = DB.getDrugs();
  let csv = 'Name,Category,Quantity,Unit,Sell Price,Cost Price,Min Stock,Expiry,Supplier\n';
  drugs.forEach(d => {
    csv += `"${d.name}","${d.category||''}",${d.quantity},"${d.unit||''}",${d.price},${d.costPrice||0},${d.minStock||10},"${d.expiry||''}","${d.supplier||''}"\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `asha_inventory_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  UI.toast('Inventory exported!', 'success');
}

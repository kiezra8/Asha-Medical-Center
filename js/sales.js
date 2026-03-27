// ===== SALES & BILLING MODULE =====
let saleItems = [];

function renderSales() {
  const sales = DB.getSales().slice().reverse();
  const todayRev = DB.totalRevenue(DB.getToday());
  const weekRev = DB.totalRevenue(DB.getThisWeek());
  const monthRev = DB.totalRevenue(DB.getThisMonth());
  const todayCount = DB.getToday().length;
  const weekCount = DB.getThisWeek().length;
  const monthCount = DB.getThisMonth().length;
  const el = document.getElementById('page-sales');
  el.innerHTML = `
    <div class="section-header">
      <div class="section-title">🛒 Sales & Billing</div>
      <button class="btn btn-primary" onclick="openNewSaleModal()">+ New Sale</button>
    </div>

    <div class="search-bar">
      <div class="search-input-wrap">
        <span class="search-icon">🔍</span>
        <input type="text" id="saleSearch" placeholder="Search by patient, payment method..." oninput="filterSales()" />
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <label for="saleDateFilter" style="font-size:12px;color:var(--text-secondary);white-space:nowrap">History Date:</label>
        <input type="date" class="form-control" id="saleDateFilter" onchange="filterSales()" style="width:140px" />
      </div>
      <button class="btn btn-outline" onclick="document.getElementById('saleDateFilter').value='';filterSales()">Clear</button>
      <button class="btn btn-outline" onclick="exportSales()">CSV</button>
      <button class="btn btn-primary" onclick="printSalesPDF()">🖨 Print / PDF</button>
    </div>

    <div class="table-wrap" id="salesPrintArea" style="margin-bottom:0;border-bottom-left-radius:0;border-bottom-right-radius:0">
      <div id="salesPrintHeader" style="display:none;text-align:center;margin-bottom:20px;">
        <h2 style="margin:0;color:#000">Sales History</h2>
        <p id="salesPrintDate" style="color:#444;margin:4px 0"></p>
      </div>
      <table>
        <thead><tr><th>Date & Time</th><th>Patient</th><th>Items</th><th>Total</th><th>Payment</th><th>Served By</th><th class="no-print">Actions</th></tr></thead>
        <tbody id="salesTableBody"></tbody>
      </table>
    </div>

    <!-- Period Totals Below Table -->
    <div id="salesTotalsBar" style="background:var(--bg-card2);border:1px solid var(--border);border-top:none;border-bottom-left-radius:var(--radius);border-bottom-right-radius:var(--radius);padding:16px 20px">
      <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:12px">Period Totals</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px">
        <div style="background:var(--bg-card);border-radius:var(--radius-sm);padding:14px;border:1px solid rgba(0,180,216,0.2)">
          <div style="font-size:11px;color:var(--text-secondary);margin-bottom:4px">📆 TODAY</div>
          <div style="font-size:20px;font-weight:800;color:var(--primary)">${UI.fmt.currency(todayRev)}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:4px">${todayCount} transaction${todayCount!==1?'s':''}</div>
        </div>
        <div style="background:var(--bg-card);border-radius:var(--radius-sm);padding:14px;border:1px solid rgba(244,162,97,0.2)">
          <div style="font-size:11px;color:var(--text-secondary);margin-bottom:4px">📅 THIS WEEK</div>
          <div style="font-size:20px;font-weight:800;color:var(--accent2)">${UI.fmt.currency(weekRev)}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:4px">${weekCount} transaction${weekCount!==1?'s':''}</div>
        </div>
        <div style="background:var(--bg-card);border-radius:var(--radius-sm);padding:14px;border:1px solid rgba(168,85,247,0.2)">
          <div style="font-size:11px;color:var(--text-secondary);margin-bottom:4px">📊 THIS MONTH</div>
          <div style="font-size:20px;font-weight:800;color:#a855f7">${UI.fmt.currency(monthRev)}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:4px">${monthCount} transaction${monthCount!==1?'s':''}</div>
        </div>
      </div>
    </div>
  `;
  renderSalesTable(sales);
}

function renderSalesTable(sales) {
  const tbody = document.getElementById('salesTableBody');
  if (!tbody) return;
  if (sales.length === 0) { tbody.innerHTML = `<tr><td colspan="7">${UI.emptyState('No sales recorded','🛒')}</td></tr>`; return; }
  tbody.innerHTML = sales.map(s => `
    <tr>
      <td>${UI.fmt.datetime(s.date)}</td>
      <td>${s.patientName || 'Walk-in'}</td>
      <td><span class="badge badge-info">${s.items?.length || 0} items</span></td>
      <td style="font-weight:700;color:var(--accent)">${UI.fmt.currency(s.total)}</td>
      <td>${UI.badge(s.paymentMethod || 'Cash', s.paymentMethod === 'M-Pesa' ? 'success' : s.paymentMethod === 'Insurance' ? 'info' : 'secondary')}</td>
      <td style="font-size:12px">${s.servedBy || '—'}</td>
      <td class="no-print">
        <div style="display:flex;gap:4px">
          <button class="btn btn-xs btn-outline" onclick="showReceipt('${s.id}')">🖨</button>
          <button class="btn btn-xs btn-primary" onclick="openNewSaleModal('${s.id}')">Edit</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function filterSales() {
  const q = document.getElementById('saleSearch')?.value.toLowerCase() || '';
  const dateFilter = document.getElementById('saleDateFilter')?.value || '';
  const all = DB.getSales().slice().reverse().filter(s => {
    const matchQ = !q || s.patientName?.toLowerCase().includes(q) || s.paymentMethod?.toLowerCase().includes(q);
    const matchDate = !dateFilter || s.date?.startsWith(dateFilter);
    return matchQ && matchDate;
  });
  renderSalesTable(all);
}

function openNewSaleModal(editId = null) {
  const existingSale = editId ? DB.getSales().find(s => s.id === editId) : null;
  saleItems = existingSale ? JSON.parse(JSON.stringify(existingSale.items || [])) : [];
  
  const drugs = DB.getDrugs();
  const patients = DB.getPatients();
  const settings = DB.getSettings();
  
  UI.modal.open(existingSale ? 'Edit Sale' : 'New Sale / Bill', `
    <div class="form-row">
      <div class="form-group"><label class="form-label">Patient Name</label>
        <input class="form-control" id="salePatient" list="salePatientList" placeholder="Patient name or Walk-in" value="${existingSale?.patientName || 'Walk-in'}" />
        <datalist id="salePatientList">${patients.map(p=>`<option value="${p.name}">`).join('')}</datalist></div>
      <div class="form-group"><label class="form-label">Payment Method</label>
        <select class="form-control" id="salePayment">
          <option ${existingSale?.paymentMethod==='Cash'?'selected':''}>Cash</option>
          <option ${existingSale?.paymentMethod==='M-Pesa'?'selected':''}>M-Pesa</option>
          <option ${existingSale?.paymentMethod==='Insurance'?'selected':''}>Insurance</option>
          <option ${existingSale?.paymentMethod==='Card'?'selected':''}>Card</option>
        </select></div>
    </div>
    <div class="form-group"><label class="form-label">Served By</label>
      <input class="form-control" id="saleServedBy" value="${existingSale?.servedBy || settings.doctorName || ''}" placeholder="Staff name" /></div>
    <div class="divider"></div>
    <div class="form-row" style="margin-bottom:12px">
      <div class="form-group" style="flex:2"><label class="form-label">Drug / Item Name</label>
        <input class="form-control" id="saleDrugName" list="saleDrugList" placeholder="Type drug name..." autocomplete="off" />
        <datalist id="saleDrugList">
          ${drugs.map(d=>`<option value="${d.name}" data-price="${d.price}" data-id="${d.id}" data-stock="${d.quantity}">${d.name} — Stock: ${d.quantity}</option>`).join('')}
        </datalist></div>
      <div class="form-group"><label class="form-label">Qty & Unit</label>
        <div style="display:flex;gap:4px">
          <input class="form-control" id="saleDrugQty" type="number" value="1" min="1" style="width:60px" />
          <select class="form-control" id="saleDrugUnit" style="flex:1">
            <option value="">(None)</option>
            <option value="Tablets">Tablets</option>
            <option value="Syrup">Syrup</option>
            <option value="Strip">Strip</option>
            <option value="Packets">Packets</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>
      <div class="form-group"><label class="form-label">Price (UGX)</label>
        <input class="form-control" id="saleDrugPrice" type="number" step="1" placeholder="Enter price" /></div>
    </div>
    <button class="btn btn-accent" style="margin-bottom:16px" onclick="addSaleItem()">+ Add Item</button>
    <div id="saleItemsTable">
      <div id="saleItemsList"></div>
      <div class="divider"></div>
      <div style="display:flex;justify-content:flex-end;align-items:center;gap:16px">
        <span style="font-size:13px;color:var(--text-secondary)">TOTAL</span>
        <span style="font-size:24px;font-weight:800;color:var(--accent)" id="saleTotalDisplay">UGX 0</span>
      </div>
    </div>
    <div class="divider"></div>
    <div style="display:flex;justify-content:flex-end;gap:12px">
      <button class="btn btn-outline" onclick="UI.modal.close()">Cancel</button>
      <button class="btn btn-primary" onclick="completeSale('${editId || ''}')">${existingSale ? 'Save Changes' : 'Complete Sale 💳'}</button>
    </div>
  `);
  // Auto-fill price when a known drug is typed
  document.getElementById('saleDrugName').addEventListener('input', function() {
    const typed = this.value.trim().toLowerCase();
    const match = drugs.find(d => d.name.toLowerCase() === typed);
    if (match) document.getElementById('saleDrugPrice').value = match.price;
  });
  renderSaleItems();
}

function addSaleItem() {
  const nameInput = document.getElementById('saleDrugName');
  const drugName = nameInput.value.trim();
  if (!drugName) { UI.toast('Enter a drug or item name', 'error'); return; }
  const qty = parseInt(document.getElementById('saleDrugQty').value) || 1;
  const price = parseFloat(document.getElementById('saleDrugPrice').value) || 0;
  if (price <= 0) { UI.toast('Enter a price greater than 0', 'error'); return; }
  const unit = document.getElementById('saleDrugUnit').value;
  const unitLabel = unit ? ` ${unit}` : '';
  
  // Check if drug is in inventory and validate stock
  const drugs = DB.getDrugs();
  const match = drugs.find(d => d.name.toLowerCase() === drugName.toLowerCase());
  if (match && qty > match.quantity) {
    UI.toast(`Only ${match.quantity} units of '${match.name}' in stock!`, 'error'); return;
  }
  const drugId = match ? match.id : 'manual_' + Date.now();
  const existing = saleItems.find(i => i.drugId === drugId && i.drugId !== 'manual_' + Date.now() && i.unitLabel === unitLabel);
  if (existing && match) {
    existing.qty += qty;
    existing.subtotal = existing.qty * existing.price;
  } else {
    saleItems.push({ drugId, drugName: drugName + unitLabel, qty, price, subtotal: qty * price, unitLabel });
  }
  // Clear inputs for next item
  nameInput.value = '';
  document.getElementById('saleDrugQty').value = '1';
  document.getElementById('saleDrugUnit').value = '';
  document.getElementById('saleDrugPrice').value = '';
  nameInput.focus();
  renderSaleItems();
}

function renderSaleItems() {
  const el = document.getElementById('saleItemsList');
  if (!el) return;
  const total = saleItems.reduce((s, i) => s + i.subtotal, 0);
  el.innerHTML = saleItems.length === 0 ? `<div style="text-align:center;color:var(--text-muted);padding:20px">No items added</div>` :
    `<div class="table-wrap"><table><thead><tr><th>Drug</th><th>Qty</th><th>Price</th><th>Subtotal</th><th></th></tr></thead><tbody>
      ${saleItems.map((i,idx) => `<tr>
        <td>${i.drugName}</td>
        <td><input type="number" value="${i.qty}" min="1" style="width:60px;background:var(--bg-dark);border:1px solid var(--border);border-radius:4px;padding:4px 6px;color:var(--text-primary)" onchange="updateSaleQty(${idx},this.value)" /></td>
        <td>${UI.fmt.currency(i.price)}</td>
        <td style="font-weight:600">${UI.fmt.currency(i.subtotal)}</td>
        <td><button class="btn btn-xs btn-danger" onclick="removeSaleItem(${idx})">✕</button></td>
      </tr>`).join('')}
    </tbody></table></div>`;
  const totalEl = document.getElementById('saleTotalDisplay');
  if (totalEl) totalEl.textContent = UI.fmt.currency(total);
}

function updateSaleQty(idx, val) {
  saleItems[idx].qty = parseInt(val) || 1;
  saleItems[idx].subtotal = saleItems[idx].qty * saleItems[idx].price;
  renderSaleItems();
}

function removeSaleItem(idx) {
  saleItems.splice(idx, 1);
  renderSaleItems();
}

function completeSale(editId = null) {
  if (saleItems.length === 0) { UI.toast('Add at least one item', 'error'); return; }
  const total = saleItems.reduce((s, i) => s + i.subtotal, 0);
  
  if (editId) {
    DB.updateSale(editId, {
      patientName: document.getElementById('salePatient').value || 'Walk-in',
      paymentMethod: document.getElementById('salePayment').value,
      servedBy: document.getElementById('saleServedBy').value,
      items: [...saleItems], total
    });
    UI.toast('Sale updated!', 'success');
  } else {
    const sale = DB.addSale({
      patientName: document.getElementById('salePatient').value || 'Walk-in',
      paymentMethod: document.getElementById('salePayment').value,
      servedBy: document.getElementById('saleServedBy').value,
      items: [...saleItems], total
    });
    editId = sale.id;
    UI.toast('Sale completed! ' + UI.fmt.currency(total), 'success');
  }
  
  UI.modal.close();
  saleItems = [];
  renderSales();
  if (!editId) showReceipt(editId); // Only show receipt on new sale
}

function showReceipt(saleId) {
  const s = DB.getSales().find(x => x.id === saleId);
  if (!s) return;
  const settings = DB.getSettings();
  UI.modal.open('Receipt', `
    <div style="text-align:center;margin-bottom:16px">
      <div style="font-size:20px;font-weight:800;color:var(--primary)">${settings.clinicName}</div>
      <div style="font-size:12px;color:var(--text-secondary)">${settings.address || ''} ${settings.phone ? '· Tel: '+settings.phone : ''}</div>
      <div class="divider"></div>
      <div style="font-size:12px;color:var(--text-secondary)">Receipt • ${UI.fmt.datetime(s.date)}</div>
    </div>
    <div class="table-wrap">
      <table><thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead><tbody>
      ${(s.items || []).map(i => `<tr><td>${i.drugName||i.drug||'Item'}</td><td>${i.qty}</td><td>${UI.fmt.currency(i.price)}</td><td>${UI.fmt.currency(i.subtotal)}</td></tr>`).join('')}
      </tbody></table>
    </div>
    <div class="divider"></div>
    <div style="display:flex;justify-content:space-between;font-size:18px;font-weight:800">
      <span>TOTAL</span><span style="color:var(--accent)">${UI.fmt.currency(s.total)}</span>
    </div>
    <div style="font-size:13px;color:var(--text-secondary);margin-top:8px">
      Patient: ${s.patientName || 'Walk-in'} · Payment: ${s.paymentMethod || 'Cash'} · Served by: ${s.servedBy || '—'}
    </div>
    <div class="divider"></div>
    <div style="text-align:center;font-size:12px;color:var(--text-muted)">Thank you for visiting ${settings.clinicName}!</div>
    <div style="display:flex;justify-content:center;margin-top:16px">
      <button class="btn btn-primary" onclick="printReceipt()">🖨 Print</button>
    </div>
  `);
  window._printReceipt = () => window.print();
}

function printReceipt() { window.print(); }

function exportSales() {
  const sales = DB.getSales();
  let csv = 'Date,Patient,Items,Total,Payment Method,Served By\n';
  sales.forEach(s => {
    const items = (s.items || []).map(i => `${i.drugName||''}x${i.qty}`).join('; ');
    csv += `"${UI.fmt.datetime(s.date)}","${s.patientName||'Walk-in'}","${items}",${s.total},"${s.paymentMethod||'Cash'}","${s.servedBy||''}"\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `asha_sales_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  UI.toast('Sales exported to CSV!', 'success');
}

function printSalesPDF() {
  const dateFilter = document.getElementById('saleDateFilter')?.value;
  const dateStr = dateFilter ? new Date(dateFilter).toLocaleDateString() : 'All Time';
  
  // Setup print header
  const header = document.getElementById('salesPrintHeader');
  if (header) {
    header.style.display = 'block';
    document.getElementById('salesPrintDate').textContent = 'Date: ' + dateStr;
  }
  
  // Add print class to body to hide sidebar and other pages
  document.body.classList.add('printing-sales');
  
  window.print();
  
  // Cleanup
  document.body.classList.remove('printing-sales');
  if (header) header.style.display = 'none';
}

// ===== LOCAL DATABASE (localStorage) =====
// Clear any old seeded data from previous version
(function clearOldSeedData(){
  // Remove demo/seeded data if it exists from a previous session
  const marker = localStorage.getItem('asha_v2_clean');
  if (!marker) {
    localStorage.removeItem('asha_patients');
    localStorage.removeItem('asha_drugs');
    localStorage.removeItem('asha_sales');
    localStorage.removeItem('asha_appointments');
    localStorage.removeItem('asha_staff');
    localStorage.setItem('asha_v2_clean', '1');
  }
})();

const DB = {
  KEYS: {
    patients: 'asha_patients',
    drugs: 'asha_drugs',
    sales: 'asha_sales',
    appointments: 'asha_appointments',
    staff: 'asha_staff',
    settings: 'asha_settings',
    diagnoses: 'asha_diagnoses',
  },

  get(key) {
    try { return JSON.parse(localStorage.getItem(key)) || []; }
    catch { return []; }
  },
  getObj(key, def = {}) {
    try { return JSON.parse(localStorage.getItem(key)) || def; }
    catch { return def; }
  },
  set(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  },

  // --- PATIENTS ---
  getPatients() { return this.get(this.KEYS.patients); },
  savePatients(data) { this.set(this.KEYS.patients, data); },
  addPatient(p) {
    const list = this.getPatients();
    p.id = Date.now().toString();
    p.createdAt = new Date().toISOString();
    p.visits = [];
    p.diagnoses = [];
    p.treatments = [];
    p.prescriptions = [];
    list.push(p);
    this.savePatients(list);
    return p;
  },
  updatePatient(id, updates) {
    const list = this.getPatients();
    const idx = list.findIndex(p => p.id === id);
    if (idx !== -1) { list[idx] = { ...list[idx], ...updates }; this.savePatients(list); }
    return list[idx];
  },
  deletePatient(id) {
    const list = this.getPatients().filter(p => p.id !== id);
    this.savePatients(list);
  },
  getPatient(id) { return this.getPatients().find(p => p.id === id); },

  // --- DRUGS ---
  getDrugs() { return this.get(this.KEYS.drugs); },
  saveDrugs(data) { this.set(this.KEYS.drugs, data); },
  addDrug(d) {
    const list = this.getDrugs();
    d.id = Date.now().toString();
    d.createdAt = new Date().toISOString();
    // Track original quantity added for stock reports
    d.totalStocked = (d.totalStocked || 0) + (d.quantity || 0);
    list.push(d);
    this.saveDrugs(list);
    return d;
  },
  updateDrug(id, updates) {
    const list = this.getDrugs();
    const idx = list.findIndex(d => d.id === id);
    if (idx !== -1) { list[idx] = { ...list[idx], ...updates }; this.saveDrugs(list); }
    return list[idx];
  },
  deleteDrug(id) {
    const list = this.getDrugs().filter(d => d.id !== id);
    this.saveDrugs(list);
  },
  getDrug(id) { return this.getDrugs().find(d => d.id === id); },

  // --- SALES ---
  getSales() { return this.get(this.KEYS.sales); },
  saveSales(data) { this.set(this.KEYS.sales, data); },
  addSale(s) {
    const list = this.getSales();
    s.id = Date.now().toString();
    s.date = new Date().toISOString();
    list.push(s);
    this.saveSales(list);
    // Update drug stock
    if (s.items) {
      s.items.forEach(item => {
        const drug = this.getDrug(item.drugId);
        if (drug && !item.drugId.startsWith('manual_')) {
          this.updateDrug(item.drugId, { quantity: Math.max(0, (drug.quantity || 0) - item.qty) });
        }
      });
    }
    return s;
  },
  updateSale(id, updates) {
    const list = this.getSales();
    const idx = list.findIndex(s => s.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates };
      this.saveSales(list);
    }
    return list[idx];
  },

  // Sales analytics
  getSalesByRange(start, end) {
    return this.getSales().filter(s => {
      const d = new Date(s.date);
      return d >= start && d <= end;
    });
  },
  getToday() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(start); end.setDate(end.getDate() + 1);
    return this.getSalesByRange(start, end);
  },
  getThisWeek() {
    const now = new Date();
    const day = now.getDay();
    const start = new Date(now); start.setDate(now.getDate() - day); start.setHours(0,0,0,0);
    const end = new Date(start); end.setDate(start.getDate() + 7);
    return this.getSalesByRange(start, end);
  },
  getThisMonth() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return this.getSalesByRange(start, end);
  },
  totalRevenue(sales) {
    return sales.reduce((sum, s) => sum + (s.total || 0), 0);
  },

  // --- APPOINTMENTS ---
  getAppointments() { return this.get(this.KEYS.appointments); },
  saveAppointments(data) { this.set(this.KEYS.appointments, data); },
  addAppointment(a) {
    const list = this.getAppointments();
    a.id = Date.now().toString();
    a.createdAt = new Date().toISOString();
    list.push(a);
    this.saveAppointments(list);
    return a;
  },
  updateAppointment(id, updates) {
    const list = this.getAppointments();
    const idx = list.findIndex(a => a.id === id);
    if (idx !== -1) { list[idx] = { ...list[idx], ...updates }; this.saveAppointments(list); }
  },
  deleteAppointment(id) {
    this.saveAppointments(this.getAppointments().filter(a => a.id !== id));
  },

  // --- STAFF ---
  getStaff() { return this.get(this.KEYS.staff); },
  saveStaff(data) { this.set(this.KEYS.staff, data); },
  addStaff(s) {
    const list = this.getStaff();
    s.id = Date.now().toString();
    s.createdAt = new Date().toISOString();
    list.push(s);
    this.saveStaff(list);
    return s;
  },
  updateStaff(id, updates) {
    const list = this.getStaff();
    const idx = list.findIndex(s => s.id === id);
    if (idx !== -1) { list[idx] = { ...list[idx], ...updates }; this.saveStaff(list); }
  },
  deleteStaff(id) {
    this.saveStaff(this.getStaff().filter(s => s.id !== id));
  },

  // --- SETTINGS ---
  getSettings() {
    return this.getObj(this.KEYS.settings, {
      clinicName: 'Asha Medical Center',
      address: '',
      phone: '',
      email: '',
      currency: 'UGX',
      lowStockThreshold: 10,
      doctorName: ''
    });
  },
  saveSettings(s) { this.set(this.KEYS.settings, s); },

  // Stock analytics helpers
  getTotalStocked() {
    // Sum of all quantities ever added (current stock + sold)
    return this.getDrugs().reduce((sum, d) => sum + (d.totalStocked || d.quantity || 0), 0);
  },
  getCurrentStock() {
    return this.getDrugs().reduce((sum, d) => sum + (d.quantity || 0), 0);
  },
  getTotalSoldQty() {
    return this.getSales().reduce((sum, s) => sum + (s.items || []).reduce((a, i) => a + (i.qty || 0), 0), 0);
  }
};

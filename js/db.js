// ===== LOCAL DATABASE (localStorage) =====
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
        if (drug) {
          this.updateDrug(item.drugId, { quantity: Math.max(0, (drug.quantity || 0) - item.qty) });
        }
      });
    }
    return s;
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
      currency: 'KES',
      lowStockThreshold: 10,
      doctorName: ''
    });
  },
  saveSettings(s) { this.set(this.KEYS.settings, s); },

  // --- SEED DATA ---
  seed() {
    if (this.getDrugs().length === 0) {
      const drugs = [
        {name:'Amoxicillin 500mg',category:'Antibiotic',quantity:150,price:25,costPrice:15,unit:'Tablet',expiry:'2027-06-01',supplier:'PharmaCo',minStock:20},
        {name:'Paracetamol 500mg',category:'Analgesic',quantity:500,price:10,costPrice:5,unit:'Tablet',expiry:'2027-12-01',supplier:'MedSupply',minStock:50},
        {name:'Metformin 500mg',category:'Antidiabetic',quantity:80,price:30,costPrice:18,unit:'Tablet',expiry:'2026-09-01',supplier:'DiabCare',minStock:30},
        {name:'Ibuprofen 400mg',category:'NSAID',quantity:8,price:20,costPrice:10,unit:'Tablet',expiry:'2027-03-01',supplier:'PharmaCo',minStock:30},
        {name:'ORS Sachets',category:'Rehydration',quantity:200,price:15,costPrice:8,unit:'Sachet',expiry:'2028-01-01',supplier:'MedSupply',minStock:40},
        {name:'Coartem (ALu)',category:'Antimalarial',quantity:12,price:120,costPrice:75,unit:'Pack',expiry:'2026-11-01',supplier:'MalariaCo',minStock:20},
      ];
      drugs.forEach(d => this.addDrug(d));
    }
    if (this.getPatients().length === 0) {
      const patients = [
        {name:'Jane Wanjiku',age:34,gender:'Female',phone:'0712345678',bloodGroup:'O+',allergies:'Penicillin',address:'Nairobi, Kenya',nextOfKin:'John Wanjiku',nextOfKinPhone:'0723456789',nationalID:'12345678',medicalHistory:'Hypertension'},
        {name:'David Otieno',age:52,gender:'Male',phone:'0734567890',bloodGroup:'A+',allergies:'None',address:'Mombasa, Kenya',nextOfKin:'Mary Otieno',nextOfKinPhone:'0745678901',nationalID:'23456789',medicalHistory:'Type 2 Diabetes'},
      ];
      patients.forEach(p => {
        const pat = this.addPatient(p);
        pat.diagnoses = [{id:'d1',date:new Date().toISOString(),diagnosis:'Hypertension',notes:'BP 140/90',doctor:'Dr. Asha'}];
        pat.treatments = [{id:'t1',date:new Date().toISOString(),treatment:'Amlodipine 5mg OD',status:'ongoing',notes:'Review in 1 month'}];
        this.updatePatient(pat.id, {diagnoses:pat.diagnoses, treatments:pat.treatments});
      });
    }
    if (this.getSales().length === 0) {
      // Add some historical sales
      const now = new Date();
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const numSales = Math.floor(Math.random() * 4) + 1;
        for (let j = 0; j < numSales; j++) {
          const total = Math.floor(Math.random() * 500) + 100;
          const s = {
            id: `seed_${i}_${j}`,
            date: d.toISOString(),
            patientName: ['Walk-in', 'Jane W', 'David O', 'Mary K'][j % 4],
            items: [{drugId:'seed',drugName:'Mixed',qty:1,price:total,subtotal:total}],
            total,
            paymentMethod: ['Cash', 'M-Pesa', 'Insurance'][j % 3],
            servedBy: 'Admin'
          };
          const list = this.getSales();
          list.push(s);
          this.saveSales(list);
        }
      }
    }
  }
};

const BW_KEY = "buildwise_v1";

function seedData() {
  const users = [
    { id: "u1", name: "Amina Cheruiyot", email: "admin@buildwise.co", role: "Administrator", phone: "+254 712 440 110", password: "demo123" },
    { id: "u2", name: "Daniel Kiptoo", email: "pm@buildwise.co", role: "Project Manager", phone: "+254 722 118 904", password: "demo123" },
    { id: "u3", name: "Grace Chebet", email: "site@buildwise.co", role: "Site Supervisor", phone: "+254 701 552 331", password: "demo123" },
    { id: "u4", name: "Omar Hassan", email: "contractor@buildwise.co", role: "Contractor", phone: "+254 733 909 212", password: "demo123" },
    { id: "u5", name: "Peter Langat", email: "worker@buildwise.co", role: "Worker", phone: "+254 745 220 778", password: "demo123" },
    { id: "u6", name: "James Mwangi", email: "client@buildwise.co", role: "Client", phone: "+254 720 441 009", password: "demo123" }
  ];
  const projects = [
    {
      id: "p1",
      name: "Modern 4-Bedroom Residence — Kericho",
      client: "James Mwangi",
      manager: "Daniel Kiptoo",
      location: "Milimani, Kericho",
      lat: -0.369, lng: 35.286,
      start: "2025-11-04",
      end: "2026-08-28",
      phase: "Finishing",
      progress: 68,
      budget: 8400000,
      spent: 5700000,
      description: "A contemporary four-bedroom residence with stone-coated steel roofing, open-plan living, and a service court. Structural works are complete; finishing, electrical second-fix, and external works are underway.",
      status: "Active"
    },
    {
      id: "p2",
      name: "Tea Warehouse Extension — Litein",
      client: "Kericho Growers Coop",
      manager: "Daniel Kiptoo",
      location: "Litein",
      lat: -0.582, lng: 35.191,
      start: "2026-01-12",
      end: "2026-11-30",
      phase: "Structure",
      progress: 41,
      budget: 12600000,
      spent: 4900000,
      description: "Steel portal frame extension for graded tea storage, with raised loading dock and fire separation.",
      status: "Active"
    },
    {
      id: "p3",
      name: "Clinic Block — Sosiot",
      client: "County Health",
      manager: "Amina Cheruiyot",
      location: "Sosiot",
      lat: -0.348, lng: 35.214,
      start: "2025-06-01",
      end: "2026-02-15",
      phase: "Complete",
      progress: 100,
      budget: 5100000,
      spent: 4980000,
      description: "Single-storey outpatient block handed over in February.",
      status: "Completed"
    }
  ];
  const phases = [
    { id: "ph1", projectId: "p1", name: "Planning", status: "Completed", start: "2025-11-04", end: "2025-11-28", progress: 100, budget: 420000, workers: ["Daniel Kiptoo"], tasks: 6, depends: "—" },
    { id: "ph2", projectId: "p1", name: "Foundation", status: "Completed", start: "2025-12-02", end: "2026-01-18", progress: 100, budget: 980000, workers: ["Omar Hassan", "Peter Langat"], tasks: 9, depends: "Planning" },
    { id: "ph3", projectId: "p1", name: "Structure", status: "Completed", start: "2026-01-20", end: "2026-03-30", progress: 100, budget: 2100000, workers: ["Omar Hassan"], tasks: 14, depends: "Foundation" },
    { id: "ph4", projectId: "p1", name: "Roofing", status: "Completed", start: "2026-04-02", end: "2026-04-26", progress: 100, budget: 780000, workers: ["Peter Langat"], tasks: 5, depends: "Structure" },
    { id: "ph5", projectId: "p1", name: "Electrical", status: "In Progress", start: "2026-04-20", end: "2026-06-12", progress: 74, budget: 640000, workers: ["Grace Chebet"], tasks: 8, depends: "Structure" },
    { id: "ph6", projectId: "p1", name: "Plumbing", status: "In Progress", start: "2026-04-22", end: "2026-06-18", progress: 61, budget: 510000, workers: ["Omar Hassan"], tasks: 7, depends: "Structure" },
    { id: "ph7", projectId: "p1", name: "Finishing", status: "In Progress", start: "2026-05-10", end: "2026-08-10", progress: 42, budget: 2450000, workers: ["Grace Chebet", "Peter Langat"], tasks: 18, depends: "Roofing" },
    { id: "ph8", projectId: "p1", name: "Complete", status: "Not Started", start: "2026-08-12", end: "2026-08-28", progress: 0, budget: 520000, workers: ["Daniel Kiptoo"], tasks: 4, depends: "Finishing" }
  ];
  const materials = [
    { id: "m1", projectId: "p1", name: "Cement", category: "Structure", qty: 84, unit: "bags", min: 40, supplier: "Rift Valley Cement", price: 850, status: "Available" },
    { id: "m2", projectId: "p1", name: "Steel", category: "Structure", qty: 2.4, unit: "tons", min: 1, supplier: "Nakuru Steel Yard", price: 142000, status: "Available" },
    { id: "m3", projectId: "p1", name: "Sand", category: "Finishes", qty: 8, unit: "trucks", min: 10, supplier: "Kericho Aggregates", price: 18500, status: "Low" },
    { id: "m4", projectId: "p1", name: "Tiles", category: "Finishes", qty: 120, unit: "boxes", min: 30, supplier: "Amani Ceramics", price: 2450, status: "Ordered" },
    { id: "m5", projectId: "p1", name: "Stone-coated steel", category: "Roofing", qty: 186, unit: "m²", min: 40, supplier: "Highland Roofing", price: 3200, status: "Available" },
    { id: "m6", projectId: "p1", name: "PVC pipes", category: "Plumbing", qty: 46, unit: "lengths", min: 20, supplier: "Rift Valley Cement", price: 680, status: "Available" }
  ];
  const workers = [
    { id: "w1", name: "Peter Langat", role: "Mason", spec: "Blockwork & plaster", phone: "+254 745 220 778", projectId: "p1", hours: 612, attendance: 96, pay: 186000, status: "Active", perf: 88 },
    { id: "w2", name: "Grace Chebet", role: "Site Supervisor", spec: "QA & safety", phone: "+254 701 552 331", projectId: "p1", hours: 740, attendance: 99, pay: 420000, status: "Active", perf: 94 },
    { id: "w3", name: "Omar Hassan", role: "Contractor", spec: "Structure & plumbing", phone: "+254 733 909 212", projectId: "p1", hours: 510, attendance: 91, pay: 980000, status: "Active", perf: 86 },
    { id: "w4", name: "Faith Kirui", role: "Electrician", spec: "Second fix", phone: "+254 711 300 441", projectId: "p1", hours: 240, attendance: 93, pay: 164000, status: "Active", perf: 90 },
    { id: "w5", name: "Samuel Bett", role: "Plant operator", spec: "Mixer & hoist", phone: "+254 726 118 003", projectId: "p2", hours: 188, attendance: 88, pay: 132000, status: "Active", perf: 81 }
  ];
  const tasks = [
    { id: "t1", name: "Skim coat living hall", projectId: "p1", phase: "Finishing", assignee: "Peter Langat", priority: "High", status: "In Progress", start: "2026-05-18", due: "2026-05-30", deps: "Roofing dry-in", notes: "Two coats, sand between." },
    { id: "t2", name: "Second-fix sockets", projectId: "p1", phase: "Electrical", assignee: "Faith Kirui", priority: "High", status: "Review", start: "2026-05-12", due: "2026-05-26", deps: "Conduit complete", notes: "Client wants USB plates." },
    { id: "t3", name: "Wet-area waterproofing", projectId: "p1", phase: "Plumbing", assignee: "Omar Hassan", priority: "Critical", status: "To Do", start: "2026-05-22", due: "2026-06-02", deps: "Screed", notes: "Flood test before tiling." },
    { id: "t4", name: "Kitchen carcass install", projectId: "p1", phase: "Finishing", assignee: "Grace Chebet", priority: "Medium", status: "To Do", start: "2026-06-04", due: "2026-06-16", deps: "Tiles", notes: "" },
    { id: "t5", name: "External apron", projectId: "p1", phase: "Finishing", assignee: "Peter Langat", priority: "Low", status: "To Do", start: "2026-06-20", due: "2026-07-04", deps: "Drainage", notes: "" },
    { id: "t6", name: "Roof flashing sign-off", projectId: "p1", phase: "Roofing", assignee: "Grace Chebet", priority: "Medium", status: "Completed", start: "2026-04-20", due: "2026-04-26", deps: "Sheeting", notes: "Passed inspection." },
    { id: "t7", name: "Portal frame bolt-up", projectId: "p2", phase: "Structure", assignee: "Samuel Bett", priority: "High", status: "In Progress", start: "2026-05-02", due: "2026-05-28", deps: "Foundations", notes: "" }
  ];
  const expenses = [
    { id: "e1", projectId: "p1", date: "2026-04-18", category: "Materials", vendor: "Highland Roofing", note: "Stone-coated steel", amount: 640000 },
    { id: "e2", projectId: "p1", date: "2026-04-22", category: "Labour", vendor: "Site payroll", note: "April fortnight", amount: 286000 },
    { id: "e3", projectId: "p1", date: "2026-05-03", category: "Transport", vendor: "Kericho Hauliers", note: "Sand & ballast", amount: 74000 },
    { id: "e4", projectId: "p1", date: "2026-05-09", category: "Equipment", vendor: "Rift Plant Hire", note: "Hoist week 18", amount: 42000 },
    { id: "e5", projectId: "p1", date: "2026-05-14", category: "Permits", vendor: "County works", note: "Occupation inspection", amount: 18000 },
    { id: "e6", projectId: "p1", date: "2026-03-12", category: "Contractors", vendor: "Hassan Structures", note: "Slab pour", amount: 510000 },
    { id: "e7", projectId: "p2", date: "2026-05-06", category: "Materials", vendor: "Nakuru Steel Yard", note: "Portal steel", amount: 890000 }
  ];
  const reports = [
    { id: "r1", projectId: "p1", date: "2026-05-20", author: "Grace Chebet", weather: "Light showers, 18°C", done: "Hall skim coat first pass. Electrical trunking boxed in bedrooms 2 and 3.", materials: "Cement 12 bags, gypsum 8 bags", issues: "Sand stock below reorder level.", workers: 14, equipment: "Mixer, hoist", safety: "Wet access path coned off.", notes: "Client walkthrough Friday.", photo: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=900&q=70" },
    { id: "r2", projectId: "p1", date: "2026-05-19", author: "Peter Langat", weather: "Clear, 22°C", done: "Bathroom wall chasing closed. Screed levels marked.", materials: "Sand 1 truck, cement 9 bags", issues: "None", workers: 11, equipment: "Mixer", safety: "PPE compliance 100%.", notes: "", photo: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=900&q=70" }
  ];
  const equipment = [
    { id: "eq1", name: "Concrete mixer 350L", type: "Plant", ident: "MX-114", location: "Kericho site", projectId: "p1", operator: "Samuel Bett", status: "In Use", hours: 640, nextService: "2026-06-02", rental: "Owned" },
    { id: "eq2", name: "Material hoist", type: "Lifting", ident: "HT-08", location: "Kericho site", projectId: "p1", operator: "Peter Langat", status: "In Use", hours: 210, nextService: "2026-05-29", rental: "Rift Plant Hire" },
    { id: "eq3", name: "Plate compactor", type: "Compaction", ident: "PC-22", location: "Yard", projectId: "p1", operator: "—", status: "Available", hours: 88, nextService: "2026-07-01", rental: "Owned" },
    { id: "eq4", name: "Mobile scaffold", type: "Access", ident: "SC-03", location: "Litein", projectId: "p2", operator: "Omar Hassan", status: "Reserved", hours: 40, nextService: "2026-06-15", rental: "Owned" }
  ];
  const suppliers = [
    { id: "s1", name: "Rift Valley Cement", contact: "sales@rvcement.co.ke", phone: "+254 700 111 220", location: "Kericho town", products: "Cement, pipes, admixtures", rating: 4.6, outstanding: 126000 },
    { id: "s2", name: "Highland Roofing", contact: "orders@highlandroof.co.ke", phone: "+254 722 555 018", location: "Nakuru Rd", products: "Stone-coated steel, flashings", rating: 4.8, outstanding: 0 },
    { id: "s3", name: "Kericho Aggregates", contact: "dispatch@kagg.co.ke", phone: "+254 711 909 441", location: "Londiani road", products: "Sand, ballast, hardcore", rating: 3.9, outstanding: 74000 },
    { id: "s4", name: "Amani Ceramics", contact: "hello@amaniceramics.co.ke", phone: "+254 733 200 118", location: "Nairobi / Kericho depot", products: "Tiles, adhesives", rating: 4.4, outstanding: 186000 }
  ];
  const invoices = [
    { id: "i1", number: "INV-2041", party: "Highland Roofing", projectId: "p1", desc: "Roofing package", items: 1, qty: 1, price: 640000, tax: 0, status: "Paid", due: "2026-04-30" },
    { id: "i2", number: "INV-2055", party: "Kericho Aggregates", projectId: "p1", desc: "Sand deliveries May", items: 3, qty: 8, price: 18500, tax: 0, status: "Pending", due: "2026-05-28" },
    { id: "i3", number: "INV-2060", party: "Amani Ceramics", projectId: "p1", desc: "Tile order — wet areas", items: 4, qty: 120, price: 2450, tax: 0, status: "Sent", due: "2026-06-10" },
    { id: "i4", number: "INV-1988", party: "James Mwangi", projectId: "p1", desc: "Client valuation 4", items: 1, qty: 1, price: 1200000, tax: 0, status: "Overdue", due: "2026-05-12" }
  ];
  const threads = [
    { id: "c1", title: "Kericho finishing", projectId: "p1", unread: 1, messages: [
      { from: "Grace Chebet", text: "Sand is low. Can we release the Kericho Aggregates order today?", time: "08:14" },
      { from: "Daniel Kiptoo", text: "Approved. Keep flood test on the critical path.", time: "08:22" }
    ]},
    { id: "c2", title: "Client walkthrough", projectId: "p1", unread: 0, messages: [
      { from: "James Mwangi", text: "Friday 10:00 still works for the hall and master suite.", time: "Yesterday" }
    ]}
  ];
  const documents = [
    { id: "d1", projectId: "p1", name: "Architectural set Rev C", category: "Architectural drawings", ver: "C", updated: "2026-02-11" },
    { id: "d2", projectId: "p1", name: "Ground floor plan", category: "Floor plans", ver: "C", updated: "2026-02-11" },
    { id: "d3", projectId: "p1", name: "Building permit", category: "Permits", ver: "1", updated: "2025-11-20" },
    { id: "d4", projectId: "p1", name: "Main contract", category: "Contracts", ver: "2", updated: "2025-11-02" },
    { id: "d5", projectId: "p1", name: "Safety file", category: "Safety documents", ver: "4", updated: "2026-05-01" },
    { id: "d6", projectId: "p1", name: "Roof specification", category: "Project specifications", ver: "1", updated: "2026-03-18" }
  ];
  const notifications = [
    { id: "n1", type: "Materials", text: "Sand is below minimum stock on Kericho residence.", read: false, time: "2h" },
    { id: "n2", type: "Invoices", text: "INV-1988 client valuation is overdue.", read: false, time: "1d" },
    { id: "n3", type: "Equipment", text: "Material hoist service due 29 May.", read: false, time: "1d" },
    { id: "n4", type: "Tasks", text: "Wet-area waterproofing starts this week.", read: true, time: "2d" },
    { id: "n5", type: "Reports", text: "Grace Chebet filed a site report.", read: true, time: "3h" }
  ];
  const activity = [
    { id: "a1", text: "Site report filed for Kericho residence", time: "Today 07:40" },
    { id: "a2", text: "Tile order sent to Amani Ceramics", time: "Yesterday" },
    { id: "a3", text: "Roof flashing signed off", time: "18 Apr" }
  ];
  return { users, projects, phases, materials, workers, tasks, expenses, reports, equipment, suppliers, invoices, threads, documents, notifications, activity };
}

function loadState() {
  try {
    const raw = localStorage.getItem(BW_KEY);
    if (!raw) {
      const data = seedData();
      localStorage.setItem(BW_KEY, JSON.stringify(data));
      return data;
    }
    return JSON.parse(raw);
  } catch (e) {
    return seedData();
  }
}
function saveState(state) {
  localStorage.setItem(BW_KEY, JSON.stringify(state));
}
function money(n) {
  return "KSh " + Math.round(n).toLocaleString("en-KE");
}
function uid(prefix) {
  return prefix + Math.random().toString(36).slice(2, 8);
}

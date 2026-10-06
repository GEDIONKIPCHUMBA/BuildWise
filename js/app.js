const state = loadState();
let session = JSON.parse(localStorage.getItem("bw_session") || "null");
const ui = {
  view: "dashboard",
  projectId: "p1",
  theme: localStorage.getItem("bw_theme") || "light",
  taskView: "kanban",
  threadId: "c1",
  query: "",
  phaseId: "ph7",
  rolePick: "Administrator",
  notifFilter: "All"
};
let charts = [];
let mapRef = null;
let viewer = null;

const NAV = [
  ["dashboard", "Dashboard"],
  ["projects", "Projects"],
  ["timeline", "Timeline"],
  ["budget", "Budget"],
  ["materials", "Materials"],
  ["workers", "Workforce"],
  ["tasks", "Tasks"],
  ["reports", "Site reports"],
  ["map", "Site map"],
  ["viewer", "3D viewer"],
  ["equipment", "Equipment"],
  ["suppliers", "Suppliers"],
  ["invoices", "Invoices"],
  ["messages", "Messages"],
  ["documents", "Documents"],
  ["analytics", "Analytics"],
  ["notifications", "Notifications"],
  ["settings", "Settings"],
  ["profile", "Profile"]
];

function $(sel, root = document) { return root.querySelector(sel); }
function project(id = ui.projectId) { return state.projects.find(p => p.id === id) || state.projects[0]; }
function toast(msg) {
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  $("#toast-root").appendChild(el);
  setTimeout(() => el.remove(), 2600);
}
function badge(status) {
  const map = { Completed: "b-good", Paid: "b-good", Available: "b-good", Active: "b-good", "In Progress": "b-info", Sent: "b-info", Ordered: "b-info", Review: "b-info", Reserved: "b-info", Pending: "b-warn", Low: "b-warn", Delayed: "b-bad", Overdue: "b-bad", "Out of Service": "b-bad", "To Do": "b-neutral", Draft: "b-neutral", "Not Started": "b-neutral", "On Hold": "b-warn", "Under Maintenance": "b-warn", "In Use": "b-info" };
  return `<span class="badge ${map[status] || "b-neutral"}">${status}</span>`;
}
function canEdit() { return session && session.role !== "Client" && session.role !== "Worker"; }
function logActivity(text) {
  state.activity.unshift({ id: uid("a"), text, time: "Just now" });
  saveState(state);
}
function recalc(projectId) {
  const p = state.projects.find(x => x.id === projectId);
  if (!p) return;
  const exp = state.expenses.filter(e => e.projectId === projectId).reduce((s, e) => s + Number(e.amount), 0);
  p.spent = exp;
  const tasks = state.tasks.filter(t => t.projectId === projectId);
  if (tasks.length) {
    const done = tasks.filter(t => t.status === "Completed").length;
    const review = tasks.filter(t => t.status === "Review").length;
    const prog = tasks.filter(t => t.status === "In Progress").length;
    p.progress = Math.min(100, Math.round(((done + review * 0.8 + prog * 0.45) / tasks.length) * 100));
  }
  saveState(state);
}

function destroyCharts() {
  charts.forEach(c => c.destroy());
  charts = [];
}
function makeChart(canvas, cfg) {
  if (!canvas) return;
  const c = new Chart(canvas, cfg);
  charts.push(c);
}
function themeColor() { return document.body.dataset.theme === "dark" ? "#f4eee6" : "#1b1714"; }

function renderAuth() {
  $("#app").innerHTML = `
    <section class="auth">
      <div class="auth-hero">
        <div class="brand"><div class="mark"><span></span></div> BuildWise</div>
        <div>
          <h1>The site office, on every screen.</h1>
          <p>Plan, cost, staff, and close construction work from Kericho to the coast — one workspace for the whole team.</p>
        </div>
        <div class="hero-stats">
          <div><strong>68%</strong><span>Kericho residence</span></div>
          <div><strong>KSh 8.4M</strong><span>Active budget</span></div>
          <div><strong>3</strong><span>Live projects</span></div>
        </div>
      </div>
      <div class="auth-panel">
        <form class="auth-card" id="login-form">
          <h2>Sign in</h2>
          <p class="muted">Password for every demo role is <strong>demo123</strong>.</p>
          <label>Role</label>
          <div class="roles" id="role-picks">
            ${["Administrator","Project Manager","Site Supervisor","Contractor","Worker","Client"].map(r => `<button type="button" class="role-chip ${ui.rolePick===r?"active":""}" data-role="${r}">${r}</button>`).join("")}
          </div>
          <label>Email</label>
          <input id="email" value="${state.users.find(u => u.role===ui.rolePick).email}" />
          <label>Password</label>
          <input id="password" type="password" value="demo123" />
          <button class="btn full" type="submit">Enter workspace</button>
        </form>
      </div>
    </section>`;
  $("#role-picks").onclick = (e) => {
    const b = e.target.closest("[data-role]");
    if (!b) return;
    ui.rolePick = b.dataset.role;
    renderAuth();
  };
  $("#login-form").onsubmit = (e) => {
    e.preventDefault();
    const email = $("#email").value.trim().toLowerCase();
    const password = $("#password").value;
    const user = state.users.find(u => u.email === email && u.password === password);
    if (!user) return toast("Check the email and password.");
    session = user;
    localStorage.setItem("bw_session", JSON.stringify(user));
    toast("Welcome, " + user.name.split(" ")[0]);
    render();
  };
  gsap.from(".auth-card", { y: 16, opacity: 0, duration: 0.5 });
}

function shell(body) {
  const unread = state.notifications.filter(n => !n.read).length;
  const msgUnread = state.threads.reduce((s, t) => s + t.unread, 0);
  return `
    <div class="shell">
      <aside class="sidebar" id="sidebar">
        <div class="side-brand"><div class="mark"><span></span></div> BuildWise</div>
        ${NAV.map(([id, label]) => `<button class="nav-btn ${ui.view===id?"active":""}" data-nav="${id}"><span class="nav-ico">${icon(id)}</span>${label}${id==="notifications"&&unread?` <span class="badge b-bad">${unread}</span>`:""}${id==="messages"&&msgUnread?` <span class="badge b-warn">${msgUnread}</span>`:""}</button>`).join("")}
      </aside>
      <section class="main">
        <header class="topbar">
          <button class="icon-btn menu-toggle" id="menu-toggle" aria-label="Menu">☰</button>
          <input class="search" id="global-search" placeholder="Search projects, tasks, materials, invoices…" value="${ui.query}" />
          <div class="top-actions">
            <button class="icon-btn" id="theme-btn" title="Theme">${ui.theme==="dark"?"Light":"Dark"}</button>
            <button class="icon-btn" data-nav="notifications">Alerts ${unread}</button>
            <button class="avatar" data-nav="profile" title="${session.name}">${session.name.split(" ").map(p=>p[0]).slice(0,2).join("")}</button>
          </div>
        </header>
        <div class="content">${body}</div>
      </section>
    </div>
    <nav class="mobile-nav">
      ${[["dashboard","Home"],["projects","Projects"],["tasks","Tasks"],["reports","Reports"],["messages","Chat"]].map(([id,l]) => `<button data-nav="${id}" class="${ui.view===id?"active":""}">${l}</button>`).join("")}
    </nav>`;
}
function icon(id) {
  const m = { dashboard:"▦", projects:"⌂", timeline:"⤷", budget:"₭", materials:"▣", workers:"☺", tasks:"☑", reports:"☰", map:"⌖", viewer:"◇", equipment:"⚙", suppliers:"▤", invoices:"﷼", messages:"✉", documents:"▣", analytics:"▣", notifications:"!", settings:"⚙", profile:"☺" };
  return m[id] || "•";
}
function head(title, crumb, actions = "") {
  return `<div class="page-head"><div><div class="crumbs">${crumb}</div><h1>${title}</h1></div><div class="row-actions">${actions}</div></div>`;
}
function projectSelect() {
  return `<select id="project-switch">${state.projects.map(p => `<option value="${p.id}" ${p.id===ui.projectId?"selected":""}>${p.name}</option>`).join("")}</select>`;
}

function viewDashboard() {
  const active = state.projects.filter(p => p.status === "Active");
  const done = state.projects.filter(p => p.status === "Completed");
  const budget = state.projects.reduce((s,p)=>s+p.budget,0);
  const spent = state.projects.reduce((s,p)=>s+p.spent,0);
  const outstanding = state.invoices.filter(i => i.status !== "Paid").reduce((s,i)=>s+i.qty*i.price,0);
  const pending = state.tasks.filter(t => t.status !== "Completed").length;
  const low = state.materials.filter(m => m.status === "Low" || m.qty < m.min);
  return `
    ${head("Site control", "BuildWise / Dashboard", projectSelect())}
    <div class="grid kpis">
      ${kpi("Active projects", active.length, done.length + " completed")}
      ${kpi("Overall progress", Math.round(state.projects.reduce((s,p)=>s+p.progress,0)/state.projects.length) + "%", "across the portfolio")}
      ${kpi("Portfolio budget", money(budget), money(spent) + " spent")}
      ${kpi("Outstanding", money(outstanding), pending + " open tasks")}
    </div>
    <div class="grid cols-2" style="margin-top:14px">
      <div class="card"><h3>Budget vs expenditure</h3><div class="chart-box"><canvas id="c-budget"></canvas></div></div>
      <div class="card"><h3>Task completion</h3><div class="chart-box"><canvas id="c-tasks"></canvas></div></div>
    </div>
    <div class="grid cols-3" style="margin-top:14px">
      <div class="card"><h3>Upcoming deadlines</h3>${state.tasks.filter(t=>t.status!=="Completed").slice(0,4).map(t=>`<p><strong>${t.name}</strong><br><span class="note">${t.due} · ${t.assignee}</span></p>`).join("")}</div>
      <div class="card"><h3>Materials needing attention</h3>${low.map(m=>`<p>${m.name} · ${m.qty} ${m.unit} ${badge(m.status)}</p>`).join("") || "<p class='note'>Stocks are healthy.</p>"}</div>
      <div class="card"><h3>Recent activity</h3>${state.activity.slice(0,5).map(a=>`<p><strong>${a.text}</strong><br><span class="note">${a.time}</span></p>`).join("")}</div>
    </div>
    <div class="grid cols-2" style="margin-top:14px">
      <div class="card"><h3>Recent site reports</h3>${state.reports.slice(0,3).map(r=>`<p><strong>${r.date}</strong> — ${r.author}<br><span class="note">${r.done}</span></p>`).join("")}</div>
      <div class="card"><h3>Milestones</h3>${state.phases.filter(p=>p.projectId==="p1").map(p=>`<p>${p.name} ${badge(p.status)} <span class="note">${p.end}</span></p>`).join("")}</div>
    </div>`;
}
function kpi(label, value, sub) {
  return `<article class="card kpi"><span>${label}</span><strong class="count" data-value="${String(value).replace(/[^0-9.]/g,"")}">${value}</strong><em>${sub}</em></article>`;
}

function viewProjects() {
  const q = ui.query.toLowerCase();
  const rows = state.projects.filter(p => p.name.toLowerCase().includes(q));
  return `
    ${head("Projects", "BuildWise / Projects", canEdit()?`<button class="btn" id="add-project">New project</button>`:"")}
    <div class="grid cols-3">
      ${rows.map(p => `
        <article class="card">
          <div class="row-actions" style="justify-content:space-between"><strong>${p.name}</strong>${badge(p.status)}</div>
          <p class="note">${p.location} · ${p.phase}</p>
          <div class="progress"><i style="width:${p.progress}%"></i></div>
          <p>${p.progress}% · ${money(p.spent)} of ${money(p.budget)}</p>
          <button class="btn" data-open-project="${p.id}">Open workspace</button>
        </article>`).join("")}
    </div>`;
}
function viewWorkspace() {
  const p = project();
  const remain = p.budget - p.spent;
  const team = state.workers.filter(w => w.projectId === p.id);
  return `
    ${head(p.name, "Projects / Workspace", `<button class="btn-ghost" data-nav="timeline">Timeline</button><button class="btn" data-nav="viewer">3D viewer</button>`)}
    ${remain < p.budget * 0.2 ? `<div class="warn-banner">Remaining budget is ${money(remain)}. Review finishing packages before approving new orders.</div>` : ""}
    <div class="grid kpis">
      ${kpi("Progress", p.progress + "%", p.phase)}
      ${kpi("Budget", money(p.budget), "allocated")}
      ${kpi("Spent", money(p.spent), "posted costs")}
      ${kpi("Remaining", money(remain), remain < 0 ? "over budget" : "available")}
    </div>
    <div class="grid cols-2" style="margin-top:14px">
      <div class="card">
        <h3>Overview</h3>
        <p>${p.description}</p>
        <p><strong>Client</strong> ${p.client}<br><strong>Manager</strong> ${p.manager}<br><strong>Site</strong> ${p.location}<br><strong>Start</strong> ${p.start}<br><strong>Completion</strong> ${p.end}</p>
      </div>
      <div class="card">
        <h3>Team</h3>
        ${team.map(w => `<p>${w.name} · ${w.role} · ${w.attendance}% attendance</p>`).join("") || "<p class='note'>No crew assigned.</p>"}
        <h3>Latest report</h3>
        <p class="note">${(state.reports.find(r => r.projectId===p.id) || {}).done || "No reports yet."}</p>
      </div>
    </div>`;
}

function viewTimeline() {
  const phases = state.phases.filter(p => p.projectId === ui.projectId);
  const current = phases.find(p => p.id === ui.phaseId) || phases.find(p => p.status === "In Progress") || phases[0];
  return `
    ${head("Construction timeline", "Projects / Timeline", projectSelect())}
    <div class="timeline">
      ${phases.map(p => `<button class="phase ${current && current.id===p.id?"active":""}" data-phase="${p.id}"><strong>${p.name}</strong><div><div class="progress"><i style="width:${p.progress}%"></i></div><span class="note">${p.start} → ${p.end} · ${p.workers.join(", ")}</span></div>${badge(p.status)}</button>`).join("")}
    </div>
    ${current ? `<div class="card" style="margin-top:14px"><h3>${current.name}</h3><p>Status ${badge(current.status)} · ${current.progress}% · budget ${money(current.budget)}</p><p class="note">Depends on ${current.depends}. Assigned: ${current.workers.join(", ")}. Linked tasks: ${current.tasks}.</p>${canEdit()?`<button class="btn" id="advance-phase">Mark progress +10%</button>`:""}</div>` : ""}`;
}

function viewBudget() {
  const p = project();
  const rows = state.expenses.filter(e => e.projectId === p.id && (`${e.category} ${e.vendor} ${e.note}`).toLowerCase().includes(ui.query.toLowerCase()));
  const byCat = {};
  rows.forEach(e => byCat[e.category] = (byCat[e.category] || 0) + Number(e.amount));
  return `
    ${head("Budget & expenses", "Finance / " + p.name, canEdit()?`<button class="btn" id="add-expense">Add expense</button>`:"")}
    ${p.spent > p.budget * 0.85 ? `<div class="warn-banner">This project has used ${Math.round(p.spent/p.budget*100)}% of its budget.</div>` : ""}
    <div class="grid kpis">${kpi("Budget", money(p.budget), "")}${kpi("Actual", money(p.spent), "")}${kpi("Remaining", money(p.budget-p.spent), "")}${kpi("Categories", Object.keys(byCat).length, "in view")}</div>
    <div class="grid cols-2" style="margin-top:14px">
      <div class="card"><h3>Spend by category</h3><div class="chart-box"><canvas id="c-cat"></canvas></div></div>
      <div class="card">
        <div class="filters"><input id="exp-search" placeholder="Search transactions" value="${ui.query}" /></div>
        <table><thead><tr><th>Date</th><th>Category</th><th>Note</th><th>Amount</th><th></th></tr></thead>
        <tbody>${rows.map(e => `<tr><td>${e.date}</td><td>${e.category}</td><td>${e.note}<br><span class="note">${e.vendor}</span></td><td>${money(e.amount)}</td><td>${canEdit()?`<button class="icon-btn" data-del-exp="${e.id}">Delete</button>`:""}</td></tr>`).join("")}</tbody></table>
        <button class="btn-ghost" id="export-exp">Export CSV</button>
      </div>
    </div>`;
}

function viewMaterials() {
  const rows = state.materials.filter(m => m.projectId === ui.projectId);
  return `
    ${head("Materials", "Inventory", canEdit()?`<button class="btn" id="add-mat">Receive stock</button>`:"")}
    <div class="card"><table><thead><tr><th>Material</th><th>Stock</th><th>Min</th><th>Supplier</th><th>Value</th><th>Status</th></tr></thead>
      <tbody>${rows.map(m => `<tr><td>${m.name}<br><span class="note">${m.category}</span></td><td>${m.qty} ${m.unit}</td><td>${m.min}</td><td>${m.supplier}</td><td>${money(m.qty * m.price)}</td><td>${badge(m.qty < m.min ? "Low" : m.status)}</td></tr>`).join("")}</tbody></table></div>`;
}
function viewWorkers() {
  return `
    ${head("Workforce & teams", "People", canEdit()?`<button class="btn" id="add-worker">Add worker</button>`:"")}
    <div class="grid cols-3">${state.workers.map(w => `<article class="card"><div class="avatar">${w.name.split(" ").map(x=>x[0]).join("")}</div><h3>${w.name}</h3><p>${w.role} · ${w.spec}</p><p class="note">${w.phone}<br>${project(w.projectId).name}<br>${w.hours} hrs · attendance ${w.attendance}% · ${money(w.pay)}</p><p>Performance ${w.perf}% ${badge(w.status)}</p></article>`).join("")}</div>`;
}
function viewTasks() {
  const tasks = state.tasks.filter(t => t.projectId === ui.projectId && t.name.toLowerCase().includes(ui.query.toLowerCase()));
  const cols = ["To Do", "In Progress", "Review", "Completed"];
  const board = ui.taskView === "kanban" ? `<div class="kanban">${cols.map(c => `<div class="kanban-col" data-col="${c}"><strong>${c}</strong>${tasks.filter(t=>t.status===c).map(t => `<article class="task-card" draggable="true" data-task="${t.id}"><strong>${t.name}</strong><p class="note">${t.phase} · ${t.assignee}<br>Due ${t.due} · ${t.priority}</p></article>`).join("")}</div>`).join("")}</div>`
    : `<div class="card"><table><thead><tr><th>Task</th><th>Phase</th><th>Assignee</th><th>Due</th><th>Status</th></tr></thead><tbody>${tasks.map(t=>`<tr><td>${t.name}<br><span class="note">${t.notes||""}</span></td><td>${t.phase}</td><td>${t.assignee}</td><td>${t.due}</td><td>${badge(t.status)}</td></tr>`).join("")}</tbody></table></div>`;
  return `${head("Tasks", "Execution", `<button class="btn-ghost" data-taskview="list">List</button><button class="btn-ghost" data-taskview="kanban">Kanban</button>${canEdit()?`<button class="btn" id="add-task">New task</button>`:""}`)}${board}`;
}
function viewReports() {
  const rows = state.reports.filter(r => r.projectId === ui.projectId);
  return `${head("Site reports", "Daily record", canEdit()||session.role==="Worker"||session.role==="Site Supervisor"?`<button class="btn" id="add-report">File report</button>`:"")}
    <div class="grid">${rows.map(r => `<article class="card"><div class="photos"><img src="${r.photo}" alt="Site photograph" /></div><h3>${r.date} · ${r.author}</h3><p>${r.done}</p><p class="note">Weather ${r.weather}<br>Materials ${r.materials}<br>Issues ${r.issues}<br>Crew ${r.workers} · ${r.equipment}<br>Safety ${r.safety}</p></article>`).join("") || `<div class="empty">No reports for this project.</div>`}</div>`;
}
function viewEquipment() {
  return `${head("Equipment", "Plant", "")}<div class="card"><table><thead><tr><th>Plant</th><th>Ident</th><th>Location</th><th>Operator</th><th>Hours</th><th>Service</th><th>Status</th></tr></thead><tbody>
    ${state.equipment.map(e => `<tr><td>${e.name}<br><span class="note">${e.type} · ${e.rental}</span></td><td>${e.ident}</td><td>${e.location}</td><td>${e.operator}</td><td>${e.hours}</td><td>${e.nextService}</td><td>${badge(e.status)}</td></tr>`).join("")}
  </tbody></table></div>`;
}
function viewSuppliers() {
  return `${head("Suppliers", "Procurement", "")}<div class="grid cols-2">${state.suppliers.map(s => `<article class="card"><h3>${s.name}</h3><p>${s.products}</p><p class="note">${s.location}<br>${s.contact}<br>${s.phone}</p><p>Reliability ${s.rating}/5 · outstanding ${money(s.outstanding)}</p></article>`).join("")}</div>`;
}
function viewInvoices() {
  return `${head("Invoices", "Finance", canEdit()?`<button class="btn" id="add-invoice">New invoice</button>`:"")}
    <div class="card"><table><thead><tr><th>Number</th><th>Party</th><th>Description</th><th>Total</th><th>Due</th><th>Status</th><th></th></tr></thead><tbody>
      ${state.invoices.map(i => `<tr><td>${i.number}</td><td>${i.party}</td><td>${i.desc}</td><td>${money(i.qty*i.price)}</td><td>${i.due}</td><td>${badge(i.status)}</td><td>${canEdit()&&i.status!=="Paid"?`<button class="icon-btn" data-pay="${i.id}">Mark paid</button>`:""}</td></tr>`).join("")}
    </tbody></table></div>`;
}
function viewMessages() {
  const thread = state.threads.find(t => t.id === ui.threadId) || state.threads[0];
  return `${head("Messages", "Project conversations", "")}
    <div class="msg"><div class="thread">${state.threads.map(t => `<button class="nav-btn ${t.id===thread.id?"active":""}" data-thread="${t.id}">${t.title}${t.unread?` <span class="badge b-warn">${t.unread}</span>`:""}</button>`).join("")}</div>
    <div class="card"><h3>${thread.title}</h3>${thread.messages.map(m => `<div class="bubble ${m.from===session.name?"me":""}"><strong>${m.from}</strong><p>${m.text}</p><span class="note">${m.time}</span></div>`).join("")}
    <form id="msg-form"><input id="msg-text" placeholder="Message the crew… mention a name" /><button class="btn" style="margin-top:8px">Send</button></form></div></div>`;
}
function viewDocs() {
  const rows = state.documents.filter(d => d.name.toLowerCase().includes(ui.query.toLowerCase()));
  return `${head("Documents", "Project files", canEdit()?`<button class="btn" id="add-doc">Register file</button>`:"")}
    <div class="card"><table><thead><tr><th>File</th><th>Category</th><th>Version</th><th>Updated</th></tr></thead><tbody>
      ${rows.map(d => `<tr><td>${d.name}</td><td>${d.category}</td><td>${d.ver}</td><td>${d.updated}</td></tr>`).join("")}
    </tbody></table><p class="note">Previews are metadata in this prototype. A backend would store the binaries.</p></div>`;
}
function viewAnalytics() {
  return `${head("Analytics", "Performance", projectSelect())}
    <div class="grid cols-2">
      <div class="card"><h3>Project performance</h3><div class="chart-box"><canvas id="c-perf"></canvas></div></div>
      <div class="card"><h3>Monthly expenditure</h3><div class="chart-box"><canvas id="c-month"></canvas></div></div>
    </div>
    <div class="grid cols-3" style="margin-top:14px">
      <div class="card"><h3>Efficiency</h3><p>Kericho is tracking ${project("p1").progress}% complete with ${Math.round(project("p1").spent/project("p1").budget*100)}% of budget used.</p></div>
      <div class="card"><h3>Delayed tasks</h3><p>${state.tasks.filter(t => t.status!=="Completed" && t.due < "2026-05-21").length} past internal review dates.</p></div>
      <div class="card"><h3>Workforce</h3><p>Average attendance ${Math.round(state.workers.reduce((s,w)=>s+w.attendance,0)/state.workers.length)}%.</p></div>
    </div>`;
}
function viewNotifs() {
  const rows = state.notifications.filter(n => ui.notifFilter === "All" || n.type === ui.notifFilter);
  return `${head("Notifications", "Alerts", `<button class="btn-ghost" id="read-all">Mark all read</button>`)}
    <div class="filters">${["All","Materials","Invoices","Equipment","Tasks","Reports","Budget"].map(f => `<button class="btn-ghost" data-nfilter="${f}">${f}</button>`).join("")}</div>
    <div class="grid">${rows.map(n => `<article class="card"><strong>${n.type}</strong> ${n.read?"":badge("In Progress")}<p>${n.text}</p><span class="note">${n.time}</span></article>`).join("")}</div>`;
}
function viewSettings() {
  return `${head("Settings", "Workspace", "")}<div class="card"><p>Theme, role, and demo data stay in this browser.</p>
    <button class="btn" id="theme-btn-2">Toggle theme</button>
    <button class="btn-ghost" id="reset-data">Reset demo data</button>
    <p class="note">Architecture is a local store so a future API can replace loadState/saveState without changing the screens.</p></div>`;
}
function viewProfile() {
  return `${head("Profile", session.role, `<button class="btn-ghost" id="logout">Sign out</button>`)}
    <div class="card"><div class="avatar">${session.name.split(" ").map(p=>p[0]).slice(0,2).join("")}</div><h2>${session.name}</h2><p>${session.role}<br>${session.email}<br>${session.phone}</p>
    <p class="note">Clients can review progress, invoices, and reports. Workers file site reports. Managers edit cost, tasks, and inventory.</p></div>`;
}
function viewMap() {
  return `${head("Interactive site map", "Kericho region", projectSelect())}<div id="map"></div><p class="note">Markers show the active site, a material delivery, plant, and nearby suppliers. Click a pin for details.</p>`;
}
function viewViewer() {
  return `${head("3D project viewer", project().name, "")}
    <div class="viewer-modes">
      <button class="btn" data-mode="exterior">Exterior</button>
      <button class="btn-ghost" data-mode="plan">Floor plan</button>
      <button class="btn-ghost" data-mode="rooms">Rooms</button>
      <button class="btn-ghost" data-mode="structure">Structural</button>
      <button class="btn-ghost" id="tog-furn">Toggle furniture</button>
    </div>
    <div class="split"><div id="viewer"></div><div class="card" id="part-info"><h3>Roofing</h3><p>Material: Stone-coated steel<br>Status: 82% complete<br>Cost: KSh 640,000</p><p class="note">Drag to orbit, scroll to zoom, right-drag to pan. Select a highlighted part.</p></div></div>`;
}

const views = { dashboard: viewDashboard, projects: viewProjects, workspace: viewWorkspace, timeline: viewTimeline, budget: viewBudget, materials: viewMaterials, workers: viewWorkers, tasks: viewTasks, reports: viewReports, equipment: viewEquipment, suppliers: viewSuppliers, invoices: viewInvoices, messages: viewMessages, documents: viewDocs, analytics: viewAnalytics, notifications: viewNotifs, settings: viewSettings, profile: viewProfile, map: viewMap, viewer: viewViewer };

function render() {
  document.body.dataset.theme = ui.theme;
  destroyCharts();
  if (mapRef) { mapRef.remove(); mapRef = null; }
  if (!session) return renderAuth();
  $("#app").innerHTML = shell(views[ui.view]());
  bind();
  mountCharts();
  if (ui.view === "map") mountMap();
  if (ui.view === "viewer") mountViewer();
  gsap.from(".card, .phase, .kpi", { y: 10, opacity: 0, duration: 0.35, stagger: 0.03 });
}

function bind() {
  document.body.onclick = (e) => {
    const nav = e.target.closest("[data-nav]");
    if (nav) { ui.view = nav.dataset.nav; $("#sidebar")?.classList.remove("open"); render(); return; }
    const open = e.target.closest("[data-open-project]");
    if (open) { ui.projectId = open.dataset.openProject; ui.view = "workspace"; render(); return; }
    const phase = e.target.closest("[data-phase]");
    if (phase) { ui.phaseId = phase.dataset.phase; render(); return; }
    const thread = e.target.closest("[data-thread]");
    if (thread) {
      ui.threadId = thread.dataset.thread;
      const t = state.threads.find(x => x.id === ui.threadId);
      if (t) t.unread = 0;
      saveState(state); render(); return;
    }
    if (e.target.closest("#menu-toggle")) $("#sidebar").classList.toggle("open");
    if (e.target.closest("#theme-btn") || e.target.closest("#theme-btn-2")) {
      ui.theme = ui.theme === "dark" ? "light" : "dark";
      localStorage.setItem("bw_theme", ui.theme);
      render();
    }
    if (e.target.closest("#logout")) { session = null; localStorage.removeItem("bw_session"); render(); }
    if (e.target.closest("#reset-data")) { localStorage.removeItem(BW_KEY); location.reload(); }
    if (e.target.closest("#add-expense")) openExpense();
    if (e.target.closest("#add-task")) openTask();
    if (e.target.closest("#add-report")) openReport();
    if (e.target.closest("#add-mat")) openMaterial();
    if (e.target.closest("#add-project")) openProject();
    if (e.target.closest("#add-worker")) openWorker();
    if (e.target.closest("#add-invoice")) openInvoice();
    if (e.target.closest("#add-doc")) openDoc();
    if (e.target.closest("#advance-phase")) advancePhase();
    if (e.target.closest("#export-exp")) exportExp();
    if (e.target.closest("#read-all")) { state.notifications.forEach(n => n.read = true); saveState(state); toast("Notifications cleared"); render(); }
    const del = e.target.closest("[data-del-exp]");
    if (del) { state.expenses = state.expenses.filter(x => x.id !== del.dataset.delExp); recalc(ui.projectId); logActivity("Expense removed"); toast("Expense deleted"); render(); }
    const pay = e.target.closest("[data-pay]");
    if (pay) { const inv = state.invoices.find(i => i.id === pay.dataset.pay); inv.status = "Paid"; logActivity(inv.number + " marked paid"); toast("Invoice paid"); saveState(state); render(); }
    const tv = e.target.closest("[data-taskview]");
    if (tv) { ui.taskView = tv.dataset.taskview; render(); }
    const nf = e.target.closest("[data-nfilter]");
    if (nf) { ui.notifFilter = nf.dataset.nfilter; render(); }
    const mode = e.target.closest("[data-mode]");
    if (mode && viewer) setViewerMode(mode.dataset.mode);
    if (e.target.closest("#tog-furn") && viewer) viewer.toggleFurn();
  };
  const sw = $("#project-switch");
  if (sw) sw.onchange = () => { ui.projectId = sw.value; render(); };
  const gs = $("#global-search");
  if (gs) gs.oninput = () => { ui.query = gs.value; if (["projects","budget","tasks","documents","dashboard"].includes(ui.view)) render(); };
  const msg = $("#msg-form");
  if (msg) msg.onsubmit = (e) => {
    e.preventDefault();
    const text = $("#msg-text").value.trim();
    if (!text) return;
    const t = state.threads.find(x => x.id === ui.threadId);
    t.messages.push({ from: session.name, text, time: "Now" });
    state.notifications.unshift({ id: uid("n"), type: "Messages", text: session.name + " posted in " + t.title, read: false, time: "Now" });
    logActivity("Message sent in " + t.title);
    toast("Message sent");
    render();
  };
  document.querySelectorAll(".kanban-col").forEach(col => {
    col.ondragover = (e) => e.preventDefault();
    col.ondrop = (e) => {
      const id = e.dataTransfer.getData("text");
      const task = state.tasks.find(t => t.id === id);
      if (!task) return;
      task.status = col.dataset.col;
      recalc(task.projectId);
      logActivity(task.name + " moved to " + task.status);
      toast("Task updated — progress recalculated");
      render();
    };
  });
  document.querySelectorAll(".task-card").forEach(card => {
    card.ondragstart = (e) => { e.dataTransfer.setData("text", card.dataset.task); card.classList.add("dragging"); };
  });
}

function modal(html) {
  $("#modal-root").innerHTML = `<div class="modal-back"><div class="modal">${html}<button class="btn-ghost" id="close-modal">Close</button></div></div>`;
  $("#close-modal").onclick = () => { $("#modal-root").innerHTML = ""; };
}
function openExpense() {
  modal(`<h3>Add expense</h3><form id="f"><label>Category</label><select name="category"><option>Materials</option><option>Labour</option><option>Transport</option><option>Equipment</option><option>Contractors</option><option>Permits</option><option>Professional services</option><option>Unexpected expenses</option></select><label>Vendor</label><input name="vendor" required /><label>Note</label><input name="note" /><label>Amount (KSh)</label><input name="amount" type="number" required /><button class="btn">Save</button></form>`);
  $("#f").onsubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    state.expenses.unshift({ id: uid("e"), projectId: ui.projectId, date: new Date().toISOString().slice(0,10), category: fd.get("category"), vendor: fd.get("vendor"), note: fd.get("note"), amount: Number(fd.get("amount")) });
    recalc(ui.projectId);
    logActivity("Expense posted to " + project().name);
    state.notifications.unshift({ id: uid("n"), type: "Budget", text: "New expense recorded on " + project().name, read: false, time: "Now" });
    $("#modal-root").innerHTML = "";
    toast("Expense saved and budget updated");
    render();
  };
}
function openTask() {
  modal(`<h3>New task</h3><form id="f"><label>Name</label><input name="name" required /><label>Phase</label><input name="phase" value="Finishing" /><label>Assignee</label><input name="assignee" value="Peter Langat" /><label>Due</label><input name="due" type="date" required /><label>Priority</label><select name="priority"><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select><button class="btn">Create</button></form>`);
  $("#f").onsubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    state.tasks.unshift({ id: uid("t"), name: fd.get("name"), projectId: ui.projectId, phase: fd.get("phase"), assignee: fd.get("assignee"), priority: fd.get("priority"), status: "To Do", start: new Date().toISOString().slice(0,10), due: fd.get("due"), deps: "—", notes: "" });
    recalc(ui.projectId); logActivity("Task created: " + fd.get("name"));
    $("#modal-root").innerHTML = ""; toast("Task added"); render();
  };
}
function openReport() {
  modal(`<h3>Site report</h3><form id="f"><label>Work completed</label><textarea name="done" required></textarea><label>Materials used</label><input name="materials" /><label>Problems</label><input name="issues" /><label>Weather</label><input name="weather" value="Clear" /><label>Workers present</label><input name="workers" type="number" value="10" /><button class="btn">Submit</button></form>`);
  $("#f").onsubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    state.reports.unshift({ id: uid("r"), projectId: ui.projectId, date: new Date().toISOString().slice(0,10), author: session.name, weather: fd.get("weather"), done: fd.get("done"), materials: fd.get("materials"), issues: fd.get("issues") || "None", workers: Number(fd.get("workers")), equipment: "As assigned", safety: "Checked", notes: "", photo: "https://images.unsplash.com/photo-1590494165264-1ebe3602eb80?auto=format&fit=crop&w=900&q=70" });
    const p = project();
    p.progress = Math.min(100, p.progress + 1);
    const phase = state.phases.find(ph => ph.projectId === p.id && ph.status === "In Progress");
    if (phase) phase.progress = Math.min(100, phase.progress + 2);
    logActivity("Site report filed by " + session.name);
    state.notifications.unshift({ id: uid("n"), type: "Reports", text: "New site report on " + p.name, read: false, time: "Now" });
    saveState(state);
    $("#modal-root").innerHTML = ""; toast("Report filed — progress nudged"); render();
  };
}
function openMaterial() {
  modal(`<h3>Receive stock</h3><form id="f"><label>Material</label><select name="id">${state.materials.filter(m=>m.projectId===ui.projectId).map(m=>`<option value="${m.id}">${m.name}</option>`).join("")}</select><label>Quantity in</label><input name="qty" type="number" required /><label>Cost</label><input name="cost" type="number" required /><button class="btn">Receive</button></form>`);
  $("#f").onsubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const m = state.materials.find(x => x.id === fd.get("id"));
    m.qty = Number(m.qty) + Number(fd.get("qty"));
    m.status = m.qty < m.min ? "Low" : "Available";
    state.expenses.unshift({ id: uid("e"), projectId: ui.projectId, date: new Date().toISOString().slice(0,10), category: "Materials", vendor: m.supplier, note: "Stock receipt: " + m.name, amount: Number(fd.get("cost")) });
    recalc(ui.projectId); logActivity(m.name + " stock received");
    $("#modal-root").innerHTML = ""; toast("Inventory and budget updated"); render();
  };
}
function openProject() {
  modal(`<h3>New project</h3><form id="f"><label>Name</label><input name="name" required /><label>Client</label><input name="client" required /><label>Location</label><input name="location" required /><label>Budget</label><input name="budget" type="number" required /><button class="btn">Create</button></form>`);
  $("#f").onsubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const id = uid("p");
    state.projects.push({ id, name: fd.get("name"), client: fd.get("client"), manager: session.name, location: fd.get("location"), lat: -0.37, lng: 35.29, start: new Date().toISOString().slice(0,10), end: "2026-12-15", phase: "Planning", progress: 4, budget: Number(fd.get("budget")), spent: 0, description: "Newly opened project.", status: "Active" });
    logActivity("Project opened: " + fd.get("name"));
    ui.projectId = id;
    $("#modal-root").innerHTML = ""; toast("Project created"); render();
  };
}
function openWorker() {
  modal(`<h3>Add worker</h3><form id="f"><label>Name</label><input name="name" required /><label>Role</label><input name="role" required /><label>Phone</label><input name="phone" /><button class="btn">Save</button></form>`);
  $("#f").onsubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    state.workers.push({ id: uid("w"), name: fd.get("name"), role: fd.get("role"), spec: "General", phone: fd.get("phone"), projectId: ui.projectId, hours: 0, attendance: 100, pay: 0, status: "Active", perf: 80 });
    saveState(state); $("#modal-root").innerHTML = ""; toast("Worker added"); render();
  };
}
function openInvoice() {
  modal(`<h3>Invoice</h3><form id="f"><label>Party</label><input name="party" required /><label>Description</label><input name="desc" required /><label>Total</label><input name="total" type="number" required /><label>Due</label><input name="due" type="date" required /><button class="btn">Save draft</button></form>`);
  $("#f").onsubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    state.invoices.unshift({ id: uid("i"), number: "INV-" + Math.floor(2100+Math.random()*80), party: fd.get("party"), projectId: ui.projectId, desc: fd.get("desc"), items: 1, qty: 1, price: Number(fd.get("total")), tax: 0, status: "Draft", due: fd.get("due") });
    saveState(state); $("#modal-root").innerHTML = ""; toast("Invoice drafted"); render();
  };
}
function openDoc() {
  modal(`<h3>Register document</h3><form id="f"><label>Name</label><input name="name" required /><label>Category</label><select name="category"><option>Contracts</option><option>Architectural drawings</option><option>Floor plans</option><option>Permits</option><option>Invoices</option><option>Receipts</option><option>Reports</option><option>Safety documents</option><option>Project specifications</option></select><button class="btn">Save</button></form>`);
  $("#f").onsubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    state.documents.unshift({ id: uid("d"), projectId: ui.projectId, name: fd.get("name"), category: fd.get("category"), ver: "1", updated: new Date().toISOString().slice(0,10) });
    saveState(state); $("#modal-root").innerHTML = ""; toast("Document registered"); render();
  };
}
function advancePhase() {
  const ph = state.phases.find(p => p.id === ui.phaseId);
  if (!ph) return;
  ph.progress = Math.min(100, ph.progress + 10);
  if (ph.progress === 100) ph.status = "Completed";
  else ph.status = "In Progress";
  const p = project();
  p.phase = ph.name;
  p.progress = Math.round(state.phases.filter(x => x.projectId === p.id).reduce((s,x)=>s+x.progress,0) / 8);
  logActivity(ph.name + " updated to " + ph.progress + "%");
  saveState(state); toast("Phase updated"); render();
}
function exportExp() {
  const rows = state.expenses.filter(e => e.projectId === ui.projectId);
  const csv = ["date,category,vendor,note,amount", ...rows.map(e => [e.date,e.category,e.vendor,e.note,e.amount].join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "buildwise-expenses.csv";
  a.click();
  toast("Export started");
}

function mountCharts() {
  const ink = themeColor();
  Chart.defaults.color = ink;
  Chart.defaults.borderColor = "rgba(120,100,80,0.15)";
  if ($("#c-budget")) {
    makeChart($("#c-budget"), { type: "bar", data: { labels: state.projects.map(p => p.name.split("—")[0]), datasets: [{ label: "Budget", data: state.projects.map(p=>p.budget), backgroundColor: "#e0d3c2" }, { label: "Spent", data: state.projects.map(p=>p.spent), backgroundColor: "#c56a24" }] }, options: { responsive: true, maintainAspectRatio: false } });
  }
  if ($("#c-tasks")) {
    const counts = ["To Do","In Progress","Review","Completed"].map(s => state.tasks.filter(t => t.status===s).length);
    makeChart($("#c-tasks"), { type: "doughnut", data: { labels: ["To Do","In Progress","Review","Completed"], datasets: [{ data: counts, backgroundColor: ["#d9cfc4","#2a5f8a","#e08a3c","#2f7d4a"] }] }, options: { responsive: true, maintainAspectRatio: false } });
  }
  if ($("#c-cat")) {
    const rows = state.expenses.filter(e => e.projectId === ui.projectId);
    const by = {};
    rows.forEach(e => by[e.category] = (by[e.category]||0)+Number(e.amount));
    makeChart($("#c-cat"), { type: "bar", data: { labels: Object.keys(by), datasets: [{ label: "KSh", data: Object.values(by), backgroundColor: "#c56a24" }] }, options: { responsive: true, maintainAspectRatio: false, indexAxis: "y" } });
  }
  if ($("#c-perf")) {
    makeChart($("#c-perf"), { type: "radar", data: { labels: state.projects.map(p=>p.name.split("—")[0].trim()), datasets: [{ label: "Progress", data: state.projects.map(p=>p.progress), borderColor: "#c56a24", backgroundColor: "rgba(197,106,36,0.2)" }] }, options: { responsive: true, maintainAspectRatio: false } });
  }
  if ($("#c-month")) {
    makeChart($("#c-month"), { type: "line", data: { labels: ["Jan","Feb","Mar","Apr","May"], datasets: [{ label: "Expenditure", data: [420000,680000,910000,760000,402000], borderColor: "#c56a24", tension: 0.35 }] }, options: { responsive: true, maintainAspectRatio: false } });
  }
}

function mountMap() {
  const p = project();
  mapRef = L.map("map").setView([p.lat, p.lng], 12);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "&copy; OpenStreetMap" }).addTo(mapRef);
  L.marker([p.lat, p.lng]).addTo(mapRef).bindPopup(`<b>${p.name}</b><br>${p.location}<br>${p.progress}% complete`);
  L.marker([p.lat + 0.01, p.lng + 0.012]).addTo(mapRef).bindPopup("Sand delivery — Kericho Aggregates");
  L.marker([p.lat - 0.008, p.lng + 0.006]).addTo(mapRef).bindPopup("Hoist & mixer on site");
  state.suppliers.slice(0, 3).forEach((s, i) => {
    L.circleMarker([p.lat + 0.02 * (i - 1), p.lng - 0.02], { radius: 7, color: "#c56a24" }).addTo(mapRef).bindPopup(`<b>${s.name}</b><br>${s.products}`);
  });
}

function mountViewer() {
  const el = $("#viewer");
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1714);
  const camera = new THREE.PerspectiveCamera(45, el.clientWidth / el.clientHeight, 0.1, 100);
  camera.position.set(8, 6, 10);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(el.clientWidth, el.clientHeight);
  el.innerHTML = "";
  el.appendChild(renderer.domElement);
  scene.add(new THREE.AmbientLight(0xffffff, 0.7));
  const sun = new THREE.DirectionalLight(0xfff1dd, 1.1);
  sun.position.set(6, 10, 4);
  scene.add(sun);
  const ground = new THREE.Mesh(new THREE.CircleGeometry(8, 40), new THREE.MeshStandardMaterial({ color: 0x3d4a34 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.01;
  scene.add(ground);
  const parts = {};
  function add(name, geo, mat, pos, info) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(...pos);
    mesh.userData.info = info;
    scene.add(mesh);
    parts[name] = mesh;
    return mesh;
  }
  const wall = new THREE.MeshStandardMaterial({ color: 0xe7d7c3 });
  const roofM = new THREE.MeshStandardMaterial({ color: 0x6e4b3a });
  const glass = new THREE.MeshStandardMaterial({ color: 0x9ec4d6, transparent: true, opacity: 0.55 });
  add("walls", new THREE.BoxGeometry(5, 2.4, 4), wall, [0, 1.2, 0], { title: "External walls", body: "Material: Machine-cut stone & plaster<br>Status: 100% complete<br>Cost: KSh 1,240,000" });
  add("roof", new THREE.ConeGeometry(3.6, 1.5, 4), roofM, [0, 3.1, 0], { title: "Roofing", body: "Material: Stone-coated steel<br>Status: 82% complete<br>Cost: KSh 640,000" });
  parts.roof.rotation.y = Math.PI / 4;
  add("glazing", new THREE.BoxGeometry(1.6, 1.1, 0.08), glass, [0, 1.3, 2.02], { title: "Glazing", body: "Material: Powder-coated aluminium<br>Status: 54% complete<br>Cost: KSh 310,000" });
  const furn = add("furniture", new THREE.BoxGeometry(1.4, 0.4, 0.6), new THREE.MeshStandardMaterial({ color: 0xc56a24 }), [0.6, 0.3, 0.4], { title: "Joinery", body: "Kitchen carcass scheduled after wet-area tiles." });
  const slab = add("slab", new THREE.BoxGeometry(5.2, 0.2, 4.2), new THREE.MeshStandardMaterial({ color: 0xb7b1a8 }), [0, 0.1, 0], { title: "Ground slab", body: "Status: Complete<br>Cost: KSh 480,000" });
  let dragging = false, lx = 0, ly = 0, btn = 0;
  renderer.domElement.onpointerdown = (e) => { dragging = true; lx = e.clientX; ly = e.clientY; btn = e.button; };
  window.onpointerup = () => dragging = false;
  renderer.domElement.onpointermove = (e) => {
    if (!dragging) return;
    const dx = e.clientX - lx, dy = e.clientY - ly;
    lx = e.clientX; ly = e.clientY;
    if (btn === 2) { camera.position.x -= dx * 0.01; camera.position.y += dy * 0.01; }
    else { const a = dx * 0.01; camera.position.applyAxisAngle(new THREE.Vector3(0,1,0), a); }
  };
  renderer.domElement.oncontextmenu = (e) => e.preventDefault();
  renderer.domElement.onwheel = (e) => { camera.position.multiplyScalar(e.deltaY > 0 ? 1.05 : 0.95); };
  renderer.domElement.onclick = (e) => {
    const rect = renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(((e.clientX-rect.left)/rect.width)*2-1, -((e.clientY-rect.top)/rect.height)*2+1);
    const ray = new THREE.Raycaster();
    ray.setFromCamera(mouse, camera);
    const hit = ray.intersectObjects(Object.values(parts))[0];
    if (hit && hit.object.userData.info) {
      const info = hit.object.userData.info;
      $("#part-info").innerHTML = `<h3>${info.title}</h3><p>${info.body}</p>`;
    }
  };
  function loop() {
    if (ui.view !== "viewer") return;
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }
  loop();
  viewer = {
    toggleFurn() { furn.visible = !furn.visible; },
  };
  window.setViewerMode = (mode) => {
    parts.roof.visible = mode !== "plan" && mode !== "structure";
    parts.glazing.visible = mode !== "structure";
    parts.walls.material.opacity = mode === "structure" || mode === "plan" ? 0.25 : 1;
    parts.walls.material.transparent = mode === "structure" || mode === "plan";
    furn.visible = mode === "rooms" || mode === "exterior";
    if (mode === "plan") camera.position.set(0.1, 12, 0.1);
    else camera.position.set(8, 6, 10);
    camera.lookAt(0, 1, 0);
    toast(mode + " view");
  };
  camera.lookAt(0, 1, 0);
}

render();

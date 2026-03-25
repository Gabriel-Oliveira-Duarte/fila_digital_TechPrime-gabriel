console.log("[AO VIVO] app_fila_ao_vivo.js (API /api) carregou");

function obterNomeEstabelecimento() {
  const direct =
    localStorage.getItem("nomeEstabelecimento") ||
    localStorage.getItem("estabelecimento_nome") ||
    localStorage.getItem("nome_estabelecimento") ||
    localStorage.getItem("estab_nome");

  if (direct && direct.trim()) return direct.trim();

  const possibleJsonKeys = ["estabelecimento", "biz", "usuarioEstab"];
  for (const k of possibleJsonKeys) {
    const raw = localStorage.getItem(k);
    if (!raw) continue;
    try {
      const obj = JSON.parse(raw);
      const name = obj?.nome || obj?.nomeEstabelecimento || obj?.estabelecimento_nome;
      if (name && String(name).trim()) return String(name).trim();
    } catch {}
  }
  return null;
}

function preencherNomeNoTopo() {
  const nome = obterNomeEstabelecimento();
  const el = document.getElementById("nomeEstabelecimento");
  const header = document.getElementById("estabHeader");
  if (el) el.textContent = nome || "—";
  if (header) header.title = `Estabelecimento: ${nome || "—"}`;
}

document.addEventListener("DOMContentLoaded", preencherNomeNoTopo);

const sidebar = document.getElementById("sidebar");
const backdrop = document.getElementById("backdrop");
const menuBtn = document.getElementById("menuBtn");

function openSidebar(){
  if (!sidebar || !backdrop) return;
  sidebar.classList.add("open");
  backdrop.classList.add("show");
}
function closeSidebar(){
  if (!sidebar || !backdrop) return;
  sidebar.classList.remove("open");
  backdrop.classList.remove("show");
}

if (menuBtn) menuBtn.addEventListener("click", openSidebar);
if (backdrop) backdrop.addEventListener("click", closeSidebar);

const API_BASE = window.location.origin;

const ENDPOINTS = {
  listarFilas: (estabId, status) => {
    const qs = new URLSearchParams();
    if (estabId) qs.set("estabelecimento_id", estabId);
    if (status) qs.set("status", status);
    const q = qs.toString();
    return `${API_BASE}/api/filas${q ? "?" + q : ""}`;
  },
  abrirFila:   (id) => `${API_BASE}/api/filas/${encodeURIComponent(id)}/abrir`,
  fecharFila:  (id) => `${API_BASE}/api/filas/${encodeURIComponent(id)}/fechar`,
  excluirFila: (id) => `${API_BASE}/api/filas/${encodeURIComponent(id)}/excluir`,
  listarClientes: (id) => `${API_BASE}/api/filas/${encodeURIComponent(id)}/clientes`,
};

const filasGrid = document.getElementById("filasGrid");
const buscaFila = document.getElementById("buscaFila");
const filtroAbertas = document.getElementById("filtroAbertas");
const filtroFechadas = document.getElementById("filtroFechadas");
const filtroTodas = document.getElementById("filtroTodas");
const filtroExcluidas = document.getElementById("filtroExcluidas"); 

const queueList = document.getElementById("queueList");
const queueCountLabel = document.getElementById("queueCountLabel");
const btnRefresh = document.getElementById("btnRefresh");
const connText = document.getElementById("connText");

let filtroStatus = "ABERTA"; 
let filas = [];
let filaAtualId = null;
let filaAtualNome = null;
let clientes = [];
let buscaTexto = "";

function getEstabId(){
  const tryKeys = ["estabelecimento_id", "estab_id", "idEstabelecimento"];
  for (const k of tryKeys){
    const v = localStorage.getItem(k);
    if (v && String(v).trim()) return String(v).trim();
  }
  try {
    const raw = localStorage.getItem("estabelecimento");
    if (raw){
      const obj = JSON.parse(raw);
      if (obj?.id || obj?.idEstabelecimento) return String(obj.id || obj.idEstabelecimento);
    }
  } catch {}
  return null;
}

function setConn(txt){ if (connText) connText.textContent = txt; }

function setActiveChip(which){
  [filtroAbertas, filtroFechadas, filtroTodas, filtroExcluidas]
    .forEach(b => b && b.classList.remove("active"));
  if (which) which.classList.add("active");
}

function escapeHtml(str){
  return String(str ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function pad3(n){ return String(n).padStart(3,"0"); }

function statusPillCliente(s){
  if (s === "no_raio"){
    return `<span class="pill pill-green"><i class="bi bi-geo-alt"></i> No raio</span>`;
  }
  return `<span class="pill pill-gray"><i class="bi bi-slash-circle"></i> Fora</span>`;
}

async function apiFetch(url, options = {}){
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });

  if (!res.ok){
    let detail = "";
    try {
      const j = await res.json();
      detail = j?.detail ? ` (${j.detail})` : "";
    } catch {}
    throw new Error(`HTTP ${res.status}${detail}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

function badgeFila(status){
  const s = String(status || "").toUpperCase();
  if (s === "ABERTA")   return `<span class="badge ABERTA"><i class="bi bi-unlock"></i> ABERTA</span>`;
  if (s === "FECHADA")  return `<span class="badge FECHADA"><i class="bi bi-lock"></i> FECHADA</span>`;
  if (s === "EXCLUIDA") return `<span class="badge EXCLUIDA"><i class="bi bi-trash"></i> EXCLUIDA</span>`;
  return `<span class="badge">${escapeHtml(s)}</span>`;
}

function filaCardTemplate(f){
  const id = f.idFila ?? f.id;
  const nome = f.nome ?? `Fila ${id}`;
  const status = (f.status || "ABERTA").toUpperCase();
  const selected = String(id) === String(filaAtualId) ? " selected" : "";

  let actions = "";

  if (status === "ABERTA"){
    actions = `
      <button class="btn small" data-action="fechar" data-id="${id}" type="button">
        <i class="bi bi-lock"></i> Fechar
      </button>

      <button class="icon-x" data-action="excluir" data-id="${id}" type="button" title="Excluir fila">
        <i class="bi bi-x-lg"></i>
        <span class="x-text">Excluir fila</span>
      </button>
    `;
  } else if (status === "FECHADA"){
    actions = `
      <button class="btn small" data-action="abrir" data-id="${id}" type="button">
        <i class="bi bi-unlock"></i> Abrir
      </button>

      <button class="icon-x" data-action="excluir" data-id="${id}" type="button" title="Excluir fila">
        <i class="bi bi-x-lg"></i>
        <span class="x-text">Excluir fila</span>
      </button>
    `;
  } else {
    actions = ``;
  }

  return `
    <div class="fila-card${selected}" data-pick-id="${id}">
      <div class="fila-card__top">
        <div class="fila-card__name">${escapeHtml(nome)}</div>
        ${badgeFila(status)}
      </div>
      ${actions ? `<div class="fila-card__actions">${actions}</div>` : ``}
    </div>
  `;
}

function itemTemplate(item){
  return `
    <div class="queue-item" data-num="${item.num}">
      <div class="left">
        <div class="tag-num">#${pad3(item.num)}</div>
        <div class="info">
          <div class="name">${escapeHtml(item.nome)}</div>
          <div class="meta">
            <span><i class="bi bi-clock"></i> ${escapeHtml(item.hora || "--:--")}</span>
            <span>•</span>
            <span>${escapeHtml(item.tempo || "")}</span>
            <span>•</span>
            <span>${escapeHtml(item.estimativa || "—")}</span>
          </div>
        </div>
      </div>
      <div class="right">
        ${statusPillCliente(item.status)}
      </div>
    </div>
  `;
}

function renderFilas(){
  if (!filasGrid) return;

  const q = (buscaTexto || "").trim().toLowerCase();
  const filtradas = q
    ? filas.filter(f => String(f.nome ?? "").toLowerCase().includes(q))
    : filas;

  if (!filtradas.length){
    filasGrid.innerHTML = `<p style="opacity:.6;font-size:12px">Nenhuma fila encontrada.</p>`;
    return;
  }

  filasGrid.innerHTML = filtradas.map(filaCardTemplate).join("");

  filasGrid.querySelectorAll("[data-pick-id]").forEach(card => {
    card.addEventListener("click", (e) => {
      if (e.target.closest("button")) return;
      const id = card.getAttribute("data-pick-id");
      const f = filas.find(x => String((x.idFila ?? x.id)) === String(id));
      if (!f) return;

      const st = String(f.status || "").toUpperCase();
      if (st === "EXCLUIDA") return; 
      selecionarFila(f);
    });
  });

  filasGrid.querySelectorAll("button[data-action]").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const action = btn.getAttribute("data-action");
      const id = btn.getAttribute("data-id");

      try{
        if (action === "abrir")  await apiFetch(ENDPOINTS.abrirFila(id), { method: "PATCH" });
        if (action === "fechar") await apiFetch(ENDPOINTS.fecharFila(id), { method: "PATCH" });

        if (action === "excluir"){
          if (!confirm(`Excluir a fila #${id}? Ela ficará como EXCLUIDA.`)) return;
          await apiFetch(ENDPOINTS.excluirFila(id), { method: "PATCH" });
          if (String(id) === String(filaAtualId)){
            filaAtualId = null;
            filaAtualNome = null;
            clientes = [];
            renderClientes();
          }
        }

        await carregarFilas();
      } catch(err){
        alert(`Falha: ${err.message || err}`);
      }
    });
  });
}

function renderClientes(){
  const nomeFilaTxt = filaAtualNome ? `${filaAtualNome}` : "—";
  if (queueCountLabel) queueCountLabel.textContent = nomeFilaTxt;

  if (!filaAtualId){
    if (filtroStatus === "ABERTA"){
      if (queueList) {
        queueList.innerHTML = `<p style="opacity:.6;font-size:12px">Selecione uma fila para visualizar os clientes.</p>`;
      }
    } else {
      if (queueList) queueList.innerHTML = ``;
    }
    return;
  }

  const filaObj = filas.find(f => String((f.idFila ?? f.id)) === String(filaAtualId));
  const statusFilaAtual = String(filaObj?.status || "").toUpperCase();

  if (statusFilaAtual !== "ABERTA"){
    if (queueList) queueList.innerHTML = ``;
    return;
  }

  if (!clientes.length){
    if (queueList) queueList.innerHTML = `<p style="opacity:.6;font-size:12px">Nenhum cliente na fila.</p>`;
    return;
  }

  if (queueList) queueList.innerHTML = clientes.map(itemTemplate).join("");
}

function selecionarFila(f){
  const id = f.idFila ?? f.id;
  filaAtualId = id;
  filaAtualNome = f.nome ?? `Fila ${id}`;
  carregarClientesDaFila();
  renderFilas();
}

async function carregarFilas(){
  setConn("Conexão: API");

  const estabId = getEstabId();
  const url = ENDPOINTS.listarFilas(estabId, filtroStatus || undefined);
  const data = await apiFetch(url);

  filas = Array.isArray(data) ? data : [];
  renderFilas();

  if (filtroStatus === "EXCLUIDA"){
    filaAtualId = null;
    filaAtualNome = null;
    clientes = [];
    renderClientes();
    return;
  }

  const existe = filas.some(f => String((f.idFila ?? f.id)) === String(filaAtualId));
  if (!existe){
    const primeiraValida = filas.find(f => String(f.status || "").toUpperCase() !== "EXCLUIDA");
    if (primeiraValida){
      selecionarFila(primeiraValida);
    } else {
      filaAtualId = null;
      filaAtualNome = null;
      clientes = [];
      renderClientes();
    }
  }
}

async function carregarClientesDaFila(){
  if (!filaAtualId){
    clientes = [];
    renderClientes();
    return;
  }
  const data = await apiFetch(ENDPOINTS.listarClientes(filaAtualId));
  clientes = Array.isArray(data) ? data : [];
  renderClientes();
}

if (buscaFila){
  buscaFila.addEventListener("input", () => {
    buscaTexto = buscaFila.value || "";
    renderFilas();
  });
}

if (filtroAbertas) filtroAbertas.addEventListener("click", async () => {
  filtroStatus = "ABERTA";
  setActiveChip(filtroAbertas);
  await carregarFilas();
});

if (filtroFechadas) filtroFechadas.addEventListener("click", async () => {
  filtroStatus = "FECHADA";
  setActiveChip(filtroFechadas);
  await carregarFilas();
});

if (filtroExcluidas) filtroExcluidas.addEventListener("click", async () => {
  filtroStatus = "EXCLUIDA";
  setActiveChip(filtroExcluidas);
  await carregarFilas();
});

if (filtroTodas) filtroTodas.addEventListener("click", async () => {
  filtroStatus = null; 
  setActiveChip(filtroTodas);
  await carregarFilas();
});

if (btnRefresh) btnRefresh.addEventListener("click", async () => {
  try{
    await carregarFilas();
    await carregarClientesDaFila();
  } catch(err){
    alert(`Falha: ${err.message || err}`);
  }
});


document.addEventListener("DOMContentLoaded", async () => {
  try{
    setActiveChip(filtroAbertas);
    await carregarFilas();
    await carregarClientesDaFila();
  } catch(err){
    console.error(err);
    setConn("Conexão: falhou (API)");
    if (filasGrid) filasGrid.innerHTML = `<p style="opacity:.6;font-size:12px">Erro ao carregar filas da API.</p>`;
  }
});

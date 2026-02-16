// ================= SIDEBAR MOBILE =================
const sidebar = document.getElementById("sidebar");
const backdrop = document.getElementById("backdrop");
const menuBtn = document.getElementById("menuBtn");

function openSidebar() {
  sidebar?.classList.add("open");
  backdrop?.classList.add("show");
}
function closeSidebar() {
  sidebar?.classList.remove("open");
  backdrop?.classList.remove("show");
}
menuBtn?.addEventListener("click", openSidebar);
backdrop?.addEventListener("click", closeSidebar);

// ================= BASES =================
// API e FRONT no mesmo FastAPI
const ORIGIN = window.location.origin;
const API_BASE = ORIGIN; // /api/...
const LOCAL_TEMPLATES_BASE = ORIGIN + "/templates/"; // para abrir páginas localmente

// ✅ Vai ser preenchido com o NGROK salvo no backend (se existir)
let PUBLIC_ORIGIN = "";

// ================= ELEMENTOS =================
const filaList = document.getElementById("filaList");
const filaNomeTop = document.getElementById("filaNomeTop");
const filaLink = document.getElementById("filaLink");
const btnOpenLink = document.getElementById("btnOpenLink");

const qrBox = document.getElementById("qrBox");
const btnBaixar = document.getElementById("btnBaixar");
const btnCopiar = document.getElementById("btnCopiar");
const btnImprimir = document.getElementById("btnImprimir");
const toast = document.getElementById("toast");

// ================= ESTADO =================
let filas = [];
let filaSelecionada = null;
let linkSelecionado = "";

// ================= HELPERS =================
function showToast(msg) {
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 1500);
}

function clearQr() {
  if (!qrBox) return;
  qrBox.innerHTML = "";
}

function renderQr(text) {
  if (typeof QRCode === "undefined") {
    showToast("Erro: QRCode não carregou. Verifique /static/js/qrcodegen.js");
    return;
  }

  clearQr();
  new QRCode(qrBox, {
    text,
    width: 230,
    height: 230,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H,
  });
}

function normalizarFila(item) {
  const id =
    item.id ??
    item.idFila ??
    item.id_fila ??
    item.idFilaDigital ??
    item.idFilaINT ??
    item.idFilaPk;

  return {
    ...item,
    __id: id,
    nome: item.nome || item.nome_fila || item.fila_nome || (id ? `Fila #${id}` : "Fila"),
    status: item.status || item.status_fila,
    ativa: item.ativa ?? (String(item.status || "").toUpperCase() === "ABERTA"),
  };
}

// ================= ✅ Pega NGROK salvo no backend =================
async function carregarPublicUrl() {
  try {
    const res = await fetch(`${API_BASE}/api/public-url`, { cache: "no-store" });
    if (!res.ok) return;

    const data = await res.json().catch(() => null);
    const url = (data?.public_url || "").trim().replace(/\/+$/, "");

    if (url.startsWith("http://") || url.startsWith("https://")) {
      PUBLIC_ORIGIN = url;
    }
  } catch {
    // se falhar, segue com origin local mesmo
  }
}

// ================= LINK PARA CLIENTE (QR) =================
// ✅ Se PUBLIC_ORIGIN existir -> QR usa NGROK
// ✅ Se não existir -> QR usa o local (útil para teste)
function gerarLinkCliente(filaId) {
  const base = (PUBLIC_ORIGIN || ORIGIN).replace(/\/+$/, "");
  const url = new URL(`${base}/templates/login.html`);
  url.searchParams.set("next", "Fila_cliente.html");
  url.searchParams.set("filaId", String(filaId));
  return url.toString();
}

// ================= LISTA DE FILAS =================
function renderLista() {
  if (!filaList) return;

  if (!filas.length) {
    filaList.innerHTML = `<p style="opacity:.6">Nenhuma fila encontrada.</p>`;
    return;
  }

  filaList.innerHTML = filas
    .map((f) => {
      const id = f.__id;
      const nome = f.nome || `Fila #${id}`;
      const statusRaw = f.status || (f.ativa ? "ABERTA" : "FECHADA");
      const status = String(statusRaw || "").toUpperCase();
      const isOpen = status === "ABERTA" || f.ativa === true;

      const isSelected = String(id) === String(filaSelecionada?.__id);

      return `
        <div class="queue-card ${isSelected ? "" : "inactive"}" data-id="${String(id)}">
          <div>
            <div class="queue-title">${nome}</div>
            <div class="queue-sub">Status: ${status || "-"}</div>
          </div>
          <span class="badge">${isOpen ? "Aberta" : "Fechada"}</span>
        </div>
      `;
    })
    .join("");

  filaList.querySelectorAll(".queue-card").forEach((card) => {
    card.addEventListener("click", () => {
      const id = String(card.dataset.id || "");
      const f = filas.find((x) => String(x.__id) === id);
      if (!f) return;

      filaSelecionada = f;
      renderTudo();
    });
  });
}

// ================= RENDER PRINCIPAL =================
function renderTudo() {
  renderLista();

  if (!filaSelecionada) return;

  const id = filaSelecionada.__id;
  const nome = filaSelecionada.nome || `Fila #${id}`;

  linkSelecionado = gerarLinkCliente(id);

  if (filaNomeTop) filaNomeTop.textContent = nome;

  if (filaLink) {
    filaLink.textContent = linkSelecionado;
    filaLink.href = linkSelecionado;
  }

  renderQr(linkSelecionado);
}

// ================= AÇÕES =================
btnOpenLink?.addEventListener("click", () => {
  if (!linkSelecionado) return;
  window.open(linkSelecionado, "_blank", "noopener");
});

btnCopiar?.addEventListener("click", async () => {
  if (!linkSelecionado) return;

  try {
    await navigator.clipboard.writeText(linkSelecionado);
    showToast("Link copiado!");
  } catch {
    const temp = document.createElement("textarea");
    temp.value = linkSelecionado;
    document.body.appendChild(temp);
    temp.select();
    document.execCommand("copy");
    temp.remove();
    showToast("Link copiado!");
  }
});

btnBaixar?.addEventListener("click", () => {
  const img = qrBox?.querySelector("img");
  const canvas = qrBox?.querySelector("canvas");

  let dataUrl = "";
  if (canvas) dataUrl = canvas.toDataURL("image/png");
  else if (img) dataUrl = img.src;

  if (!dataUrl) return showToast("Erro ao baixar.");

  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = `QR_Fila_${filaSelecionada?.__id || "fila"}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  showToast("Baixado!");
});

btnImprimir?.addEventListener("click", () => {
  const img = qrBox?.querySelector("img");
  const canvas = qrBox?.querySelector("canvas");

  let dataUrl = "";
  if (canvas) dataUrl = canvas.toDataURL("image/png");
  else if (img) dataUrl = img.src;

  if (!dataUrl) return showToast("Erro ao imprimir.");

  const w = window.open("", "_blank", "noopener");
  if (!w) return;

  const nome = filaSelecionada?.nome || `Fila #${filaSelecionada?.__id || ""}`;

  w.document.write(`
    <html>
      <head><title>Imprimir QR</title></head>
      <body style="display:grid;place-items:center;height:100vh;margin:0">
        <div style="text-align:center;font-family:Arial;max-width:90vw">
          <h2>${nome}</h2>
          <img src="${dataUrl}" width="300" height="300"/>
          <p style="word-break:break-all">${linkSelecionado}</p>
        </div>
        <script>window.onload=()=>window.print()</script>
      </body>
    </html>
  `);

  w.document.close();
});

// ================= CARREGAR FILAS =================
async function carregarFilas() {
  try {
    const res = await fetch(`${API_BASE}/api/filas`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    filas = (Array.isArray(data) ? data : []).map(normalizarFila);

    filaSelecionada = filas.find((f) => f.ativa === true) || filas[0] || null;

    renderTudo();
  } catch (err) {
    console.error("Erro carregarFilas:", err);
    if (filaList) filaList.innerHTML = `<p style="opacity:.6">Erro ao carregar filas.</p>`;
    showToast("Erro ao carregar filas");
  }
}

// ================= INIT =================
(async function init() {
  await carregarPublicUrl(); // ✅ pega o NGROK do backend
  await carregarFilas();     // ✅ lista filas e gera QR
})();

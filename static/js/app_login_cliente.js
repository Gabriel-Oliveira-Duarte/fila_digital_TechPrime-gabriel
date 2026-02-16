// ================= HELPERS =================
function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function getFilaId() {
  return getParam("filaId");
}

function getNextPage() {
  // vem do QR: next=Fila_cliente.html
  return getParam("next") || "Fila_cliente.html";
}

// Base (funciona em localhost e ngrok)
const ORIGIN = window.location.origin;
const TEMPLATES_BASE = (window.TEMPLATES_BASE || (ORIGIN + "/templates/"));

// ================= ELEMENTOS =================
const form = document.getElementById("form");
const nomeInput = document.getElementById("nome");
const errorEl = document.getElementById("error");

const overlay = document.getElementById("overlay");
const successName = document.getElementById("successName");
const queueNumber = document.getElementById("queueNumber");

const btnAcompanhar = document.querySelector(".successBtn");

// ================= VALIDAÇÃO =================
function nomeValido(nome) {
  return nome && nome.trim().length >= 3;
}

// ================= ABRIR SUCESSO =================
function abrirSucesso(nome) {
  successName.textContent = nome;
  queueNumber.textContent = "#001"; // aqui depois você pode trocar por posição real da API

  overlay.classList.add("show");
  overlay.setAttribute("aria-hidden", "false");
  document.body.classList.add("lock");
}

// ================= IR PARA FILA =================
function irParaFila() {
  const filaId = getFilaId();
  const next = getNextPage();

  if (!filaId) {
    alert("Link inválido. Entre pela leitura do QR Code.");
    return;
  }

  // monta URL absoluta (garante /templates/ mesmo no celular/ngrok)
  const url = new URL(next, TEMPLATES_BASE);
  url.searchParams.set("filaId", String(filaId));

  window.location.href = url.toString();
}

// ================= EVENTOS =================
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const nome = nomeInput.value.trim();

  if (!nomeValido(nome)) {
    errorEl.textContent = "Digite um nome válido (mínimo 3 caracteres).";
    return;
  }

  errorEl.textContent = "";

  // salva nome pro Fila_cliente.html usar
  localStorage.setItem("CLIENTE_NOME", nome);

  abrirSucesso(nome);
});

btnAcompanhar.addEventListener("click", irParaFila);

// Editar nome
document.getElementById("editNameBtn")?.addEventListener("click", () => {
  overlay.classList.remove("show");
  document.body.classList.remove("lock");
  nomeInput.focus();
});

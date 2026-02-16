// static/js/app_LoginCnpj.js

// 🔹 FastAPI rodando em 8010
const API_BASE = "http://127.0.0.1:8010";

// ================= FETCH =================
async function postJSON(path, data) {
  const url = API_BASE + path;

  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch {
    throw new Error("Falha ao conectar com a API.");
  }

  let payload = null;
  let raw = "";

  try { payload = await res.json(); }
  catch { raw = await res.text().catch(() => ""); }

  if (!res.ok) {
    throw new Error(payload?.detail || raw || `Erro HTTP ${res.status}`);
  }

  return payload;
}

// ================= HELPERS =================
function existe(el) { return el !== null && el !== undefined; }
function onlyDigits(v) { return (v || "").replace(/\D/g, ""); }

function emailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((email || "").toLowerCase());
}

function normalizarEmail(email) {
  return (email || "").trim().toLowerCase();
}

// ================= ELEMENTOS =================
const bizError = document.getElementById("bizError");

const signupError = document.getElementById("signupError");
const signupError2 = document.getElementById("signupError2");

const modeBiz = document.getElementById("modeBiz");
const modeBizSignup = document.getElementById("modeBizSignup");

const signupBtn = document.getElementById("signupBtn");
const signupBackToLogin1 = document.getElementById("signupBackToLogin1");

const bizEmail = document.getElementById("bizEmail");
const bizPass = document.getElementById("bizPass");
const btnBiz = document.getElementById("btnBiz");

const signupStep1 = document.getElementById("signupStep1");
const signupStep2 = document.getElementById("signupStep2");

const btnSignupContinue = document.getElementById("btnSignupContinue");
const goPrevStepBtn = document.getElementById("goPrevStepBtn");
const btnSignupBiz = document.getElementById("btnSignupBiz");

const signupBizName = document.getElementById("signupBizName");
const signupBizCnpj = document.getElementById("signupBizCnpj");
const signupBizCategory = document.getElementById("signupBizCategory");
const signupBizCity = document.getElementById("signupBizCity");
const signupBizUF = document.getElementById("signupBizUF");
const signupBizPhone = document.getElementById("signupBizPhone");

const signupBizEmail = document.getElementById("signupBizEmail");
const signupBizPass = document.getElementById("signupBizPass");
const signupBizPass2 = document.getElementById("signupBizPass2");

// ================= LOCAL STORAGE =================
const STORAGE_KEY_BIZ = "andalogo_estabelecimentos";

function getBizDB() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY_BIZ) || "{}"); }
  catch { return {}; }
}

function setBizDB(db) {
  localStorage.setItem(STORAGE_KEY_BIZ, JSON.stringify(db));
}

// ================= UI =================
function mostrarApenas(target) {
  [modeBiz, modeBizSignup].forEach(m => m?.classList.add("hidden"));
  target?.classList.remove("hidden");
}

function abrirModoBiz() { mostrarApenas(modeBiz); }
function abrirModoBizSignup() {
  mostrarApenas(modeBizSignup);
  mostrarSignupEtapa(1);
}

function mostrarSignupEtapa(etapa) {
  if (etapa === 1) {
    signupStep1?.classList.remove("hidden");
    signupStep2?.classList.add("hidden");
  } else {
    signupStep1?.classList.add("hidden");
    signupStep2?.classList.remove("hidden");
  }
}

// ================= NAVEGAÇÃO =================
signupBtn?.addEventListener("click", abrirModoBizSignup);
signupBackToLogin1?.addEventListener("click", abrirModoBiz);
goPrevStepBtn?.addEventListener("click", () => mostrarSignupEtapa(1));

// ================= VALIDAÇÃO ETAPA 1 =================
function validarEtapa1() {
  if (!signupBizName.value.trim()) return "Digite o nome.";
  if (onlyDigits(signupBizCnpj.value).length !== 14) return "CNPJ inválido.";
  if (!signupBizCategory.value) return "Selecione categoria.";
  if (!signupBizCity.value.trim()) return "Digite a cidade.";
  if (!signupBizUF.value) return "Selecione UF.";
  if (onlyDigits(signupBizPhone.value).length < 10) return "Telefone inválido.";
  return "";
}

btnSignupContinue?.addEventListener("click", () => {
  const msg = validarEtapa1();
  if (msg) {
    signupError.textContent = msg;
    return;
  }
  signupError.textContent = "";
  mostrarSignupEtapa(2);
});

// ================= VALIDAÇÃO ETAPA 2 =================
function validarEtapa2() {
  const email = signupBizEmail.value.trim();
  const p1 = signupBizPass.value;
  const p2 = signupBizPass2.value;

  if (!emailValido(email)) return "Email inválido.";
  if (p1.length < 8) return "Senha mínima 8 caracteres.";
  if (p1 !== p2) return "Senhas não coincidem.";
  return "";
}

// ================= CADASTRO =================
btnSignupBiz?.addEventListener("click", async () => {

  const msg = validarEtapa2();
  if (msg) {
    signupError2.textContent = msg;
    return;
  }

  signupError2.textContent = "";

  const payload = {
    nome: signupBizName.value.trim(),
    cidade: signupBizCity.value.trim(),
    cnpj: signupBizCnpj.value.trim(),
    categoria: signupBizCategory.value.trim(),
    estado: signupBizUF.value.trim(),
    telefone: signupBizPhone.value.trim(),
    email: signupBizEmail.value.trim(),
    senha: signupBizPass.value,
    latitude: null,
    longitude: null,
    raio_alerta: null,
  };

  try {

    // 👉 envia para FastAPI
    await postJSON("/api/estabelecimentos", payload);

    // 👉 salva localmente para login atual
    const db = getBizDB();
    const emailNorm = normalizarEmail(payload.email);

    db[emailNorm] = {
      senha: payload.senha,
      nome: payload.nome
    };

    setBizDB(db);

    abrirModoBiz();
    bizEmail.value = emailNorm;
    bizPass.value = "";
    bizError.textContent = "Conta criada! Faça login.";

  } catch (e) {
    signupError2.textContent = e.message;
  }

});

// ================= LOGIN =================
btnBiz?.addEventListener("click", () => {

  console.log("LOGIN CLICADO"); // 🔍 Debug

  const email = normalizarEmail(bizEmail.value);
  const pass = bizPass.value;

  if (!emailValido(email)) {
    bizError.textContent = "Email inválido.";
    return;
  }

  const db = getBizDB();
  const user = db[email];

  if (!user) {
    bizError.textContent = "E-mail não cadastrado.";
    return;
  }

  if (user.senha !== pass) {
    bizError.textContent = "Senha incorreta.";
    return;
  }

  // ✅ LOGIN OK → REDIRECIONA
  window.location.href = "/templates/Dashboard.html";

});

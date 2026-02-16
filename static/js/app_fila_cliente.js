// ================= CONFIG =================
const API_BASE = window.location.origin;

// ================= HELPERS =================
function fmt2(n){ return String(n).padStart(2,"0"); }
function horaAgora(){
  const d = new Date();
  return `${fmt2(d.getHours())}:${fmt2(d.getMinutes())}:${fmt2(d.getSeconds())}`;
}
function pad3(n){ return String(n).padStart(3,"0"); }

function showToast(msg){
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(()=>toast.classList.remove("show"), 1400);
}

function getFilaId(){
  return new URLSearchParams(location.search).get("filaId");
}

function getClienteNome(filaId){
  let nome = localStorage.getItem("CLIENTE_NOME");
  if (!nome && filaId) nome = localStorage.getItem(`cliente_nome_${filaId}`);
  if (nome && filaId) localStorage.setItem(`cliente_nome_${filaId}`, nome);
  return (nome || "").trim();
}

// ================= ELEMENTOS =================
const elPos = document.getElementById("posicao");
const elFrente = document.getElementById("aFrente");
const elTempoMedio = document.getElementById("tempoMedio");
const elEstimativa = document.getElementById("estimativa");

const elDist = document.getElementById("distancia");
const elCoordsStatus = document.getElementById("coordsStatus");
const elPillRaio = document.getElementById("pillRaio");

const elFilaNome = document.getElementById("filaNome");
const elFilaRaio = document.getElementById("filaRaio");
const elUlt = document.getElementById("ultimaAtualizacao");

const btnGeo = document.getElementById("btnGeo");
const btnAtualizar = document.getElementById("btnAtualizar");
const btnSair = document.getElementById("btnSair");

// ================= Estado =================
const filaId = getFilaId();
if (!filaId){
  alert("Link inválido: falta filaId. Acesse pela leitura do QR Code.");
  window.location.replace(`${window.location.origin}/templates/saiu.html`);
  throw new Error("Sem filaId");
}

const SESSION_KEY = `cliente_session_${filaId}`;
let clienteId = Number(localStorage.getItem(SESSION_KEY) || 0);

// ================= Render =================
function renderStatus(payload){
  const aFrente = payload.a_frente ?? 0;
  const tempoMedioMin = payload.tempo_medio_min ?? 15;
  const pos = (payload.cliente?.status === "aguardando") ? (aFrente + 1) : 1;

  if (elPos) elPos.textContent = `#${pad3(pos)}`;
  if (elFrente) elFrente.textContent = `${aFrente} pessoas à frente`;

  if (elTempoMedio) elTempoMedio.textContent = `${tempoMedioMin} min`;
  if (elEstimativa) elEstimativa.textContent = `~${payload.estimativa_min ?? (aFrente * tempoMedioMin)} min`;

  if (elFilaNome) elFilaNome.textContent = payload.fila_nome || "Fila";
  if (elUlt) elUlt.textContent = horaAgora();

  if (payload.fila_raio_m && elFilaRaio) elFilaRaio.textContent = `${payload.fila_raio_m}m`;
}

async function atualizarStatus(){
  if (!filaId || !clienteId) return;

  const res = await fetch(`${API_BASE}/api/filas/${filaId}/cliente/${clienteId}/status`);
  if (!res.ok){
    showToast("Erro ao atualizar");
    return;
  }
  const data = await res.json();
  renderStatus(data);
  showToast("Atualizado!");
}

async function entrarNaFila(){
  if (!filaId) return;

  // se já tem sessão, só atualiza
  if (clienteId){
    await atualizarStatus();
    return;
  }

  const nome = getClienteNome(filaId);

  // se não tiver nome, volta pro login (sem prompt)
  if (!nome){
    const url = new URL("/templates/login.html", window.location.origin);
    url.searchParams.set("next", "Fila_cliente.html");
    url.searchParams.set("filaId", String(filaId));
    window.location.replace(url.toString());
    return;
  }

  const res = await fetch(`${API_BASE}/api/filas/${filaId}/entrar`, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ nome })
  });

  if (!res.ok){
    const err = await res.json().catch(()=>({detail:"Erro"}));
    alert(err.detail || "Erro ao entrar na fila");
    return;
  }

  const data = await res.json();

  clienteId = Number(data.cliente_id || 0);
  if (clienteId) localStorage.setItem(SESSION_KEY, String(clienteId));

  showToast(`Sua senha: ${data.senha_codigo || "OK"}`);
  await atualizarStatus();
}

// ================= GEO (mantido) =================
function setRaioStatus(ok){
  if (!elPillRaio) return;
  elPillRaio.classList.toggle("ok", ok);
  elPillRaio.classList.toggle("bad", !ok);
  elPillRaio.innerHTML = ok
    ? `<i class="bi bi-check2-circle"></i><span>Dentro do raio</span>`
    : `<i class="bi bi-x-circle"></i><span>Fora do raio</span>`;
}

async function atualizarLocalizacao(){
  if (!navigator.geolocation){
    if (elCoordsStatus){
      elCoordsStatus.textContent = "Indisponível";
      elCoordsStatus.classList.add("danger");
    }
    showToast("Geolocalização indisponível.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    () => {
      if (elCoordsStatus){
        elCoordsStatus.textContent = "Ativa";
        elCoordsStatus.classList.remove("danger");
      }

      const km = (Math.random() * 0.8).toFixed(1);
      if (elDist) elDist.textContent = `${km} km`;

      const dentro = Number(km) <= 0.5;
      setRaioStatus(dentro);

      showToast("Localização atualizada!");
    },
    () => {
      if (elCoordsStatus){
        elCoordsStatus.textContent = "Permissão negada";
        elCoordsStatus.classList.add("danger");
      }
      setRaioStatus(true);
      showToast("Permissão de localização negada.");
    },
    { enableHighAccuracy: true, timeout: 8000 }
  );
}

// ================= SAIR (ULTRA ROBUSTO PARA CELULAR) =================
function sairDaFila(evt){
  if (evt){
    evt.preventDefault();
    evt.stopPropagation();
    if (typeof evt.stopImmediatePropagation === "function") evt.stopImmediatePropagation();
  }

  const ok = confirm("Tem certeza que deseja sair da fila?");
  if (!ok) return;

  const target = `${window.location.origin}/templates/saiu.html`;

  // limpa sessão e nome ANTES
  try {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem("CLIENTE_NOME");
    localStorage.removeItem(`cliente_nome_${filaId}`);
  } catch {}

  // avisa backend sem travar a navegação
  try {
    if (filaId && clienteId) {
      const url = `${API_BASE}/api/filas/${filaId}/cliente/${clienteId}/sair`;
      const blob = new Blob([JSON.stringify({})], { type: "application/json" });
      navigator.sendBeacon?.(url, blob);
    }
  } catch {}

  // ✅ usa replace pra não voltar pra fila
  window.location.replace(target);

  // ✅ fallback extra (alguns navegadores ignoram o primeiro)
  setTimeout(() => window.location.replace(target), 200);
}

// ================= LISTENERS =================
btnGeo?.addEventListener("click", atualizarLocalizacao);
btnAtualizar?.addEventListener("click", atualizarStatus);

function sairDaFila(evt){
  if (evt){
    evt.preventDefault();
    evt.stopPropagation();
    if (evt.stopImmediatePropagation) evt.stopImmediatePropagation();
  }

  const ok = confirm("Tem certeza que deseja sair da fila?");
  if (!ok) return;

  // ✅ URL absoluta e fixa
  const target = `${window.location.origin}/templates/saiu.html`;

  // limpa sessão e nome
  try {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem("CLIENTE_NOME");
    localStorage.removeItem(`cliente_nome_${filaId}`);
  } catch {}

  // avisa backend sem travar
  try {
    if (filaId && clienteId) {
      const url = `${API_BASE}/api/filas/${filaId}/cliente/${clienteId}/sair`;
      const blob = new Blob([JSON.stringify({})], { type: "application/json" });
      navigator.sendBeacon?.(url, blob);
    }
  } catch {}

  // ✅ replace pra não voltar com “voltar”
  window.location.replace(target);

  // fallback
  setTimeout(() => window.location.replace(target), 250);
}

btnSair?.addEventListener("touchend", sairDaFila, { capture: true });
btnSair?.addEventListener("click", sairDaFila, { capture: true });

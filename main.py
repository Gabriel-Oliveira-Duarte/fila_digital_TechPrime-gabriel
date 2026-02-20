from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr
import mysql.connector
import hashlib
from pathlib import Path
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Optional
from datetime import datetime
import unicodedata

app = FastAPI(title="Fila Digital API")

# =====================================================
# ✅ CORS (IMPORTANTE)
# =====================================================
# ⚠️ Se você NÃO usa cookies/sessão (só localStorage), deixe allow_credentials=False.
# Isso evita bugs de CORS em alguns navegadores.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # em produção, troque para ["https://SEU-DOMINIO"]
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================================================
# ✅ NGROK: remover página "Visite o site"
# =====================================================
class NgrokSkipBrowserWarningMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["ngrok-skip-browser-warning"] = "1"
        return response

app.add_middleware(NgrokSkipBrowserWarningMiddleware)

# =====================================================
# PATHS
# =====================================================
BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
TEMPLATES_DIR = BASE_DIR / "templates"
ASSETS_DIR = BASE_DIR / "assets"

# =====================================================
# MOUNTS
# =====================================================
if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

if TEMPLATES_DIR.exists():
    app.mount("/templates", StaticFiles(directory=str(TEMPLATES_DIR)), name="templates")

if ASSETS_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(ASSETS_DIR)), name="assets")

# =====================================================
# HOME (/)
# =====================================================
@app.get("/")
def home():
    file_path = TEMPLATES_DIR / "index.html"
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="index.html não encontrado em /templates")
    return FileResponse(str(file_path), headers={"ngrok-skip-browser-warning": "1"})


# =====================================================
# MYSQL
# =====================================================
def get_conn():
    # ✅ você pode colocar charset pra evitar problemas com acentos
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="root",
        database="fila_digital",
        charset="utf8mb4",
        collation="utf8mb4_general_ci",
    )

SECRET_KEY = "andalogo_super_secret"

def hash_pass(p: str) -> str:
    return hashlib.sha256((p + SECRET_KEY).encode()).hexdigest()


# =====================================================
# HELPERS (categoria ENUM etc)
# =====================================================
def normalize_text_upper_no_accents(s: Optional[str]) -> Optional[str]:
    if s is None:
        return None
    s = s.strip()
    if not s:
        return None
    s = unicodedata.normalize("NFD", s)
    s = "".join(ch for ch in s if unicodedata.category(ch) != "Mn")
    return s.upper()

# Ajuste pro seu ENUM do banco:
# ENUM('CLINICA','BARBEARIA','SALAO','ESTETICA','RESTAURANTE','ACOUGUE','SUPERMERCADO')
VALID_CATEGORIAS = {
    "CLINICA", "BARBEARIA", "SALAO", "ESTETICA", "RESTAURANTE", "ACOUGUE", "SUPERMERCADO"
}

def normalize_categoria(raw: Optional[str]) -> Optional[str]:
    c = normalize_text_upper_no_accents(raw)
    if c is None:
        return None
    # se vier "SUPERmercad" etc, tenta corrigir
    if c.startswith("SUPERMERC"):
        c = "SUPERMERCADO"
    if c not in VALID_CATEGORIAS:
        # você pode escolher: ou retorna erro, ou seta default.
        # Aqui eu escolhi ERRO pra você não gravar dado inválido.
        raise HTTPException(status_code=400, detail=f"Categoria inválida. Use um destes: {sorted(VALID_CATEGORIAS)}")
    return c


# =====================================================
# MODELS
# =====================================================
class EstabelecimentoCreate(BaseModel):
    nome: str
    cidade: Optional[str] = None
    cnpj: Optional[str] = None
    categoria: Optional[str] = None
    estado: Optional[str] = None
    telefone: Optional[str] = None
    email: EmailStr
    senha: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    raio_alerta: Optional[int] = None

class LoginEstabelecimento(BaseModel):
    email: EmailStr
    senha: str

class FilaCreate(BaseModel):
    estabelecimento_id: int
    status: str  # "ABERTA" ou "FECHADA"
    nome: Optional[str] = None
    endereco: Optional[str] = None
    raio_metros: Optional[int] = 500
    tempo_medio_min: Optional[int] = None
    capacidade_max: Optional[int] = None
    mensagem_boas_vindas: Optional[str] = None
    horario_funcionamento: Optional[str] = None
    observacoes: Optional[str] = None


# =====================================================
# ESTABELECIMENTO
# =====================================================
@app.post("/api/estabelecimentos")
def criar_estabelecimento(body: EstabelecimentoCreate):
    try:
        categoria = normalize_categoria(body.categoria) if body.categoria else None

        conn = get_conn()
        cur = conn.cursor()

        cur.execute("""
            INSERT INTO estabelecimento
            (nome, cnpj, categoria, cidade, estado, telefone, latitude, longitude, raio_alerta, email, senha)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, (
            body.nome.strip(),
            (body.cnpj or None),
            categoria,
            (body.cidade or None),
            (body.estado or None),
            (body.telefone or None),
            body.latitude,
            body.longitude,
            body.raio_alerta,
            body.email.lower().strip(),
            hash_pass(body.senha),
        ))

        conn.commit()
        new_id = cur.lastrowid
        cur.close()
        conn.close()
        return {"ok": True, "idEstabelecimento": new_id}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# =====================================================
# ✅ LOGIN (RETORNA ID pro front)
# =====================================================
@app.post("/api/login-estabelecimento")
def login_estabelecimento(body: LoginEstabelecimento):
    try:
        conn = get_conn()
        cur = conn.cursor(dictionary=True)

        cur.execute("""
            SELECT idEstabelecimento, nome, email
            FROM estabelecimento
            WHERE email = %s AND senha = %s
            LIMIT 1
        """, (body.email.lower().strip(), hash_pass(body.senha)))

        row = cur.fetchone()
        cur.close()
        conn.close()

        if not row:
            raise HTTPException(status_code=401, detail="Email ou senha inválidos")

        # ✅ ISSO destrava o front (localStorage)
        return {
            "ok": True,
            "estabelecimento_id": row["idEstabelecimento"],
            "nome": row["nome"],
            "email": row["email"],
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =====================================================
# FILAS - LISTAR (com filtro)
# =====================================================
@app.get("/api/filas")
def listar_filas(estabelecimento_id: Optional[int] = Query(default=None)):
    try:
        conn = get_conn()
        cur = conn.cursor(dictionary=True)

        if estabelecimento_id:
            cur.execute("""
                SELECT idFila, status, data_criacao, data_fechamento, estabelecimento_idEstabelecimento
                FROM fila
                WHERE estabelecimento_idEstabelecimento = %s
                ORDER BY idFila DESC
            """, (estabelecimento_id,))
        else:
            cur.execute("""
                SELECT idFila, status, data_criacao, data_fechamento, estabelecimento_idEstabelecimento
                FROM fila
                ORDER BY idFila DESC
            """)

        rows = cur.fetchall()
        cur.close()
        conn.close()

        resp = []
        for r in rows:
            status = (r.get("status") or "").upper()
            resp.append({
                "idFila": r["idFila"],
                "id": r["idFila"],  # compatível com seu JS
                "nome": f"Fila #{r['idFila']}",
                "endereco": "",
                "ativa": status == "ABERTA",
                "status": status,
                "data_criacao": r.get("data_criacao").isoformat() if r.get("data_criacao") else None,
                "data_fechamento": r.get("data_fechamento").isoformat() if r.get("data_fechamento") else None,
                "estabelecimento_id": r.get("estabelecimento_idEstabelecimento"),
            })
        return resp

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =====================================================
# FILAS - CRIAR (salva no MySQL)
# =====================================================
@app.post("/api/filas")
def criar_fila(body: FilaCreate):
    try:
        status = (body.status or "").upper().strip()
        if status not in ("ABERTA", "FECHADA"):
            raise HTTPException(status_code=400, detail="status deve ser ABERTA ou FECHADA")

        if not body.estabelecimento_id or body.estabelecimento_id <= 0:
            raise HTTPException(status_code=400, detail="estabelecimento_id inválido")

        conn = get_conn()
        cur = conn.cursor()

        cur.execute("""
            INSERT INTO fila (status, data_criacao, estabelecimento_idEstabelecimento)
            VALUES (%s, %s, %s)
        """, (status, datetime.now(), body.estabelecimento_id))

        conn.commit()
        new_id = cur.lastrowid
        cur.close()
        conn.close()

        return {"ok": True, "idFila": new_id, "status": status}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =====================================================
# ✅ URL PÚBLICA (NGROK) PRA QR
# =====================================================
PUBLIC_BASE_URL = ""  # ex: https://xxxxx.ngrok-free.dev

class PublicUrlBody(BaseModel):
    public_url: str

@app.get("/api/public-url")
def get_public_url():
    return {"public_url": PUBLIC_BASE_URL}

@app.post("/api/public-url")
def set_public_url(body: PublicUrlBody):
    global PUBLIC_BASE_URL

    url = (body.public_url or "").strip().rstrip("/")
    if not (url.startswith("https://") or url.startswith("http://")):
        raise HTTPException(status_code=400, detail="URL inválida. Use http:// ou https://")

    PUBLIC_BASE_URL = url
    return {"ok": True, "public_url": PUBLIC_BASE_URL}


# =====================================================
# (opcional) Para rodar direto: python main.py
# =====================================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8010, reload=True)
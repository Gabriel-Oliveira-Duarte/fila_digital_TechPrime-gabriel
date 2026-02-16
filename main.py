from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr
import mysql.connector
import hashlib
from pathlib import Path
from starlette.middleware.base import BaseHTTPMiddleware

app = FastAPI(title="Fila Digital API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
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
# MOUNTS (IMPORTANTE!)
# =====================================================
if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

if TEMPLATES_DIR.exists():
    app.mount("/templates", StaticFiles(directory=str(TEMPLATES_DIR)), name="templates")

# ✅ ESSA É A CORREÇÃO DO SEU INDEX COM IMAGENS
if ASSETS_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(ASSETS_DIR)), name="assets")

# =====================================================
# PÁGINA INICIAL
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
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="root",
        database="fila_digital"
    )

SECRET_KEY = "andalogo_super_secret"
def hash_pass(p: str):
    return hashlib.sha256((p + SECRET_KEY).encode()).hexdigest()

class EstabelecimentoCreate(BaseModel):
    nome: str
    cidade: str | None = None
    cnpj: str | None = None
    categoria: str | None = None
    estado: str | None = None
    telefone: str | None = None
    email: EmailStr
    senha: str
    latitude: float | None = None
    longitude: float | None = None
    raio_alerta: int | None = None

@app.post("/api/estabelecimentos")
def criar_estabelecimento(body: EstabelecimentoCreate):
    try:
        conn = get_conn()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO estabelecimento
            (nome, cidade, cnpj, categoria, estado, telefone, email, senha, latitude, longitude, raio_alerta)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, (
            body.nome, body.cidade, body.cnpj, body.categoria, body.estado,
            body.telefone, body.email.lower(), hash_pass(body.senha),
            body.latitude, body.longitude, body.raio_alerta
        ))
        conn.commit()
        new_id = cur.lastrowid
        cur.close()
        conn.close()
        return {"ok": True, "id": new_id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/filas")
def listar_filas():
    try:
        conn = get_conn()
        cur = conn.cursor(dictionary=True)
        cur.execute("""
            SELECT idFila, status, data_criacao, estabelecimento_idEstabelecimento
            FROM fila
            ORDER BY idFila DESC
        """)
        rows = cur.fetchall()
        cur.close()
        conn.close()

        filas = []
        for r in rows:
            status = (r.get("status") or "").upper()
            filas.append({
                "id": str(r["idFila"]),
                "nome": f"Fila #{r['idFila']}",
                "endereco": "",
                "ativa": status == "ABERTA",
                "status": status,
                "data_criacao": r.get("data_criacao").isoformat() if r.get("data_criacao") else None,
                "estabelecimento_id": r.get("estabelecimento_idEstabelecimento"),
            })
        return filas
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
# =====================================================
# ✅ PARTE 2 — URL PÚBLICA (NGROK) PRA GERAR QR SEMPRE FUNCIONAL
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

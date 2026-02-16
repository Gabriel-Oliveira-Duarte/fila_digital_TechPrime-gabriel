# fila_digital_TechPrime-gabriel
Este repositório foi criado para dar continuidade ao desenvolvimento após limitações de acesso ao repositório original, permitindo implementar melhorias, ajustes, testes e versionamento independente, com possibilidade de integração futura.



---

# 📘 RELATÓRIO COMPLETO — Configuração e Execução do Projeto (Windows)

Este **README** descreve **PASSO A PASSO**, de forma **100% completa**, como **configurar e rodar o projeto do zero em outra máquina Windows**, incluindo:

* MySQL
* FastAPI
* ngrok
* link público
* geração de QR Code
* teste completo no celular

Seguindo este guia, **qualquer pessoa consegue rodar o sistema sem ajuda externa**.

---

## 0️⃣ Pré-requisitos

Antes de começar, instale na máquina:

* **Python 3.11+** (recomendado)
  ✅ Durante a instalação, marque **“Add Python to PATH”**
* **MySQL Server 8.0+**
* **VS Code** (opcional, mas recomendado)
* **Git** (opcional, se for clonar o repositório)

---

## 1️⃣ Baixar o projeto (Git Clone)

Abra o terminal na pasta onde deseja salvar o projeto:

```powershell
# Clonar o repositório
git clone https://github.com/Gabriel-Oliveira-Duarte/fila_digital_TechPrime-gabriel.git

# Entrar na pasta do projeto (onde está o main.py)
cd fila_digital_TechPrime-gabriel


```

### Caso tenha baixado em ZIP

Apenas extraia o arquivo e entre na pasta do projeto:

```powershell
cd fila_digital_TechPrime-gabriel
```

---

## 2️⃣ Banco de dados (MySQL)

### 2.1️⃣ Iniciar o MySQL (Windows)

Abra o **Prompt de Comando ou PowerShell como Administrador** e execute:

```powershell
net start mysql80
```

⚠️ Caso não funcione, o nome do serviço pode ser `MySQL80` ou similar.

---

### 2.2️⃣ Testar conexão com o MySQL

Abra um terminal **normal (sem admin)** e execute:

```powershell
mysql -u root -p
```

Digite a senha (no padrão usado no projeto: `root`).

---

### 2.3️⃣ Criar banco de dados e tabelas

⚠️ **Cole EXATAMENTE o script abaixo, sem alterar nada**:

```sql
CREATE DATABASE fila_digital;
USE fila_digital;

CREATE TABLE cliente (
    idCliente INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(45) NOT NULL,
    telefone VARCHAR(45),
    status ENUM('ATIVO','INATIVO') DEFAULT 'ATIVO',

    latitude_atual DECIMAL(10,8),
    longitude_atual DECIMAL(11,8),
    ultima_atualizacao DATETIME
);

CREATE TABLE posicao_gps (
    idPosicaoGPS INT AUTO_INCREMENT PRIMARY KEY,
    latitude DECIMAL(10,8) NULL,
    longitude DECIMAL(11,8) NULL,
    data_ultima_atualizacao DATETIME,

    cliente_idCliente INT,
    FOREIGN KEY (cliente_idCliente) REFERENCES cliente(idCliente)
);

CREATE TABLE alertas (
    idAlertas INT AUTO_INCREMENT PRIMARY KEY,
    tipo ENUM('ENTRADA_RAIO','SAIDA_RAIO','OUTRO'),
    mensagem VARCHAR(45),
    data_emissao DATETIME,

    cliente_idCliente INT,
    FOREIGN KEY (cliente_idCliente) REFERENCES cliente(idCliente)
);

CREATE TABLE IF NOT EXISTS estabelecimento (
    idEstabelecimento INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(45) NOT NULL,
    cnpj VARCHAR(18),
    categoria ENUM('CLINICA','BARBEARIA','SALAO','ESTETICA','RESTAURANTE','ACOUGUE','SUPERMERCADO'),
    cidade VARCHAR(45),
    estado VARCHAR(45),
    telefone VARCHAR(15),

    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,

    raio_alerta INT,

    email VARCHAR(120) NOT NULL UNIQUE,
    senha VARCHAR(120) NOT NULL
);

CREATE TABLE caixa (
    idCaixa INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(45)
);

CREATE TABLE atendimento (
    idAtendimento INT AUTO_INCREMENT PRIMARY KEY,
    data_inicio DATETIME NOT NULL,
    data_fim DATETIME NOT NULL,
    status ENUM('AGUARDANDO','EM_ATENDIMENTO','FINALIZADO'),
    servico VARCHAR(45),

    cliente_idCliente INT,
    estabelecimento_idEstabelecimento INT,
    caixa_idCaixa INT,

    FOREIGN KEY (cliente_idCliente) REFERENCES cliente(idCliente),
    FOREIGN KEY (estabelecimento_idEstabelecimento) REFERENCES estabelecimento(idEstabelecimento),
    FOREIGN KEY (caixa_idCaixa) REFERENCES caixa(idCaixa)
);

CREATE TABLE fila(
    idFila INT AUTO_INCREMENT PRIMARY KEY,
    status ENUM('ABERTA','FECHADA'),
    data_criacao DATETIME,
    data_fechamento DATETIME,
    cliente_idCliente INT,
    estabelecimento_idEstabelecimento INT,
    
    FOREIGN KEY (cliente_idCliente) REFERENCES cliente(idCliente),
    FOREIGN KEY (estabelecimento_idEstabelecimento) REFERENCES estabelecimento(idEstabelecimento)
);

CREATE TABLE qr_code (
    idQRCode INT AUTO_INCREMENT PRIMARY KEY,
    data_criacao DATETIME,

    fila_idFila INT,
    cliente_idCliente INT,
    estabelecimento_idEstabelecimento INT,

    FOREIGN KEY (fila_idFila) REFERENCES fila(idFila),
    FOREIGN KEY (cliente_idCliente) REFERENCES cliente(idCliente),
    FOREIGN KEY (estabelecimento_idEstabelecimento) REFERENCES estabelecimento(idEstabelecimento)
);

ALTER TABLE estabelecimento DROP COLUMN latitude;
ALTER TABLE estabelecimento DROP COLUMN longitude;

ALTER TABLE estabelecimento
  ADD latitude DECIMAL(10,8) NULL,
  ADD longitude DECIMAL(11,8) NULL;

SELECT * FROM estabelecimento;
```

### Conferir se as tabelas existem

```sql
SHOW TABLES;
```

---

### 📌 Observação importante (MySQL)

* ✅ Se a máquina também usar **root / root**, **não precisa alterar nada**
* ⚠️ Caso **não seja padrão**, veja a seção **11️⃣ (.env)**

---

## 3️⃣ Ambiente Python (venv) + dependências (na pasta do main.py)

### 3.1️⃣ Criar ambiente virtual (.venv)

Na pasta do projeto:

**PowerShell**

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
```

**CMD**

```cmd
py -m venv .venv
.\.venv\Scripts\activate.bat
```

✅ Se ativou corretamente, aparece `(.venv)` no terminal.

---

### 3.2️⃣ Instalar dependências

Com a venv ativa:

```powershell
pip install fastapi uvicorn mysql-connector-python pydantic python-dotenv
```

Se usar `EmailStr`:

```powershell
pip install "pydantic[email]"
```

---

## 4️⃣ Rodar a API FastAPI (porta 8010)

```powershell
uvicorn main:app --reload --host 0.0.0.0 --port 8010
```

### Testes

* Swagger / Docs
  👉 [http://127.0.0.1:8010/docs](http://127.0.0.1:8010/docs)

* Index
  👉 [http://127.0.0.1:8010/](http://127.0.0.1:8010/)

* Painel QR Code
  👉 [http://127.0.0.1:8010/templates/Qr_code.html](http://127.0.0.1:8010/templates/Qr_code.html)

⚠️ **NÃO usar Live Server**

O sistema **precisa rodar pelo FastAPI**, pois `/api`, `/static`, `/assets` e `/templates` estão no mesmo servidor.

---

## 5️⃣ Configurar NGROK (instalação + token + link público)

### 5.1️⃣ Instalar o ngrok

Baixe e instale o ngrok (conta Free).

Verificar instalação:

```powershell
ngrok version
```

Caso não reconheça:

```powershell
where.exe ngrok
```

---

### 5.2️⃣ Criar conta e pegar o Authtoken

* Criar conta no site do ngrok
* Copiar **Your Authtoken**

---

### 5.3️⃣ Configurar token no Windows

```powershell
ngrok config add-authtoken SEU_TOKEN_AQUI
```

Conferir:

```powershell
ngrok config check
```

---

### 5.4️⃣ Subir túnel (link público)

Com a API rodando:

```powershell
ngrok http 8010
```

Exemplo:

```
Forwarding https://SEU-LINK.ngrok-free.dev -> http://localhost:8010
```

---

### 5.5️⃣ Erro comum: ERR_NGROK_334

Se aparecer:

```
ERR_NGROK_334 endpoint is already online
```

**Solução:**

* CTRL + C no terminal do ngrok
* Rodar novamente:

```powershell
ngrok http 8010
```

---

## 6️⃣ Configurar LINK PÚBLICO dentro do sistema (obrigatório)

Endpoints:

* `POST /api/public-url`
* `GET /api/public-url`

Swagger:
👉 [http://127.0.0.1:8010/docs](http://127.0.0.1:8010/docs)

### 6.1️⃣ POST

```json
{
  "public_url": "https://SEU-LINK.ngrok-free.dev"
}
```

### 6.2️⃣ GET

Confirme se retorna o mesmo link.

---

## 7️⃣ Gerar QR Code do estabelecimento

* Local:
  👉 [http://127.0.0.1:8010/templates/Qr_code.html](http://127.0.0.1:8010/templates/Qr_code.html)

* Público:
  👉 [https://SEU-LINK.ngrok-free.dev/templates/Qr_code.html](https://SEU-LINK.ngrok-free.dev/templates/Qr_code.html)

🔥 **O QR sempre aponta para o link público (ngrok)**

---

## 8️⃣ Fluxo do cliente no celular

1. Escaneia o QR
2. Abre `login.html`
3. Clica **Acompanhar fila**
4. Vai para `Fila_cliente.html?filaId=...`
5. Clica **Sair da fila**
6. Abre `/templates/saiu.html`

✅ Fluxo correto se tudo isso acontecer.

---

## 9️⃣ Checklist rápido (quando algo não funciona)

* API ativa?
  [http://127.0.0.1:8010/docs](http://127.0.0.1:8010/docs)

* Index abre?
  [http://127.0.0.1:8010/](http://127.0.0.1:8010/)

* QR lista filas?
  [http://127.0.0.1:8010/templates/Qr_code.html](http://127.0.0.1:8010/templates/Qr_code.html)

* Ngrok ativo?
  `ngrok http 8010`

* Link público atualizado?
  Swagger → POST /api/public-url

* QR regenerado após atualizar link?
  ✅ Sempre gerar de novo

---

## 🔟 IMPORTANTE — Não usar Live Server

❌ Live Server não garante:

* `/api/...`
* `/static/...`
* `/assets/...`
* templates integrados

✅ Use sempre:

```text
http://127.0.0.1:8010/
http://127.0.0.1:8010/templates/Qr_code.html
```

---

## 1️⃣1️⃣ (Opcional) MySQL via .env

### 11.1️⃣ Criar `.env.example`

```env
DB_HOST=localhost
DB_USER=root
DB_PASS=root
DB_NAME=fila_digital
DB_PORT=3306
```

### 11.2️⃣ Copiar para `.env` e ajustar

---

### 11.3️⃣ main.py (get_conn)

```python
import os
from dotenv import load_dotenv
load_dotenv()

def get_conn():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST", "localhost"),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASS", "root"),
        database=os.getenv("DB_NAME", "fila_digital"),
        port=int(os.getenv("DB_PORT", "3306")),
    )
```

---

## 1️⃣2️⃣ Checklist ngrok (quando o link muda)

1. `ngrok http 8010`
2. Copiar novo link
3. Swagger → POST /api/public-url
4. Reabrir Qr_code.html
5. Gerar QR novamente

---

## ✅ Conclusão

Seguindo este README, qualquer pessoa consegue:

* ✅ Subir MySQL e criar o banco
* ✅ Instalar dependências
* ✅ Rodar FastAPI corretamente
* ✅ Configurar ngrok
* ✅ Atualizar link público
* ✅ Gerar QR funcional
* ✅ Testar tudo no celular
* ✅ Fluxo completo funcionando

---



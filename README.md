# fila_digital_TechPrime-gabriel
Este repositório foi criado para dar continuidade ao desenvolvimento após limitações de acesso ao repositório original, permitindo implementar melhorias, ajustes, testes e versionamento independente, com possibilidade de integração futura.
# RELATÓRIO COMPLETO — Configuração e Execução do Projeto (Windows)

A seguir está o **RELATÓRIO COMPLETO** (passo a passo) para qualquer pessoa conseguir **configurar e rodar o projeto do zero em outra máquina Windows**, incluindo **MySQL**, **FastAPI**, **ngrok**, **link público**, **geração do QR Code** e **teste no celular**.

---

## 0) Pré-requisitos

Antes de começar, instale na máquina:

* **Python 3.11+** (recomendado)  
  ✅ na instalação marque **“Add Python to PATH”**
* **MySQL Server 8.0+**
* **VS Code** (opcional, mas recomendado)
* **Git** (opcional, se for clonar)

---

## 1) Baixar o projeto (Git Clone)

Abra o terminal na pasta onde deseja salvar o projeto:

```powershell
git clone <URL_DO_REPOSITORIO>
cd fila_digital_TechPrime
Se você baixou em ZIP, apenas extraia e entre na pasta do projeto:

cd fila_digital_TechPrime
2) Banco de dados (MySQL)
2.1) Iniciar o MySQL (Windows)
Abra Prompt/PowerShell como Administrador e rode:

net start mysql80
⚠️ Se o nome do serviço for diferente, pode ser MySQL80 ou semelhante.

2.2) Testar conexão
No terminal normal (não precisa ser admin), rode:

mysql -u root -p
Digite sua senha (no seu caso era root).

2.3) Criar o banco e tabelas
Dentro do MySQL, cole EXATAMENTE o script abaixo (não alterar nada):

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
    idFila INT AUTO_INCREMENT  PRIMARY KEY,
    status ENUM('ABERTA','FECHADA'),
    data_criacao DATETIME,
    data_fechamento DATETIME,
    cliente_idCliente INT,
    estabelecimento_idEstabelecimento INT,
    
    FOREIGN KEY (cliente_idCLiente) REFERENCES cliente(idCliente),
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

select *from estabelecimento;
✅ Conferir se as tabelas existem:

SHOW TABLES;
Observação importante (MySQL)
✅ Se a máquina da pessoa também usar root/root, não precisa mudar nada.

⚠️ Somente se NÃO for padrão, aí sim deve ajustar as credenciais do banco no projeto (ver seção opcional .env no fim do relatório).

3) Ambiente Python (venv) + dependências
3.1) Criar o ambiente virtual (.venv)
Na pasta do projeto:

PowerShell:
py -m venv .venv
.\.venv\Scripts\Activate.ps1
CMD:
py -m venv .venv
.\.venv\Scripts\activate.bat
✅ Se ativou certo, aparece (.venv) no começo da linha do terminal.

3.2) Instalar bibliotecas
Com a venv ativa:

pip install fastapi uvicorn mysql-connector-python pydantic python-dotenv
Se você usa EmailStr, instale também:

pip install "pydantic[email]"
4) Rodar a API FastAPI (porta 8010)
Com a venv ativa e dentro da pasta do projeto:

uvicorn main:app --reload --host 0.0.0.0 --port 8010
✅ Testes:

Swagger / Docs:
http://127.0.0.1:8010/docs

Index do sistema:
http://127.0.0.1:8010/

Tela do QR Code (painel):
http://127.0.0.1:8010/templates/Qr_code.html

✅ Importante: não usar Live Server para o sistema rodar completo.
O correto é abrir no navegador com http://127.0.0.1:8010/... porque /static, /templates, /assets e /api ficam no mesmo servidor (FastAPI).

5) Configurar NGROK (instalação + token + link público)
5.1) Instalar o ngrok
Baixe e instale o ngrok (conta Free).

Depois confirme se está instalado:

ngrok version
Se der “ngrok não reconhecido”, confira o caminho:

where.exe ngrok
5.2) Criar conta e pegar o token (Authtoken)
Entre no site do ngrok e crie uma conta

No painel, procure “Your Authtoken”

Copie o token

5.3) Configurar o token no Windows
No PowerShell ou CMD:

ngrok config add-authtoken SEU_TOKEN_AQUI
Conferir:

ngrok config check
✅ Deve aparecer algo como:
Valid configuration file at ...\ngrok.yml

5.4) Subir o túnel (gerar link público)
Com a API rodando na porta 8010, abra outro terminal e rode:

ngrok http 8010
Ele vai mostrar algo como:

Forwarding https://SEU-LINK.ngrok-free.dev -> http://localhost:8010

✅ Esse link https://... é o LINK PÚBLICO que o cliente vai usar no celular.

5.5) Erro comum: ERR_NGROK_334 (endpoint já online)
Se aparecer:

ERR_NGROK_334 endpoint is already online

✅ Solução:

Vá no terminal onde o ngrok está rodando e pressione CTRL + C

Rode novamente:

ngrok http 8010
6) Configurar o LINK PÚBLICO dentro do sistema (obrigatório)
Como o ngrok muda o link quando reinicia, você precisa salvar o link atual do ngrok dentro do sistema usando a rota:

POST /api/public-url

GET /api/public-url

6.1) Como conferir se existe o endpoint
Abra o Swagger:

http://127.0.0.1:8010/docs

✅ Se você enxergar essas rotas no Swagger, está certo.

6.2) Como configurar (POST)
No Swagger, no endpoint POST /api/public-url, envie:

{ "public_url": "https://SEU-LINK.ngrok-free.dev" }
✅ Depois confira no GET /api/public-url se devolve o mesmo link.

7) Gerar QR Code do estabelecimento (e funcionar no celular)
✅ Abra a página do painel QR Code:

No PC local:
http://127.0.0.1:8010/templates/Qr_code.html

Pelo link público (se quiser ver igual ao celular):
https://SEU-LINK.ngrok-free.dev/templates/Qr_code.html

✅ Selecione a fila e gere o QR.

🔥 O QR gerado vai apontar pro link público (ngrok) e o cliente vai conseguir abrir no celular.

8) Fluxo do cliente no celular (o que deve acontecer)
Cliente escaneia o QR Code

Abre:
login.html (pede nome)

Clica em “Acompanhar fila”

Vai para:
Fila_cliente.html?filaId=...

Ao clicar Sair da fila:

sai da sessão

abre a tela:
/templates/saiu.html

mostra apenas instruções para escanear o QR novamente

✅ Se isso tudo aconteceu, o fluxo está correto.

9) Checklist rápido quando “algo não funciona”
✅ API está de pé?
http://127.0.0.1:8010/docs

✅ Index abre com imagens?
http://127.0.0.1:8010/

✅ Qr_code lista filas?
http://127.0.0.1:8010/templates/Qr_code.html

✅ Ngrok subiu?
ngrok http 8010

✅ Link público atualizado no sistema?
Swagger → POST /api/public-url e depois GET /api/public-url

✅ Gerou QR depois de atualizar?
Sempre gere o QR depois de atualizar o link público.

10) IMPORTANTE — Não usar Live Server
✅ O Live Server pode até abrir o HTML “bonito”, mas não garante:

rota /api/...

rotas /static/...

rotas /assets/...

templates com caminhos absolutos

✅ O correto é sempre abrir assim:

Index:
http://127.0.0.1:8010/

QR:
http://127.0.0.1:8010/templates/Qr_code.html

(Opcional) 11) MySQL via .env (somente se NÃO for root/root)
11.1) Criar .env.example na raiz do projeto:
DB_HOST=localhost
DB_USER=root
DB_PASS=root
DB_NAME=fila_digital
DB_PORT=3306
11.2) Na máquina da pessoa:
Copiar .env.example → .env e ajustar com os dados dela.

11.3) main.py (apenas get_conn)
Adicionar no topo:

import os
from dotenv import load_dotenv
load_dotenv()
E trocar o get_conn() por:

def get_conn():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST", "localhost"),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASS", "root"),
        database=os.getenv("DB_NAME", "fila_digital"),
        port=int(os.getenv("DB_PORT", "3306")),
    )
✅ Assim, a pessoa só mexe no .env, não mexe no código.

12) Checklist ngrok (quando o link muda)
Sempre que reiniciar o ngrok:

ngrok http 8010 (pegar link novo)

Swagger → POST /api/public-url com o link novo

Reabrir Qr_code.html

Gerar o QR de novo

✅ Pronto, QR sempre sai correto pro celular.

Conclusão
Seguindo este relatório, qualquer pessoa consegue:

✅ subir MySQL e criar o banco
✅ instalar libs e rodar FastAPI
✅ abrir index/qr/cliente sem live server
✅ configurar ngrok e token
✅ atualizar link público no sistema
✅ gerar QR funcional pro cliente no celular
✅ sair da fila e cair na tela saiu.html corretamente

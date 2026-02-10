# 📲 ANDA LOGO – Fila Digital Inteligente com QR Code e Geolocalização

## 📌 Introdução
O **ANDA LOGO – Fila Digital Inteligente** é um sistema desenvolvido para modernizar o atendimento em estabelecimentos comerciais, substituindo filas físicas por uma **fila digital acessada via QR Code**.

Ao chegar no estabelecimento, o cliente escaneia o QR Code e entra automaticamente na fila digital, podendo **acompanhar sua posição em tempo real** e **circular livremente pelo local** enquanto aguarda o atendimento.  
Para garantir a organização da fila, o sistema utiliza uma **API de geolocalização**, que valida se o cliente permanece dentro do estabelecimento ou dentro de um raio permitido.

---

## 🎯 Objetivo do Projeto
- Eliminar filas físicas  
- Permitir entrada rápida na fila via QR Code  
- Garantir liberdade de locomoção dentro do estabelecimento  
- Utilizar geolocalização para controle justo da fila  
- Melhorar a experiência do cliente e a eficiência do atendimento  

---

## 🚀 Funcionalidades

### 👤 Cliente
- Acesso à fila digital via **QR Code**
- Entrada automática na fila pelo celular
- Visualização da posição atual na fila
- Quantidade de pessoas à frente
- Acompanhamento do atendimento em tempo real
- Liberdade para circular pelo estabelecimento
- Validação de permanência via geolocalização

### 🏬 Estabelecimento / Funcionário
- Painel de atendimento
- Visualização da fila em tempo real
- Chamada do próximo cliente
- Início e finalização de atendimentos
- Controle do fluxo de clientes
- Monitoramento da localização dos clientes na fila

---

## 🛠️ Tecnologias Utilizadas

### Back-end
- Python 3.10+
- FastAPI
- Uvicorn
- Pydantic
- WebSockets (atualizações em tempo real)
- CORS Middleware
- API de Geolocalização
- Flask
- Datetime

### Front-end
- HTML5
- CSS3
- JavaScript
- Leitor de QR Code via navegador
- API de Geolocalização do navegador

### Banco de Dados
- MySQL

### Versionamento
- Git
- GitHub

---

## 📂 Estrutura do Projeto

fila_digital_TechPrime/
│
├── backend/
│ ├── main.py
│ ├── models.py
│ ├── routes.py
│ └── database.py
│
├── frontend/
│ ├── index.html
│ ├── cliente.html
│ ├── css/
│ └── js/
│
├── requirements.txt
└── README.md


---

## 📦 Estrutura de Banco de Dados

O banco **fila_digital** foi modelado para representar clientes, controle de fila e validação de localização.

```sql
CREATE DATABASE fila_digital;
USE fila_digital;

CREATE TABLE IF NOT EXISTS cliente (
    idCliente INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(45) NOT NULL,
    telefone VARCHAR(45),
    status ENUM('ATIVO','INATIVO') DEFAULT 'ATIVO',
    latitude_atual DECIMAL(10,8),
    longitude_atual DECIMAL(11,8),
    ultima_atualizacao DATETIME
);

-- Consultar clientes
SELECT * FROM cliente;

-- Deletar um cliente pelo ID
DELETE FROM cliente WHERE idCliente = ' ';

-- Limpar toda a tabela
TRUNCATE TABLE cliente;
```

# 📥 Como Baixar o Projeto
Clonar o repositório
git clone https://github.com/davianpup/fila_digital_TechPrime.git


Entrar na pasta do projeto:
```
cd fila_digital_TechPrime
```
---

# 🐍 Criar Ambiente Virtual (Recomendado)
### Windows
```
python -m venv venv
```
```
venv\Scripts\activate
```
### Linux / macOS
```
python3 -m venv venv
```
```
source venv/bin/activate
```
---

## 📦 Instalação das Dependências
```
pip install -r requirements.txt
```
Ou manualmente:
```
pip install fastapi uvicorn pydantic python-multipart websockets
```
---
## ▶️ Como Rodar o Projeto
uvicorn main:app --reload


Caso o arquivo principal seja server.py:
```
uvicorn server:app --reload
```
---
## 🌐 Acessar no Navegador

API:
http://127.0.0.1:8000

Documentação (Swagger UI):
http://127.0.0.1:8000/docs

Interface do Cliente (via QR Code):
http://127.0.0.1:8000/cliente

---

# 📷 Funcionamento do QR Code

O estabelecimento disponibiliza um QR Code no local,

O cliente escaneia o QR Code com o celular,

A interface web do cliente é aberta,

O cliente entra automaticamente na fila digital,

Pode circular livremente pelo estabelecimento,

A geolocalização valida a permanência no local,

O sistema avisa quando o cliente estiver próximo de ser atendido

---
# 🌍 API de Geolocalização

A API de geolocalização valida se o cliente permanece dentro de um raio permitido, garantindo organização e justiça na fila digital.

### A geolocalização permite:

- Validação de presença

- Liberdade de movimentação

- Alertas ao sair do raio permitido

- Manutenção da posição na fila

---
# 📖 Documentação da API

O projeto utiliza Swagger UI, permitindo visualizar, testar e validar todas as rotas da API diretamente pelo navegador.

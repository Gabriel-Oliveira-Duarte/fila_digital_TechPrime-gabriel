#  ANDA LOGO — Fila Digital Inteligente

O **ANDA LOGO** é uma plataforma de **fila digital via QR Code** que permite ao cliente entrar na fila e circular livremente dentro de um estabelecimento, respeitando um **raio geográfico controlado**, sem perder sua posição.

O sistema utiliza **geolocalização em tempo real**, **WebSockets** para atualização instantânea da fila e **QR Code** para entrada rápida e prática.

---

## 🚀 Tecnologias Utilizadas

### Front-end

* HTML5
* CSS3
* JavaScript (Vanilla)
* API de Geolocalização do Navegador

### Back-end

* Python 3
* Flask
* WebSocket (tempo real)

### Banco de Dados

* MySQL

### Recursos Especiais

* Biblioteca de geração de **QR Code**
* Geolocalização por latitude e longitude
* Comunicação em tempo real (WebSocket)

---

## 📋 Pré-requisitos

Antes de rodar o projeto, é necessário ter:

* Python 3.x (com **Add Python to PATH** marcado)
* MySQL Server
* MySQL Workbench
* Git
* VS Code (editor recomendado)
* Navegador com suporte à API de Geolocalização

---



O banco **fila_digital** foi modelado para representar clientes, filas, atendimentos e controle de localização.

### 📦 Estrutura de Banco de Dados

O banco **fila_digital** foi modelado para representar clientes, filas, atendimentos e controle de localização.
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

USE fila_digital;
SELECT * FROM clientes;

-- Deletar apenas um id
DELETE FROM usuarios WHERE idCliente = ' ';

-- Deletar a tabela completa
TRUNCATE TABLE cliente;
```

---

## 📍 Geolocalização (API)

O sistema utiliza a **API de Geolocalização do navegador** para:

* Capturar latitude e longitude do cliente
* Comparar a posição atual com o raio do estabelecimento
* Detectar:

  * Entrada no raio permitido
  * Saída do raio permitido

Esses eventos podem gerar **alertas automáticos**.

---

## 🔄 WebSocket (Tempo Real)

O WebSocket é utilizado para:

* Atualizar posição do cliente em tempo real
* Atualizar fila sem recarregar a página
* Notificar:

  * Mudança de posição na fila
  * Chamada para atendimento
  * Alertas de proximidade

👉 Isso garante uma experiência **fluida e instantânea**.

---

## 📸 QR Code

O QR Code é utilizado como **porta de entrada da fila**:

1. Cliente escaneia o QR Code no local
2. Sistema id#  ANDA LOGO — Fila Digital Inteligente

O **ANDA LOGO** é uma plataforma de **fila digital via QR Code** que permite ao cliente entrar na fila e circular livremente dentro de um estabelecimento, respeitando um **raio geográfico controlado**, sem perder sua posição.

O sistema utiliza **geolocalização em tempo real**, **WebSockets** para atualização instantânea da fila e **QR Code** para entrada rápida e prática.


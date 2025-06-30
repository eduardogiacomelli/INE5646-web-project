# Projeto Web: Sistema Gerenciador de Tarefas

![Licença](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)

Uma aplicação Full-Stack para gerenciamento de tarefas e equipes, desenvolvida para a disciplina de INE5646 - Programação para Web na UFSC.
<br>

Para acessar a aplicação primeiro conecte-se ao VPN da UFSC


**[Acesse a Aplicação Online](https://ine5646.e.w.giacomelli.vms.ufsc.br/)**

---

## Índice

- [Sobre o Projeto](#sobre-o-projeto)
  - [Principais Funcionalidades](#principais-funcionalidades)
  - [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Arquitetura da Aplicação](#arquitetura-da-aplicação)
- [Como Executar o Projeto Localmente](#como-executar-o-projeto-localmente)
  - [Pré-requisitos](#pré-requisitos)
  - [Instalação do Backend](#instalação-do-backend)
  - [Instalação do Frontend](#instalação-do-frontend)
- [Como Contribuir](#como-contribuir)
- [Autores](#autores)
- [Licença](#licença)

---



## Sobre o Projeto

Este projeto é um **Sistema Gerenciador de Tarefas**. Ele permite que usuários se cadastrem, criem equipes, gerenciem membros e atribuam tarefas complexas com prazos, prioridades e status.

O foco principal foi desenvolver uma aplicação Full-Stack, desde a configuração do servidor até a criação de uma interface de usuário reativa e intuitiva.

![Screenshot da Aplicação](https://github.com/user-attachments/assets/cb156750-6f2e-4f3e-b75a-9027126f0e86) 
*(Dashboard do site)*

### Principais Funcionalidades

-   **Autenticação Segura:** Sistema completo de registro e login com senhas criptografadas (Bcrypt) e autenticação baseada em JSON Web Tokens (JWT).
-   **Gerenciamento de Tarefas (CRUD):** Criação, Leitura, Atualização e Deleção de tarefas, com campos para título, descrição, prioridade, prazo e status.
-   **Gerenciamento de Equipes (CRUD):** Criação, Leitura, Atualização e Deleção de membros da equipe.
-   **Atribuição de Tarefas:** Possibilidade de atribuir múltiplos membros a uma mesma tarefa.
-   **Painel de Monitoramento:** Uma visão geral (Kanban) de todas as tarefas, agrupadas por status, para fácil gerenciamento do fluxo de trabalho.
-   **Design Responsivo:** Interface construída para funcionar de forma agradável tanto em desktops quanto em dispositivos móveis.

### Páginas do site
![Página dos membros](https://github.com/user-attachments/assets/4b0e4d85-f894-4444-aeae-9ba1b09df8c6)
*Permite criar seus membros*

![Página das tarefas](https://github.com/user-attachments/assets/9a5f6213-4c74-481a-a586-c7b7c5f2f62c)
*Crie as tarefas que você precisa realizar*

![Página de acompanhamento das tarefas](https://github.com/user-attachments/assets/2cc53835-11c2-436d-9e46-850176a5cfa3)
*Atualize e acompanhe o andamento de suas tarefas*

<hr>

### Tecnologias Utilizadas




O projeto foi construído utilizando um ecossistema de tecnologias modernas para o desenvolvimento web:

| Frontend | Backend | Infraestrutura & DevOps |
| :--- | :--- | :--- |
| React 18 | Node.js | Apache2 (Reverse Proxy) |
| TypeScript | Express.js | Ubuntu Server (VPS UFSC) |
| Vite | MongoDB (Atlas) | Git & GitHub |
| React Router v6 | Mongoose | HTTPS (SSL/TLS) |
| Axios | JWT (jsonwebtoken) | PM2 (Process Manager) |
| Pico.css | Bcrypt.js | |
| | CORS | |
| | Dotenv | |

---

## Arquitetura da Aplicação

A aplicação foi implantada em um servidor VPS da UFSC seguindo uma **arquitetura de 3 camadas** para garantir segurança e desacoplamento.

1.  **Gateway de Borda (Apache2):** É a única porta de entrada para o sistema. Ele é responsável por:
    -   **Terminação TLS:** Gerencia o certificado SSL, forçando toda a comunicação a ser via **HTTPS**.
    -   **Servir o Frontend:** Entrega os arquivos estáticos da aplicação React (build de produção).
    -   **Proxy Reverso:** Recebe todas as requisições para o caminho `/api/` e as encaminha de forma segura para a aplicação Backend, que roda em uma porta interna e não fica exposta diretamente à internet.

2.  **Servidor de Aplicação (Backend):** Uma API RESTful construída com **Node.js e Express**. Ela contém toda a lógica de negócio, validação de dados, autenticação de usuários e comunicação com o banco de dados.

3.  **Banco de Dados (Database):** Uma instância do **MongoDB Atlas** (banco de dados NoSQL na nuvem) que armazena todos os dados da aplicação, como usuários, tarefas e membros. O Backend se comunica com ele através da biblioteca **Mongoose**.

---

## Como Executar o Projeto Localmente

Para executar uma versão de desenvolvimento deste projeto em sua máquina, siga os passos abaixo.

### Pré-requisitos

-   Node.js (versão 18 ou superior)
-   npm (geralmente instalado com o Node.js)
-   Uma string de conexão do MongoDB (você pode criar uma conta gratuita no [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))

### Instalação do Backend

1.  Clone o repositório:
2.  Acesse a pasta do backend
    ```bash
    cd projeto-web/backend
    ```

3.  Instale as dependências do NPM:
    ```bash
    npm install
    ```

4.  Crie um arquivo `.env` na raiz da pasta `backend/` e adicione as seguintes variáveis:
    ```env
    NODE_ENV=development
    PORT=3001
    MONGO_URI=SUA_STRING_DE_CONEXAO_MONGODB
    JWT_SECRET=UM_SEGREDO_FORTE_E_ALEATORIO
    FRONTEND_URL=http://localhost:5173
    ```

5.  Inicie o servidor backend:
    ```bash
    npm start
    ```
    O servidor estará rodando em `http://localhost:3001`.

### Instalação do Frontend

1.  Em um novo terminal, navegue até a pasta do frontend:
    ```bash
    cd ../frontend
    ```

2.  Instale as dependências do NPM:
    ```bash
    npm install
    ```

3.  Inicie o servidor de desenvolvimento do Vite:
    ```bash
    npm run dev
    ```
    A aplicação React estará disponível em `http://localhost:5173` (ou outra porta, se a 5173 estiver em uso).

---

## Como Contribuir

Contribuições são o que tornam a comunidade de código aberto um lugar incrível para aprender, inspirar e criar. Agradecemos muito qualquer contribuição.

Se desejar contribuir, siga o modelo Fork & Pull Request:

1.  **Faça um Fork** do projeto.
2.  Crie uma nova branch para sua feature (`git checkout -b feature/AmazingFeature`).
3.  Faça o commit de suas alterações (`git commit -m 'Add some AmazingFeature'`).
4.  Faça o push para a sua branch (`git push origin feature/AmazingFeature`).
5.  Abra um **Pull Request**.

---

## Autores

-   **Eduardo Wallner Giacomelli** - [GitHub](https://github.com/eduardo-w-giacomelli)
-   **Matias Adrian Fuks** - [GitHub](https://github.com/Matias-Fuks)

---


# 📦 API de Gerenciamento de Estoque

Esta é uma API robusta construída com **FastAPI** e **MongoDB** projetada para o gerenciamento completo de um sistema de estoque. Ela inclui autenticação de usuários baseada em JWT, diferentes níveis de permissão (Administrador e Funcionário), controle de produtos e rastreamento de movimentações.

## ✨ Principais Funcionalidades

  * **Autenticação Segura:** Sistema completo de autenticação usando **JWT** (JSON Web Tokens).
      * Registro de novos usuários.
      * Login com geração de token.
      * Recuperação de senha (token de reset com expiração).
  * **Controle de Acesso por Nível:**
      * **Funcionário (Padrão):** Pode ver produtos, movimentações e gerar relatórios.
      * **Admin:** Tem acesso total, incluindo gerenciamento de usuários (criar/deletar).
  * **Gerenciamento de Produtos:** CRUD completo para produtos (nome, categoria, preço, quantidade, validade).
  * **Rastreamento de Movimentações:** Registra cada **entrada** e **saída** de produtos, atualizando o estoque atomicamente.
  * **Relatórios e Dashboard:**
      * Endpoint de dashboard com estatísticas agregadas (valor total do estoque, produtos com baixo estoque, etc.).
      * Exportação do inventário completo em formato **CSV**.

## 🚀 Tecnologias Utilizadas

  * **Framework:** **FastAPI**
  * **Banco de Dados:** **MongoDB** (assíncrono com `motor`)
  * **Autenticação:** **JWT** (`pyjwt`)
  * **Hashing de Senhas:** `passlib` (com `bcrypt`)
  * **Modelagem de Dados:** `Pydantic`
  * **Exportação:** Módulo `csv` nativo do Python

-----

## 🏁 Como Executar

### 1\. Pré-requisitos

  * Python 3.9+
  * Um servidor MongoDB (local ou Atlas)

### 2\. Instalação

1.  Clone o repositório e crie um ambiente virtual:

    ```bash
    git clone ...
    cd seu-projeto
    python -m venv venv
    source venv/bin/activate  # No Windows: venv\Scripts\activate
    ```

2.  Instale as dependências:

    ```bash
    pip install fastapi "uvicorn[standard]" motor pydantic python-dotenv pyjwt "passlib[bcrypt]"
    ```

3.  Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

    ```.env
    # URL de conexão do seu MongoDB
    MONGO_URL=mongodb://usuario:senha@host:porta/

    # Nome do banco de dados
    DB_NAME=estoque_db

    # Chave secreta para assinar os tokens JWT (MUDE ISSO!)
    JWT_SECRET=sua-chave-secreta-muito-segura-123

    # Origens CORS permitidas (ex: seu frontend)
    CORS_ORIGINS=http://localhost:3000,http://localhost:3001
    ```

### 3\. Executando a Aplicação

Use o Uvicorn para iniciar o servidor:

```bash
uvicorn main:app --reload
```

A API estará disponível em `http://localhost:8000` e a documentação interativa em `http://localhost:8000/docs`.

-----

## 🗺️ Estrutura da API (Endpoints)

Todos os endpoints estão prefixados com `/api`. A maioria requer um token JWT (`Authorization: Bearer <token>`).

### 🔑 Autenticação (`/api/auth`)

| Método | Rota | Descrição | Acesso |
| :--- | :--- | :--- | :--- |
| `POST` | `/register` | Registra um novo usuário (padrão: "funcionário"). | Público |
| `POST` | `/login` | Autentica um usuário e retorna um token JWT. | Público |
| `GET` | `/me` | Retorna os dados do usuário autenticado. | Autenticado |
| `POST` | `/forgot-password` | Inicia o processo de redefinição de senha. | Público |
| `POST` | `/reset-password` | Conclui a redefinição de senha com um token válido. | Público |

### 👤 Usuários (`/api/usuarios`)

| Método | Rota | Descrição | Acesso |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Lista todos os usuários. | **Admin** |
| `POST` | `/` | Cria um novo usuário (admin ou funcionário). | **Admin** |
| `DELETE` | `/{user_id}` | Deleta um usuário. | **Admin** |

### 📦 Produtos (`/api/produtos`)

| Método | Rota | Descrição | Acesso |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Lista todos os produtos no estoque. | Autenticado |
| `POST` | `/` | Adiciona um novo produto ao estoque. | Autenticado |
| `GET` | `/baixo-estoque` | Lista produtos com quantidade \< 5. | Autenticado |
| `GET` | `/{product_id}` | Obtém detalhes de um produto específico. | Autenticado |
| `PUT` | `/{product_id}` | Atualiza os dados de um produto. | Autenticado |
| `DELETE` | `/{product_id}` | Deleta um produto do estoque. | Autenticado |

### 🚚 Movimentações (`/api/movimentacoes`)

| Método | Rota | Descrição | Acesso |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Lista todas as movimentações (entradas/saídas). | Autenticado |
| `POST` | `/` | Registra uma nova movimentação (atualiza o estoque). | Autenticado |
| `GET` | `/historico/{produto_id}` | Lista o histórico de movimentações de um produto. | Autenticado |

### 📊 Relatórios (`/api/relatorios`)

| Método | Rota | Descrição | Acesso |
| :--- | :--- | :--- | :--- |
| `GET` | `/dashboard` | Retorna dados agregados para um painel. | Autenticado |
| `GET` | `/export` | Baixa um relatório CSV do inventário de produtos. | Autenticado |

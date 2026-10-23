# Vinyl Control

Sistema web para gerenciamento de discos e controle de movimentações de estoque. O projeto permite autenticar usuários, consultar e cadastrar discos, editar registros, excluir discos e registrar movimentações por meio de uma API própria.

## Funcionalidades

- Autenticação de usuários com e-mail e senha.
- Controle de acesso às rotas protegidas por token JWT.
- Cadastro de discos.
- Listagem e consulta de discos cadastrados.
- Edição e exclusão de discos.
- Registro de movimentações de estoque.
- Integração entre frontend, backend e banco de dados.

## Tecnologias utilizadas

### Frontend
- HTML5
- CSS3
- JavaScript

### Backend
- Node.js
- Express
- Prisma ORM
- JWT
- CORS
- dotenv

### Banco de dados
- Banco de dados relacional integrado ao Prisma ORM.

## Estrutura do projeto

```text
Vinyl-Control/
├── src/
│   ├── controllers/
│   ├── middlewares/
│   └── routes/
├── .env
├── server.js
├── package.json
├── prisma/
└── frontend/
    ├── index.html
    ├── style.css
    └── script.js
```

A estrutura acima é ilustrativa. Os nomes das pastas e dos arquivos devem corresponder à organização real do repositório.

## Como executar o projeto

### 1. Clonar o repositório

```bash
git clone Sistema_Vinyl_Control-
```

Entre na pasta do projeto:

```bash
cd api
```

### 2. Instalar as dependências

Na pasta do backend, execute:

```bash
npm install
```

### 3. Configurar as variáveis de ambiente

Crie um arquivo `.env` na raiz do backend e configure as variáveis necessárias para a conexão com o banco de dados e a autenticação JWT.

Exemplo:

```env
PORT=3000
DATABASE_URL="SUA_URL_DE_CONEXAO"
SECRET_JWT="SUA_CHAVE_SECRETA"
```

Substitua os valores de exemplo pelos valores correspondentes ao seu ambiente. Não publique credenciais ou chaves secretas no GitHub.

### 4. Preparar o banco de dados

Execute os comandos necessários do Prisma conforme a configuração e as migrações existentes no projeto.

### 5. Iniciar o backend

```bash
npm start
```

O servidor utiliza a porta 3000 por padrão, caso outra porta não esteja configurada.

### 6. Abrir o frontend

Abra o arquivo HTML principal utilizando uma extensão de servidor local, como o Live Server do Visual Studio Code.

## Endpoints da API

As rotas protegidas exigem autenticação por token JWT.

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/` | Verificar se a API está funcionando |
| POST | `/usuarios/login` | Autenticar usuário |
| GET | `/discos/listar` | Listar discos |
| GET | `/discos/buscar/:id` | Consultar disco por ID |
| POST | `/discos/cadastrar` | Cadastrar disco |
| PUT | `/discos/editar/:id` | Editar disco |
| DELETE | `/discos/excluir/:id` | Excluir disco |
| POST | `/movimentacoes/cadastrar` | Registrar movimentação |

## Capturas de tela

### 1. Tela de login

![Tela de login](prints/login.png)

### 2. Painel principal

![Painel principal](prints/dashboard.png)

### 3. Cadastro e listagem de discos

![Cadastro e listagem de discos](prints/discos.png)

### 4. Controle de estoque e movimentações

![Controle de estoque e movimentações](prints/estoque.png)

## Objetivo do projeto

O Vinyl Control foi desenvolvido para praticar a criação de aplicações web integradas a uma API própria, utilizando operações CRUD, autenticação, organização de rotas e controllers e persistência de dados em banco de dados.

## Autoria

Projeto desenvolvido como prática de desenvolvimento de sistemas.
Feito pro biaams-sys e ClaraAntonnaci

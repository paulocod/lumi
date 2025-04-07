# Lumi - Sistema de Gestão de Faturas

[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Zod](https://img.shields.io/badge/Zod-1A365D?style=for-the-badge&logo=zod&logoColor=white)](https://zod.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Jest](https://img.shields.io/badge/Jest-C21325?style=for-the-badge&logo=jest&logoColor=white)](https://jestjs.io/)
[![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev/)
[![OpenTelemetry](https://img.shields.io/badge/OpenTelemetry-000000?style=for-the-badge&logo=opentelemetry&logoColor=white)](https://opentelemetry.io/)

## 📋 Sobre o Projeto

Lumi é um sistema moderno de gestão de faturas desenvolvido com tecnologias atuais e boas práticas de desenvolvimento. O projeto é composto por um backend em Node.js com NestJS e um frontend em React com TypeScript.

## 🏗️ Arquitetura do Projeto

### Backend (NestJS)

```
backend/
├── src/
│   ├── config/           # Configurações do aplicativo
│   ├── infrastructure/   # Configurações de infraestrutura
│   ├── modules/          # Módulos da aplicação
│   ├── queue/           # Processamento de filas
│   ├── shared/          # Código compartilhado
│   ├── app.module.ts    # Módulo principal
│   └── main.ts          # Ponto de entrada
├── prisma/              # Configurações e migrações do Prisma
├── test/               # Testes
└── docker-compose.yml  # Configuração do Docker
```

### Frontend (React + Vite)

```
frontend/
├── src/
│   ├── components/     # Componentes reutilizáveis
│   ├── contexts/       # Contextos do React
│   ├── hooks/          # Custom hooks
│   ├── pages/          # Páginas da aplicação
│   ├── schemas/        # Schemas de validação
│   ├── services/       # Serviços de API
│   ├── types/          # Definições de tipos
│   ├── App.tsx         # Componente principal
│   └── main.tsx        # Ponto de entrada
└── public/            # Arquivos estáticos
```

## 🚀 Tecnologias Utilizadas

### Backend
- Node.js com NestJS
- TypeScript
- PostgreSQL
- Redis para cache
- MinIO para armazenamento de objetos
- Jaeger para rastreamento distribuído
- Jest para testes
- Prisma como ORM

### Frontend
- React
- TypeScript
- Vite
- TailwindCSS
- Vitest para testes
- Zod para validação
- Chart.js para gráficos

## 🛠️ Pré-requisitos

- Docker e Docker Compose
- Node.js 18+
- npm ou yarn
- Git

## 🔧 Configuração do Ambiente

### 1. Clone o Repositório
```bash
git clone [URL_DO_REPOSITÓRIO]
cd lumi
```

### 2. Configuração do Backend

1. Entre na pasta do backend:
```bash
cd backend
```

2. Copie o arquivo de ambiente de exemplo:
```bash
cp .env.example .env
```

3. Configure as variáveis de ambiente no arquivo `.env`:
- `POSTGRES_USER`: Usuário do PostgreSQL
- `POSTGRES_PASSWORD`: Senha do PostgreSQL
- `POSTGRES_DB`: Nome do banco de dados
- `POSTGRES_PORT`: Porta do PostgreSQL (padrão: 5432)
- `REDIS_PORT`: Porta do Redis (padrão: 6379)
- `MINIO_ACCESS_KEY`: Chave de acesso do MinIO
- `MINIO_SECRET_KEY`: Chave secreta do MinIO
- `MINIO_PORT`: Porta do MinIO (padrão: 9000)
- `MINIO_CONSOLE_PORT`: Porta do console do MinIO (padrão: 9001)
- `JAEGER_UI_PORT`: Porta da interface do Jaeger (padrão: 16686)
- `BACKEND_PORT`: Porta do backend (padrão: 3001)
- `JWT_SECRET`: Chave secreta para JWT
- `JWT_EXPIRATION`: Tempo de expiração do JWT

### 3. Configuração do Frontend

1. Entre na pasta do frontend:
```bash
cd frontend
```

2. Instale as dependências:
```bash
npm install
```

## 🚀 Executando o Projeto

### Usando Docker Compose (Recomendado)

1. Na raiz do projeto, execute:
```bash
cd backend
docker-compose up -d
```

2. Inicie o frontend:
```bash
cd frontend
npm run dev
```

### Executando Localmente

#### Backend
```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run start:dev
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 📊 Acessando os Serviços

- **Backend API**: http://localhost:3001
- **Frontend**: http://localhost:5173
- **MinIO Console**: http://localhost:9001
- **Jaeger UI**: http://localhost:16686

## 🧪 Testes

### Backend
```bash
cd backend
npm run test
```

### Frontend
```bash
cd frontend
npm run test
```

## 📝 Documentação da API

A documentação da API está disponível em:
- Swagger UI: http://localhost:3001/api

## 🔍 Monitoramento e Observabilidade

- **Jaeger**: Acesse http://localhost:16686 para visualizar os traces
- **Logs**: Os logs do backend estão disponíveis em `backend/logs/`

## 💾 Armazenamento

- **MinIO**: Sistema de armazenamento de objetos
  - Console: http://localhost:9001
  - Credenciais de acesso:
    - Usuário: `lumi`
    - Senha: `lumi@1234`
  - As credenciais também podem ser configuradas no arquivo `.env` do backend

## 🔐 Segurança

- Autenticação via JWT
- Rate limiting configurável
- CORS configurável
- Validação de entrada de dados
- Sanitização de dados

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença [MIT](LICENSE).

## 🔑 Credenciais de Acesso

### Plataforma Web
- **URL**: http://localhost:5173
- **Credenciais de Acesso**:
  - Email: `admin@example.com`
  - Senha: `admin@123`

### API Backend
- **URL**: http://localhost:3001
- **Documentação**: http://localhost:3001/api
- Autenticação via JWT (Bearer Token)

### MinIO (Armazenamento)
- **Console**: http://localhost:9001
- **Credenciais**:
  - Usuário: `lumi`
  - Senha: `lumi@1234`

### Jaeger (Monitoramento)
- **URL**: http://localhost:16686 
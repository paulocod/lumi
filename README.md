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

## 🚀 Executando o Projeto

### Usando Docker Compose (Recomendado)

1. Clone o repositório:
```bash
git clone [URL_DO_REPOSITÓRIO]
cd lumi
```

2. Configure o ambiente:
```bash
cd backend
cp .env.example .env
npm install
```

3. Construa e inicie os containers:
```bash
# Construir as imagens
docker-compose build --no-cache

# Iniciar os containers
docker-compose up -d
```

4. Aguarde todos os serviços iniciarem (você pode acompanhar os logs):
```bash
docker-compose logs -f
```

O processo de inicialização irá:
- Aguardar todos os serviços (PostgreSQL, Redis, MinIO) estarem prontos
- Gerar o cliente Prisma
- Criar as tabelas no banco de dados
- Popular o banco com dados iniciais
- Iniciar a aplicação

### Possíveis Problemas e Soluções

Se encontrar erros durante a inicialização, siga estes passos:

1. Pare todos os containers e remova os volumes:
```bash
docker-compose down -v
```

2. Reconstrua as imagens sem cache:
```bash
docker-compose build --no-cache
```

3. Inicie novamente:
```bash
docker-compose up -d
```

4. Verifique os logs para identificar possíveis erros:
```bash
# Ver todos os logs
docker-compose logs -f

# Ver logs de um serviço específico
docker-compose logs -f backend
```

### Acessando os Serviços

Após a inicialização bem-sucedida, você pode acessar:

- **Backend API**: http://localhost:3001
  - Documentação (Swagger): http://localhost:3001/api
  - Credenciais padrão:
    - Email: `admin@example.com`
    - Senha: `admin@123`

- **MinIO Console**: http://localhost:9001
  - Usuário: `lumi`
  - Senha: `lumi@1234`

- **Jaeger UI**: http://localhost:16686

### Comandos Úteis

1. Verificar status dos containers:
```bash
docker-compose ps
```

2. Reiniciar um serviço específico:
```bash
docker-compose restart [serviço]
# Exemplo: docker-compose restart backend
```

3. Ver logs em tempo real:
```bash
docker-compose logs -f
```

4. Acessar o shell de um container:
```bash
docker-compose exec [serviço] sh
# Exemplo: docker-compose exec backend sh
```

5. Parar todos os serviços:
```bash
docker-compose down
```

### Volumes e Persistência

Os dados são persistidos nos seguintes volumes Docker:
- `postgres_data`: Banco de dados PostgreSQL
- `redis_data`: Cache Redis
- `minio_data`: Arquivos armazenados no MinIO

Para remover todos os dados e começar do zero:
```bash
docker-compose down -v
```
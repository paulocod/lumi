# Lumi - Projeto Fullstack

Projeto fullstack desenvolvido com NestJS (backend) e Next.js (frontend), seguindo as melhores práticas de desenvolvimento.

## 🚀 Tecnologias

### Backend
- NestJS (Node.js + TypeScript)
- Prisma (ORM)
- PostgreSQL
- Redis
- JWT para autenticação

### Frontend
- Next.js 14
- React
- TypeScript
- Tailwind CSS
- React Query

### Infraestrutura
- Docker
- Docker Compose
- PostgreSQL
- Redis

## 📋 Pré-requisitos

- Node.js 18+
- Docker e Docker Compose
- npm ou yarn

## 🛠️ Configuração do Ambiente

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/lumi.git
cd lumi
```

2. Configure as variáveis de ambiente:
```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env
```

3. Inicie os serviços de infraestrutura:
```bash
docker-compose up -d
```

4. Instale as dependências:
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

## 🚀 Desenvolvimento

### Backend
```bash
cd backend
npm run start:dev
```

### Frontend
```bash
cd frontend
npm run dev
```

## 📁 Estrutura do Projeto

```
.
├── backend/           # API NestJS
│   ├── src/          # Código fonte
│   ├── prisma/       # Schema e migrações
│   └── test/         # Testes
├── frontend/         # Aplicação Next.js
│   ├── src/          # Código fonte
│   ├── public/       # Arquivos estáticos
│   └── components/   # Componentes React
└── docker-compose.yml # Configuração dos serviços
```

## 🔒 Segurança

- Autenticação JWT
- Validação de dados
- Sanitização de inputs
- Headers de segurança
- CORS configurado

## 🧪 Testes

### Backend
```bash
cd backend
npm run test
npm run test:e2e
```

### Frontend
```bash
cd frontend
npm run test
```

## 📦 Deploy

O projeto está configurado para deploy em:
- Backend: [Render](https://render.com)
- Frontend: [Vercel](https://vercel.com)

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👥 Contribuição

1. Faça um Fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'feat: add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request 
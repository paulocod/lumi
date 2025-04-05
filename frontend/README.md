# Lumi - Frontend

Frontend da aplicação Lumi para visualização de faturas de energia elétrica.

## Tecnologias Utilizadas

- React
- TypeScript
- Vite
- Tailwind CSS
- React Query
- React Hook Form
- Zod
- Chart.js
- React Router DOM

## Requisitos

- Node.js 18+
- npm ou yarn

## Instalação

1. Clone o repositório
2. Instale as dependências:

```bash
npm install
# ou
yarn
```

3. Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```
VITE_API_URL=http://localhost:3000
```

## Desenvolvimento

Para iniciar o servidor de desenvolvimento:

```bash
npm run dev
# ou
yarn dev
```

O aplicativo estará disponível em `http://localhost:5173`.

## Build

Para criar uma versão de produção:

```bash
npm run build
# ou
yarn build
```

Os arquivos gerados estarão na pasta `dist`.

## Estrutura do Projeto

```
src/
  ├── assets/        # Imagens, fontes e outros recursos estáticos
  ├── components/    # Componentes reutilizáveis
  ├── hooks/         # Hooks personalizados
  ├── pages/         # Páginas da aplicação
  ├── services/      # Serviços de API
  ├── types/         # Definições de tipos TypeScript
  ├── utils/         # Funções utilitárias
  ├── App.tsx        # Componente principal
  └── main.tsx       # Ponto de entrada
```

## Funcionalidades

- Autenticação de usuários
- Dashboard com gráficos de consumo e economia
- Listagem de faturas com filtros
- Upload de faturas (apenas para administradores)
- Download de faturas em PDF

## Licença

MIT

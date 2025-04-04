#!/bin/bash

if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

if [ -z "$DATABASE_URL" ]; then
  echo "Erro: DATABASE_URL não está definida no arquivo .env"
  exit 1
fi

echo "Executando seed do banco de dados..."
npx prisma db seed

if [ $? -eq 0 ]; then
  echo "Seed concluído com sucesso!"
else
  echo "Erro ao executar o seed do banco de dados."
  exit 1
fi 
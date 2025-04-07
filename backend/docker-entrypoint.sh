#!/bin/sh
set -e

echo "Iniciando script de entrada..."

# Função para verificar se um serviço está pronto
wait_for_service() {
    local host=$1
    local port=$2
    local service=$3

    echo "Aguardando serviço $service em $host:$port..."
    while ! nc -z $host $port; do
        echo "Aguardando $service..."
        sleep 1
    done
    echo "$service está pronto!"
}

# Instalar netcat para verificação de portas
apk add --no-cache netcat-openbsd

# Aguardar serviços
wait_for_service postgres 5432 "PostgreSQL"
wait_for_service redis 6379 "Redis"
wait_for_service minio 9000 "MinIO"

echo "Todos os serviços estão prontos!"

echo "Gerando cliente Prisma..."
npx prisma generate

echo "Sincronizando schema com o banco..."
npx prisma db push --accept-data-loss

echo "Executando seed do banco de dados..."
npx prisma db seed

echo "Iniciando aplicação..."
exec "$@"
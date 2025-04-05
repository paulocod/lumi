import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  await prisma.invoice.deleteMany();
  await prisma.user.deleteMany();

  console.log('Dados anteriores removidos com sucesso');

  const hashedPassword = await bcrypt.hash('admin123', 10);
  const userPassword = await bcrypt.hash('user123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Administrador',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      name: 'Usuário Padrão',
      password: userPassword,
      role: 'USER',
    },
  });

  await Promise.all([
    prisma.invoice.create({
      data: {
        clientNumber: '123456789',
        referenceMonth: new Date('2023-01-01'),
        electricityQuantity: 100.5,
        electricityValue: 150.75,
        sceeQuantity: 50.2,
        sceeValue: 75.3,
        compensatedEnergyQuantity: 30.0,
        compensatedEnergyValue: 45.0,
        publicLightingValue: 10.0,
        status: 'PENDING',
      },
    }),
    prisma.invoice.create({
      data: {
        clientNumber: '987654321',
        referenceMonth: new Date('2023-02-01'),
        electricityQuantity: 120.8,
        electricityValue: 181.2,
        sceeQuantity: 60.5,
        sceeValue: 90.75,
        compensatedEnergyQuantity: 40.0,
        compensatedEnergyValue: 60.0,
        publicLightingValue: 12.0,
        status: 'COMPLETED',
        pdfUrl: 'https://example.com/invoice-987654321.pdf',
      },
    }),
    prisma.invoice.create({
      data: {
        clientNumber: '123456789',
        referenceMonth: new Date('2023-03-01'),
        electricityQuantity: 90.3,
        electricityValue: 135.45,
        sceeQuantity: 45.1,
        sceeValue: 67.65,
        compensatedEnergyQuantity: 25.0,
        compensatedEnergyValue: 37.5,
        publicLightingValue: 8.0,
        status: 'ERROR',
        error: 'Erro ao processar PDF',
      },
    }),
  ]);

  console.log('Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
    return;
  });

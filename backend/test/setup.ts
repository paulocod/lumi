import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

let app: INestApplication;
let prisma: PrismaService;

beforeAll(async () => {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleRef.createNestApplication();
  prisma = moduleRef.get(PrismaService);

  await app.init();
});

afterAll(async () => {
  if (prisma) {
    await prisma.$disconnect();
  }
  if (app) {
    await app.close();
  }
});

export { app, prisma };

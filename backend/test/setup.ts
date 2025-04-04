import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppModule } from '@/app.module';

let app: INestApplication;
let prisma: PrismaService;

beforeAll(async () => {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleRef.createNestApplication();
  prisma = app.get<PrismaService>(PrismaService);
  await app.init();
});

afterAll(async () => {
  await prisma.$disconnect();
  await app.close();
});

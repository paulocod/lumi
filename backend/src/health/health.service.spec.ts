import { Test, TestingModule } from '@nestjs/testing';
import { HealthService } from './health.service';
import { PrismaService } from '../prisma/prisma.service';

describe('HealthService', () => {
  let service: HealthService;
  let prisma: PrismaService;
  let queryRawSpy: jest.SpyInstance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: PrismaService,
          useValue: {
            $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]),
          },
        },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
    prisma = module.get<PrismaService>(PrismaService);
    queryRawSpy = jest.spyOn(prisma, '$queryRaw');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should check database health', async () => {
    const result = await service.checkDatabase();
    expect(result).toBeDefined();
    expect(result.status).toBe('ok');
    expect(queryRawSpy).toHaveBeenCalledTimes(1);
  });
});

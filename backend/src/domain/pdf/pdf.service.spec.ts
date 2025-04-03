import { Test, TestingModule } from '@nestjs/testing';
import { PdfService } from './pdf.service';
import { LoggerService } from '../../config/logger.service';

const mockLoggerService = {
  error: jest.fn(),
  log: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

describe('PdfService', () => {
  let service: PdfService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PdfService,
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    service = module.get<PdfService>(PdfService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

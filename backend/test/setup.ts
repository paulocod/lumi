import { Logger } from '@nestjs/common';

Logger.overrideLogger(['error', 'warn']);

beforeAll(() => {});

afterAll(() => {});

beforeEach(() => {});

afterEach(() => {
  jest.clearAllMocks();
});

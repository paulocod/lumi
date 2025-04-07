import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from 'prisma/prisma.service';

import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    password: 'hashedPassword',
    name: 'Test User',
    role: 'USER',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockCacheManager = {
    set: jest.fn(),
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    };

    it('deve registrar um novo usuário com sucesso', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword' as never);

      const result = await service.register(registerDto);

      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: registerDto.email,
          password: 'hashedPassword',
          name: registerDto.name,
        },
      });
    });

    it('deve lançar erro quando o email já está em uso', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('deve fazer login com sucesso', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      mockJwtService.sign.mockReturnValue('token');
      mockCacheManager.set.mockResolvedValue(undefined);

      const result = await service.login(loginDto);

      expect(result).toEqual({
        access_token: 'token',
        refresh_token: 'token',
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          role: mockUser.role,
          createdAt: mockUser.createdAt,
          updatedAt: mockUser.updatedAt,
        },
      });
    });

    it('deve lançar erro quando o usuário não existe', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('deve lançar erro quando a senha está incorreta', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refreshToken', () => {
    const refreshToken = 'valid-refresh-token';
    const mockPayload = {
      sub: '1',
      email: 'test@example.com',
      role: 'USER',
    };

    it('deve renovar o token de acesso com sucesso', async () => {
      mockJwtService.verify.mockReturnValue(mockPayload);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockCacheManager.get.mockResolvedValue(refreshToken);
      mockJwtService.sign.mockReturnValue('new-access-token');

      const result = await service.refreshToken(refreshToken);

      expect(result).toEqual({
        access_token: 'new-access-token',
      });
    });

    it('deve lançar erro quando o token é inválido', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.refreshToken(refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('deve lançar erro quando o usuário não existe', async () => {
      mockJwtService.verify.mockReturnValue(mockPayload);
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.refreshToken(refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});

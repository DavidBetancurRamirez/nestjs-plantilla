import { JwtService } from '@nestjs/jwt';
import { TokenService } from './token.service';
import { ConfigService } from '@nestjs/config';
import { Role } from '../common/enums/rol.enum';
import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';

describe('TokenService', () => {
  let tokenService: TokenService;

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockImplementation((key: string) => {
      switch (key) {
        case 'JWT_SECRET':
          return 'accessSecret';
        case 'JWT_REFRESH_SECRET':
          return 'refreshSecret';
      }
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    tokenService = module.get<TokenService>(TokenService);
  });

  describe('generateTokens', () => {
    it('should generate access and refresh tokens', async () => {
      const mookUser = {
        id: 1,
        name: "test",
        email: "test@test.com",
        roles: [Role.USER],
      }
      const accessToken = 'accessToken';
      const refreshToken = 'refreshToken';

      mockJwtService.sign
        .mockImplementationOnce(() => accessToken)
        .mockImplementationOnce(() => refreshToken);

      const result = await tokenService.generateTokens(mookUser);

      expect(result).toEqual({ accesToken: accessToken, refreshToken, data: mookUser });
      expect(mockJwtService.sign).toHaveBeenCalledTimes(2);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify the access token and return payload', () => {
      const token = 'validAccessToken';
      const payload = { email: 'test@test.com', roles: ['user'] };
      
      mockJwtService.verify.mockReturnValue(payload);

      const result = tokenService.verifyAccessToken(token);

      expect(result).toEqual(payload);
      expect(mockJwtService.verify).toHaveBeenCalledWith(token, { secret: 'accessSecret' });
    });

    it('should throw UnauthorizedException if token is invalid', () => {
      const token = 'invalidAccessToken';
      mockJwtService.verify.mockImplementation(() => {
        throw new Error();
      });

      expect(() => tokenService.verifyAccessToken(token)).toThrow(UnauthorizedException);
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify the refresh token and return payload', () => {
      const token = 'validRefreshToken';
      const payload = { email: 'test@test.com' };

      mockJwtService.verify.mockReturnValue(payload);

      const result = tokenService.verifyRefreshToken(token);

      expect(result).toEqual(payload);
      expect(mockJwtService.verify).toHaveBeenCalledWith(token, { secret: 'refreshSecret' });
    });

    it('should throw UnauthorizedException if refresh token is invalid', () => {
      const token = 'invalidRefreshToken';
      mockJwtService.verify.mockImplementation(() => {
        throw new Error();
      });

      expect(() => tokenService.verifyRefreshToken(token)).toThrow(UnauthorizedException);
    });
  });
});

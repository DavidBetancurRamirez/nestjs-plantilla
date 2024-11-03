import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { RegisterDto } from './dto/register.dto';
import { UserService } from '../user/user.service';
import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

describe('AuthService', () => {
  let authService: AuthService;
  const mockUserService = {
    create: jest.fn(),
    validateUser: jest.fn(),
    findOneByEmail: jest.fn(),
  };

  const mockTokenService = {
    generateTokens: jest.fn(),
    verifyRefreshToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: mockUserService },
        { provide: TokenService, useValue: mockTokenService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should register a user and generate tokens', async () => {
      const registerDto: RegisterDto = { email: 'test@test.com', password: 'password' };
      const user = { email: 'test@test.com', roles: ['user'] };
      const tokens = { accesToken: 'accessToken', refreshToken: 'refreshToken', data: user };

      mockUserService.create.mockResolvedValue(user);
      mockTokenService.generateTokens.mockResolvedValue(tokens);

      const result = await authService.register(registerDto);

      expect(result).toEqual(tokens);
      expect(mockUserService.create).toHaveBeenCalledWith(registerDto);
      expect(mockTokenService.generateTokens).toHaveBeenCalledWith(user);
    });
  });

  describe('login', () => {
    it('should login a user and generate tokens', async () => {
      const loginDto: LoginDto = { email: 'test@test.com', password: 'password' };
      const user = { email: 'test@test.com', roles: ['user'] };
      const tokens = { accesToken: 'accessToken', refreshToken: 'refreshToken', data: user };

      mockUserService.validateUser.mockResolvedValue(user);
      mockTokenService.generateTokens.mockResolvedValue(tokens);

      const result = await authService.login(loginDto);

      expect(result).toEqual(tokens);
      expect(mockUserService.validateUser).toHaveBeenCalledWith(loginDto.email, loginDto.password);
      expect(mockTokenService.generateTokens).toHaveBeenCalledWith(user);
    });
  });

  describe('refreshToken', () => {
    it('should refresh the token and generate new tokens', async () => {
      const refreshToken = 'validRefreshToken';
      const decoded = { email: 'test@test.com' };
      const user = { email: 'test@test.com', roles: ['user'] };
      const tokens = { accesToken: 'newAccessToken', refreshToken: 'newRefreshToken', data: user };

      mockTokenService.verifyRefreshToken.mockReturnValue(decoded);
      mockUserService.findOneByEmail.mockResolvedValue(user);
      mockTokenService.generateTokens.mockResolvedValue(tokens);

      const result = await authService.refreshToken(refreshToken);

      expect(result).toEqual(tokens);
      expect(mockTokenService.verifyRefreshToken).toHaveBeenCalledWith(refreshToken);
      expect(mockUserService.findOneByEmail).toHaveBeenCalledWith(decoded.email);
      expect(mockTokenService.generateTokens).toHaveBeenCalledWith(user);
    });

    it('should throw BadRequestException if user not found', async () => {
      const refreshToken = 'validRefreshToken';
      const decoded = { email: 'test@test.com' };

      mockTokenService.verifyRefreshToken.mockReturnValue(decoded);
      mockUserService.findOneByEmail.mockResolvedValue(null); // Simular que no se encuentra el usuario

      await expect(authService.refreshToken(refreshToken)).rejects.toThrow(BadRequestException);
      expect(mockTokenService.verifyRefreshToken).toHaveBeenCalledWith(refreshToken);
      expect(mockUserService.findOneByEmail).toHaveBeenCalledWith(decoded.email);
    });
  });
});

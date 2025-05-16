import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Role } from '../roles/enums/role.enum';
import { User } from '../users/entities/user.entity';

// Mock de bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockImplementation(() => Promise.resolve('hashedPassword')),
  compare: jest.fn().mockImplementation(() => Promise.resolve(true)),
}));

describe('AuthService', () => {
  let authService: AuthService;
  let jwtService: JwtService;
  let usersService: UsersService;

  const mockUser = {
    id: 1,
    nombre: 'Test User',
    email: 'test@example.com',
    username: 'testuser',
    password: 'hashedPassword',
    estado: 'ACTIVO',
    roles: [Role.ADMIN],
    empleadoId: 100,
    comparePassword: jest.fn().mockResolvedValue(true),
  } as unknown as User;

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('test-token'),
    verify: jest.fn().mockReturnValue({ sub: 1, nombre: 'Test User' }),
  };

  const mockUsersService = {
    findByUsername: jest.fn().mockResolvedValue(mockUser),
    findByEmail: jest.fn().mockResolvedValue(mockUser),
    findById: jest.fn().mockResolvedValue(mockUser),
    updatePassword: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    console.log('======== PREPARANDO TESTS DE AUTH SERVICE ========');
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    usersService = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    console.log('🧪 TEST: El servicio de autenticación debe estar definido');
    expect(authService).toBeDefined();
  });

  describe('validateToken', () => {
    it('should return the decoded token when token is valid', () => {
      console.log(
        '🧪 TEST: validateToken debe devolver el token decodificado cuando es válido',
      );
      const result = authService.validateToken('valid-token');
      expect(jwtService.verify).toHaveBeenCalledWith('valid-token');
      expect(result).toEqual({ sub: 1, nombre: 'Test User' });
    });

    it('should throw UnauthorizedException when token is invalid', () => {
      console.log(
        '🧪 TEST: validateToken debe lanzar UnauthorizedException cuando el token es inválido',
      );
      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error();
      });

      expect(() => authService.validateToken('invalid-token')).toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('login', () => {
    it('should return access token and user data when credentials are valid', async () => {
      console.log(
        '🧪 TEST: login debe devolver token y datos del usuario cuando las credenciales son válidas',
      );
      const loginDto = { username: 'testuser', password: 'password' };

      const result = await authService.login(loginDto);

      expect(usersService.findByUsername).toHaveBeenCalledWith('testuser');
      expect(mockUser.comparePassword).toHaveBeenCalledWith('password');
      expect(jwtService.sign).toHaveBeenCalled();
      expect(result).toEqual({
        access_token: 'test-token',
        user: {
          id: mockUser.id,
          nombre: mockUser.nombre,
          email: mockUser.email,
          empleadoId: mockUser.empleadoId,
          estado: mockUser.estado,
          roles: mockUser.roles,
        },
      });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      console.log(
        '🧪 TEST: login debe lanzar UnauthorizedException cuando el usuario no existe',
      );
      const loginDto = { username: 'nonexistent', password: 'password' };
      jest.spyOn(usersService, 'findByUsername').mockResolvedValue(null);

      await expect(authService.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when password is incorrect', async () => {
      console.log(
        '🧪 TEST: login debe lanzar UnauthorizedException cuando la contraseña es incorrecta',
      );
      const loginDto = { username: 'testuser', password: 'wrong-password' };
      const userWithWrongPass = {
        ...mockUser,
        comparePassword: jest.fn().mockResolvedValue(false),
      } as unknown as User;
      jest
        .spyOn(usersService, 'findByUsername')
        .mockResolvedValue(userWithWrongPass);

      await expect(authService.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when user is inactive', async () => {
      console.log(
        '🧪 TEST: login debe lanzar UnauthorizedException cuando el usuario está inactivo',
      );
      const loginDto = { username: 'testuser', password: 'password' };
      const inactiveUser = {
        ...mockUser,
        estado: 'INACTIVO',
      } as unknown as User;
      jest
        .spyOn(usersService, 'findByUsername')
        .mockResolvedValue(inactiveUser);

      await expect(authService.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('forgotPassword', () => {
    it('should reset password and return user data', async () => {
      console.log(
        '🧪 TEST: forgotPassword debe resetear la contraseña y devolver datos del usuario',
      );
      const forgotPasswordDto = { email: 'test@example.com' };
      const generateRandomPasswordSpy = jest.spyOn(
        authService as any,
        'generateRandomPassword',
      );
      generateRandomPasswordSpy.mockReturnValue('random123');

      const result = await authService.forgotPassword(forgotPasswordDto);

      expect(usersService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.hash).toHaveBeenCalledWith('random123', 10);
      expect(usersService.updatePassword).toHaveBeenCalledWith(
        mockUser.id,
        'hashedPassword',
      );
      expect(result).toEqual({
        user: {
          email: mockUser.email,
          nombre: mockUser.nombre,
          newPassword: 'random123',
        },
      });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      console.log(
        '🧪 TEST: forgotPassword debe lanzar UnauthorizedException cuando el usuario no existe',
      );
      const forgotPasswordDto = { email: 'nonexistent@example.com' };
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);

      await expect(
        authService.forgotPassword(forgotPasswordDto),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('resetPassword', () => {
    it('should change password and return user data', async () => {
      console.log(
        '🧪 TEST: resetPassword debe cambiar la contraseña y devolver datos del usuario',
      );
      const changePasswordDto = {
        oldPassword: 'oldPassword',
        newPassword: 'NewPassword123',
      };

      const result = await authService.resetPassword(changePasswordDto, 1);

      expect(usersService.findById).toHaveBeenCalledWith(1);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'oldPassword',
        mockUser.password,
      );
      expect(bcrypt.hash).toHaveBeenCalledWith('NewPassword123', 10);
      expect(usersService.updatePassword).toHaveBeenCalledWith(
        mockUser.id,
        'hashedPassword',
      );
      expect(result).toEqual({
        user: {
          email: mockUser.email,
          nombre: mockUser.nombre,
          newPassword: 'NewPassword123',
        },
      });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      console.log(
        '🧪 TEST: resetPassword debe lanzar UnauthorizedException cuando el usuario no existe',
      );
      const changePasswordDto = {
        oldPassword: 'oldPassword',
        newPassword: 'NewPassword123',
      };
      jest
        .spyOn(usersService, 'findById')
        .mockResolvedValue(null as unknown as User);

      await expect(
        authService.resetPassword(changePasswordDto, 1),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when old password is incorrect', async () => {
      console.log(
        '🧪 TEST: resetPassword debe lanzar UnauthorizedException cuando la contraseña anterior es incorrecta',
      );
      const changePasswordDto = {
        oldPassword: 'wrongPassword',
        newPassword: 'NewPassword123',
      };
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(
        authService.resetPassword(changePasswordDto, 1),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('generateRandomPassword', () => {
    it('should generate a random password with correct length', () => {
      console.log(
        '🧪 TEST: generateRandomPassword debe generar una contraseña aleatoria de longitud correcta',
      );
      const password = (authService as any).generateRandomPassword();
      expect(password).toHaveLength(10);
      expect(typeof password).toBe('string');
    });
  });
});

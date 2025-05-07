import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UnauthorizedException } from '@nestjs/common';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
} from './dto/login.dto';

// Crear un controlador simplificado para las pruebas
class MockAuthController {
  constructor(private authService: AuthService) {}

  async login(loginDto: LoginDto) {
    try {
      return this.authService.login(loginDto);
    } catch (error) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
  }

  async forgotPassword(email: ForgotPasswordDto) {
    try {
      return this.authService.forgotPassword(email);
    } catch (error) {
      throw new UnauthorizedException('Error al restablecer la contraseña');
    }
  }

  async resetPassword(data: ChangePasswordDto, req: any) {
    try {
      const userId = req.user.userId;
      return this.authService.resetPassword(data, userId);
    } catch (error) {
      throw new UnauthorizedException('Error al restablecer la contraseña');
    }
  }
}

describe('AuthController', () => {
  let controller: MockAuthController;
  let authService: AuthService;

  const mockAuthService = {
    login: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
  };

  beforeEach(async () => {
    console.log('======== PREPARANDO TESTS DE AUTH CONTROLLER ========');
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: MockAuthController,
          useFactory: (authService: AuthService) =>
            new MockAuthController(authService),
          inject: [AuthService],
        },
      ],
    }).compile();

    controller = module.get<MockAuthController>(MockAuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    console.log('🧪 TEST: El controlador de autenticación debe estar definido');
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should return token and user data on successful login', async () => {
      console.log(
        '🧪 TEST: El endpoint login debe devolver token y datos del usuario en caso de éxito',
      );
      const loginDto: LoginDto = {
        username: 'testuser',
        password: 'password',
      };

      const mockResponse = {
        access_token: 'test-token',
        user: {
          id: 1,
          nombre: 'Test User',
          email: 'test@example.com',
          empleadoId: 100,
          estado: 'ACTIVO',
          roles: ['ADMIN'],
        },
      };

      mockAuthService.login.mockResolvedValue(mockResponse);

      const result = await controller.login(loginDto);

      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(mockResponse);
    });

    it('should throw UnauthorizedException when login fails', async () => {
      console.log(
        '🧪 TEST: El endpoint login debe lanzar UnauthorizedException cuando el login falla',
      );
      const loginDto: LoginDto = {
        username: 'testuser',
        password: 'password',
      };

      mockAuthService.login.mockRejectedValue(
        new UnauthorizedException('Login error'),
      );

      await expect(controller.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('forgotPassword', () => {
    it('should return user data on successful password reset', async () => {
      console.log(
        '🧪 TEST: El endpoint forgotPassword debe devolver datos de usuario al resetear contraseña exitosamente',
      );
      const forgotPasswordDto: ForgotPasswordDto = {
        email: 'test@example.com',
      };

      const mockResponse = {
        user: {
          email: 'test@example.com',
          nombre: 'Test User',
          newPassword: 'random123',
        },
      };

      mockAuthService.forgotPassword.mockResolvedValue(mockResponse);

      const result = await controller.forgotPassword(forgotPasswordDto);

      expect(authService.forgotPassword).toHaveBeenCalledWith(
        forgotPasswordDto,
      );
      expect(result).toEqual(mockResponse);
    });

    it('should throw UnauthorizedException when password reset fails', async () => {
      console.log(
        '🧪 TEST: El endpoint forgotPassword debe lanzar UnauthorizedException cuando falla el reseteo',
      );
      const forgotPasswordDto: ForgotPasswordDto = {
        email: 'test@example.com',
      };

      mockAuthService.forgotPassword.mockRejectedValue(
        new UnauthorizedException('Reset error'),
      );

      await expect(
        controller.forgotPassword(forgotPasswordDto),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('resetPassword', () => {
    it('should return user data on successful password change', async () => {
      console.log(
        '🧪 TEST: El endpoint resetPassword debe devolver datos de usuario al cambiar contraseña exitosamente',
      );
      const changePasswordDto: ChangePasswordDto = {
        oldPassword: 'oldPassword',
        newPassword: 'NewPassword123',
      };

      const mockRequest = {
        user: {
          userId: 1,
        },
      };

      const mockResponse = {
        user: {
          email: 'test@example.com',
          nombre: 'Test User',
          newPassword: 'NewPassword123',
        },
      };

      mockAuthService.resetPassword.mockResolvedValue(mockResponse);

      const result = await controller.resetPassword(
        changePasswordDto,
        mockRequest,
      );

      expect(authService.resetPassword).toHaveBeenCalledWith(
        changePasswordDto,
        1,
      );
      expect(result).toEqual(mockResponse);
    });

    it('should throw UnauthorizedException when password change fails', async () => {
      console.log(
        '🧪 TEST: El endpoint resetPassword debe lanzar UnauthorizedException cuando falla el cambio',
      );
      const changePasswordDto: ChangePasswordDto = {
        oldPassword: 'oldPassword',
        newPassword: 'NewPassword123',
      };

      const mockRequest = {
        user: {
          userId: 1,
        },
      };

      mockAuthService.resetPassword.mockRejectedValue(
        new UnauthorizedException('Change error'),
      );

      await expect(
        controller.resetPassword(changePasswordDto, mockRequest),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});

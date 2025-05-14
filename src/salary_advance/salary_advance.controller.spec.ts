import { Test, TestingModule } from '@nestjs/testing';
import { SalaryAdvanceController } from './salary_advance.controller';
import { SalaryAdvanceService } from './salary_advance.service';
import { CreateAdvanceDto } from './dto/create-salary_advance.dto';
import { ApproveAdvanceDto } from './dto/approve-advance.dto';
import { UnauthorizedException } from '@nestjs/common';

// Mock para JwtAuthGuard
jest.mock('src/auth/guards/jwt-auth.guard', () => ({
  JwtAuthGuard: jest.fn().mockImplementation(() => ({
    canActivate: jest.fn().mockReturnValue(true),
  })),
}));

// Mock para RolesGuard
jest.mock('src/roles/guards/roles.guard', () => ({
  RolesGuard: jest.fn().mockImplementation(() => ({
    canActivate: jest.fn().mockReturnValue(true),
  })),
}));

// Mock para MailerInterceptor
jest.mock('src/mailer/interceptor/mailer.interceptor', () => ({
  MailerInterceptor: jest.fn().mockImplementation(() => ({
    intercept: jest.fn().mockImplementation((context, next) => next.handle()),
  })),
}));

describe('SalaryAdvanceController', () => {
  let controller: SalaryAdvanceController;
  let service: SalaryAdvanceService;

  // Mock data
  const mockEmployee = {
    id: 1,
    nombre: 'Juan',
    apellido: 'Pérez',
    email: 'juan.perez@example.com',
  };

  const mockAdvance = {
    id: 1,
    employee: mockEmployee,
    amount: 10000,
    reason: 'Gastos médicos imprevistos',
    status: 'pending',
    createdAt: new Date('2025-05-07T15:30:00.000Z'),
    updatedAt: new Date('2025-05-07T15:30:00.000Z'),
  };

  const mockApprovedAdvance = {
    ...mockAdvance,
    status: 'approved',
    approvedBy: 'admin123',
    approvedAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRejectedAdvance = {
    ...mockAdvance,
    status: 'rejected',
    updatedAt: new Date(),
  };

  // Mock service
  const mockSalaryAdvanceService = {
    createAdvance: jest.fn(),
    getAll: jest.fn(),
    approve: jest.fn(),
    reject: jest.fn(),
  };

  beforeEach(async () => {
    console.log(
      '======== PREPARANDO TESTS DE SALARY ADVANCE CONTROLLER ========',
    );

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SalaryAdvanceController],
      providers: [
        {
          provide: SalaryAdvanceService,
          useValue: mockSalaryAdvanceService,
        },
      ],
    }).compile();

    controller = module.get<SalaryAdvanceController>(SalaryAdvanceController);
    service = module.get<SalaryAdvanceService>(SalaryAdvanceService);

    // Resetear los mocks antes de cada prueba
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    console.log(
      '🧪 TEST: El controlador de adelantos salariales debería estar definido',
    );
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new salary advance', async () => {
      console.log('🧪 TEST: Debe crear un nuevo adelanto salarial');

      // Arrange
      const createDto: CreateAdvanceDto = {
        amount: 10000,
        reason: 'Gastos médicos imprevistos',
        status: 'pending',
      };

      const req = { user: { userId: 1, empleadoId: 1 } };

      mockSalaryAdvanceService.createAdvance.mockResolvedValue(mockAdvance);

      // Act
      const result = await controller.create(createDto, req);

      // Assert
      expect(mockSalaryAdvanceService.createAdvance).toHaveBeenCalledWith(
        createDto,
        req.user,
      );
      expect(result).toEqual(mockAdvance);
    });
  });

  describe('findAll', () => {
    it('should return all salary advances', async () => {
      console.log('🧪 TEST: Debe retornar todos los adelantos salariales');

      // Arrange
      const mockAdvances = [
        mockAdvance,
        mockApprovedAdvance,
        mockRejectedAdvance,
      ];
      mockSalaryAdvanceService.getAll.mockResolvedValue(mockAdvances);

      // Act
      const result = await controller.findAll();

      // Assert
      expect(mockSalaryAdvanceService.getAll).toHaveBeenCalled();
      expect(result).toEqual(mockAdvances);
    });
  });

  describe('approveOrRejectAdvance', () => {
    it('should approve a salary advance', async () => {
      console.log('🧪 TEST: Debe aprobar un adelanto salarial');

      // Arrange
      const approveDto: ApproveAdvanceDto = {
        status: 'approved',
        comentario: 'Aprobado según política de la empresa',
      };

      const req = { user: { userId: 'admin123' } };

      mockSalaryAdvanceService.approve.mockResolvedValue(mockApprovedAdvance);

      // Act
      const result = await controller.approveOrRejectAdvance(
        '1',
        approveDto,
        req,
      );

      // Assert
      expect(mockSalaryAdvanceService.approve).toHaveBeenCalledWith(
        '1',
        'admin123',
      );
      expect(result).toEqual(mockApprovedAdvance);
    });

    it('should reject a salary advance', async () => {
      console.log('🧪 TEST: Debe rechazar un adelanto salarial');

      // Arrange
      const rejectDto: ApproveAdvanceDto = {
        status: 'rejected',
        comentario: 'Rechazado por exceder el límite mensual',
      };

      const req = { user: { userId: 'admin123' } };

      mockSalaryAdvanceService.reject.mockResolvedValue(mockRejectedAdvance);

      // Act
      const result = await controller.approveOrRejectAdvance(
        '1',
        rejectDto,
        req,
      );

      // Assert
      expect(mockSalaryAdvanceService.reject).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockRejectedAdvance);
    });

    it('should throw UnauthorizedException if userId is missing', async () => {
      console.log(
        '🧪 TEST: Debe lanzar UnauthorizedException si el userId falta',
      );

      // Arrange
      const approveDto: ApproveAdvanceDto = {
        status: 'approved',
        comentario: 'Aprobado según política de la empresa',
      };

      const req = { user: {} }; // Sin userId

      // Act & Assert
      try {
        await controller.approveOrRejectAdvance('1', approveDto, req);
        // Si llegamos aquí, la prueba debe fallar
        fail('Se esperaba que se lanzara UnauthorizedException');
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
      }
    });
  });
});

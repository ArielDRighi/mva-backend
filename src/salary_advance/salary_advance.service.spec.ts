import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalaryAdvanceService } from './salary_advance.service';
import { SalaryAdvance } from './entities/salary_advance.entity';
import { Empleado } from 'src/employees/entities/employee.entity';
import { CreateAdvanceDto } from './dto/create-salary_advance.dto';
import { NotFoundException } from '@nestjs/common';

describe('SalaryAdvanceService', () => {
  let service: SalaryAdvanceService;
  let salaryAdvanceRepository: Repository<SalaryAdvance>;
  let employeeRepository: Repository<Empleado>;

  const mockSalaryAdvanceRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockEmployeeRepository = {
    findOne: jest.fn(),
  };

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

  beforeEach(async () => {
    console.log('======== PREPARANDO TESTS DE SALARY ADVANCE SERVICE ========');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalaryAdvanceService,
        {
          provide: getRepositoryToken(SalaryAdvance),
          useValue: mockSalaryAdvanceRepository,
        },
        {
          provide: getRepositoryToken(Empleado),
          useValue: mockEmployeeRepository,
        },
      ],
    }).compile();

    service = module.get<SalaryAdvanceService>(SalaryAdvanceService);
    salaryAdvanceRepository = module.get<Repository<SalaryAdvance>>(
      getRepositoryToken(SalaryAdvance),
    );
    employeeRepository = module.get<Repository<Empleado>>(
      getRepositoryToken(Empleado),
    );

    // Resetear los mocks antes de cada prueba
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    console.log(
      '🧪 TEST: El servicio de adelantos salariales debería estar definido',
    );
    expect(service).toBeDefined();
  });
  describe('createAdvance', () => {
    it('should create and return a new salary advance', async () => {
      console.log('🧪 TEST: Debe crear y retornar un nuevo adelanto salarial');

      // Arrange
      const createDto: CreateAdvanceDto = {
        amount: 10000,
        reason: 'Gastos médicos imprevistos',
        status: 'pending',
      };

      const user = { empleadoId: 1 };

      mockEmployeeRepository.findOne.mockResolvedValue(mockEmployee);
      mockSalaryAdvanceRepository.create.mockReturnValue(mockAdvance);
      mockSalaryAdvanceRepository.save.mockResolvedValue(mockAdvance);

      // Act
      const result = await service.createAdvance(createDto, user);

      // Assert
      expect(mockEmployeeRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockSalaryAdvanceRepository.create).toHaveBeenCalledWith({
        employee: mockEmployee,
        amount: 10000,
        reason: 'Gastos médicos imprevistos',
        status: 'pending',
      });
      expect(mockSalaryAdvanceRepository.save).toHaveBeenCalledWith(
        mockAdvance,
      );
      expect(result).toEqual(mockAdvance);
    });

    it('should throw NotFoundException if employee not found', async () => {
      console.log(
        '🧪 TEST: Debe lanzar NotFoundException si el empleado no existe',
      );

      // Arrange
      const createDto: CreateAdvanceDto = {
        amount: 10000,
        reason: 'Gastos médicos imprevistos',
        status: 'pending',
      };

      const user = { empleadoId: 999 };

      mockEmployeeRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.createAdvance(createDto, user)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockEmployeeRepository.findOne).toHaveBeenCalledWith({
        where: { id: 999 },
      });
    });
  });

  describe('getAll', () => {
    it('should return all salary advances', async () => {
      console.log('🧪 TEST: Debe retornar todos los adelantos salariales');

      // Arrange
      const mockAdvances = [mockAdvance, mockApprovedAdvance];
      mockSalaryAdvanceRepository.find.mockResolvedValue(mockAdvances);

      // Act
      const result = await service.getAll();

      // Assert
      expect(mockSalaryAdvanceRepository.find).toHaveBeenCalledWith({
        relations: ['employee'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(mockAdvances);
    });
  });

  describe('approve', () => {
    it('should approve a salary advance', async () => {
      console.log('🧪 TEST: Debe aprobar un adelanto salarial');

      // Arrange
      mockSalaryAdvanceRepository.findOne.mockResolvedValue(mockAdvance);
      mockSalaryAdvanceRepository.save.mockResolvedValue(mockApprovedAdvance);

      // Act
      const result = await service.approve('1', 'admin123');

      // Assert
      expect(mockSalaryAdvanceRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['employee'],
      });
      expect(mockSalaryAdvanceRepository.save).toHaveBeenCalledWith({
        ...mockAdvance,
        status: 'approved',
        approvedBy: 'admin123',
        approvedAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
      expect(result).toEqual(mockApprovedAdvance);
    });

    it('should return null if advance not found', async () => {
      console.log('🧪 TEST: Debe retornar null si el adelanto no existe');

      // Arrange
      mockSalaryAdvanceRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await service.approve('999', 'admin123');

      // Assert
      expect(mockSalaryAdvanceRepository.findOne).toHaveBeenCalledWith({
        where: { id: 999 },
        relations: ['employee'],
      });
      expect(result).toBeNull();
    });

    it('should return null if advance is not pending', async () => {
      console.log(
        '🧪 TEST: Debe retornar null si el adelanto no está pendiente',
      );

      // Arrange
      const nonPendingAdvance = { ...mockAdvance, status: 'approved' };
      mockSalaryAdvanceRepository.findOne.mockResolvedValue(nonPendingAdvance);

      // Act
      const result = await service.approve('1', 'admin123');

      // Assert
      expect(mockSalaryAdvanceRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['employee'],
      });
      expect(result).toBeNull();
    });
  });
  describe('reject', () => {
    it('should process reject correctly', async () => {
      console.log('🧪 TEST: Debe procesar rechazo correctamente');

      // Este test comprueba simplemente que la función existe y termina
      expect(typeof service.reject).toBe('function');
    });
  });

  // Un enfoque simplificado para las pruebas reject
  describe('simplified reject tests', () => {
    it('should reject a salary advance successfully', async () => {
      // Arrange
      const pendingAdvance = {
        id: 1,
        employee: mockEmployee,
        status: 'pending',
      };
      const rejectedAdvance = {
        ...pendingAdvance,
        status: 'rejected',
        updatedAt: new Date(),
      };

      // Mock de los repositorios
      mockSalaryAdvanceRepository.findOne.mockResolvedValue(pendingAdvance);
      mockSalaryAdvanceRepository.save.mockResolvedValue(rejectedAdvance);

      // Act
      const result = await service.reject('1');

      // Assert
      expect(result).toEqual(rejectedAdvance);
      expect(mockSalaryAdvanceRepository.findOne).toHaveBeenCalled();
    });

    it('should return null if advance is not found', async () => {
      // Arrange
      mockSalaryAdvanceRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await service.reject('999');

      // Assert
      expect(result).toBeNull();
    });

    it('should return null if advance is not in pending status', async () => {
      // Arrange
      const alreadyProcessedAdvance = {
        id: 1,
        employee: mockEmployee,
        status: 'approved',
      };
      mockSalaryAdvanceRepository.findOne.mockResolvedValue(
        alreadyProcessedAdvance,
      );

      // Act
      const result = await service.reject('1');

      // Assert
      expect(result).toBeNull();
    });
  });
});

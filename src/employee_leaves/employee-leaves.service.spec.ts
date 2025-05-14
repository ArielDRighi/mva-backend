import { Test, TestingModule } from '@nestjs/testing';
import { EmployeeLeavesService } from './employee-leaves.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EmployeesService } from '../employees/employees.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateEmployeeLeaveDto } from './dto/create-employee-leave.dto';
import { UpdateEmployeeLeaveDto } from './dto/update-employee-leave.dto';
import { LessThanOrEqual, MoreThanOrEqual, Not } from 'typeorm';
import { LeaveType } from './entities/employee-leave.entity';

// Mock manual para evitar problemas de importación
class EmployeeLeave {
  id: number;
  employeeId: number;
  employee: any;
  fechaInicio: Date;
  fechaFin: Date;
  tipoLicencia: LeaveType;
  notas: string;
  aprobado: boolean;
}

// Usamos el mock para importar la definición real del enum
jest.mock('./entities/employee-leave.entity', () => {
  const originalModule = jest.requireActual('./entities/employee-leave.entity');
  return {
    ...originalModule,
    EmployeeLeave: class EmployeeLeave {},
  };
});

describe('EmployeeLeavesService', () => {
  let service: EmployeeLeavesService;

  // Mock repository functions
  const mockLeaveRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
  };

  // Mock EmployeesService
  const mockEmployeesService = {
    findOne: jest.fn(),
    update: jest.fn(),
  };

  // Mock data
  const mockEmployee = {
    id: 1,
    nombre: 'Juan',
    apellido: 'Pérez',
    documento: '12345678',
    cargo: 'Conductor',
    diasVacacionesTotal: 15,
    diasVacacionesRestantes: 15,
    diasVacacionesUsados: 0,
  };

  const mockLeave = {
    id: 1,
    employeeId: 1,
    employee: mockEmployee,
    fechaInicio: new Date('2025-05-15'),
    fechaFin: new Date('2025-05-30'),
    tipoLicencia: LeaveType.VACACIONES,
    notas: 'Vacaciones anuales programadas',
    aprobado: false,
  };

  const mockLeavesList = [
    mockLeave,
    {
      ...mockLeave,
      id: 2,
      tipoLicencia: LeaveType.ENFERMEDAD,
      fechaInicio: new Date('2025-06-10'),
      fechaFin: new Date('2025-06-15'),
      notas: 'Licencia por enfermedad',
    },
  ];

  beforeEach(async () => {
    console.log(
      '======== PREPARANDO TESTS DE EMPLOYEE LEAVES SERVICE ========',
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeLeavesService,
        {
          provide: getRepositoryToken(EmployeeLeave),
          useValue: mockLeaveRepository,
        },
        {
          provide: EmployeesService,
          useValue: mockEmployeesService,
        },
      ],
    }).compile();

    service = module.get<EmployeeLeavesService>(EmployeeLeavesService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    console.log('🧪 TEST: El servicio de licencias debería estar definido');
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and return a new employee leave', async () => {
      console.log('🧪 TEST: Debe crear y retornar una nueva licencia');
      // Arrange
      const createDto: CreateEmployeeLeaveDto = {
        employeeId: 1,
        fechaInicio: new Date('2025-05-15'),
        fechaFin: new Date('2025-05-30'),
        tipoLicencia: LeaveType.VACACIONES,
        notas: 'Vacaciones anuales programadas',
      };

      mockEmployeesService.findOne.mockResolvedValue(mockEmployee);
      mockLeaveRepository.findOne.mockResolvedValue(null); // No hay solapamiento
      mockLeaveRepository.create.mockReturnValue(mockLeave);
      mockLeaveRepository.save.mockResolvedValue(mockLeave);

      // Act
      const result = await service.create(createDto);

      // Assert
      expect(mockEmployeesService.findOne).toHaveBeenCalledWith(1);
      expect(mockLeaveRepository.findOne).toHaveBeenCalledWith({
        where: [
          {
            employeeId: 1,
            fechaInicio: LessThanOrEqual(new Date('2025-05-30')),
            fechaFin: MoreThanOrEqual(new Date('2025-05-15')),
          },
        ],
      });
      expect(mockLeaveRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          employeeId: 1,
          fechaInicio: new Date('2025-05-15'),
          fechaFin: new Date('2025-05-30'),
          tipoLicencia: LeaveType.VACACIONES,
        }),
      );
      expect(mockLeaveRepository.save).toHaveBeenCalledWith(mockLeave);
      expect(result).toEqual(mockLeave);
    });

    it('should throw NotFoundException if employee is not found', async () => {
      console.log(
        '🧪 TEST: Debe lanzar NotFoundException si el empleado no se encuentra',
      );
      // Arrange
      const createDto: CreateEmployeeLeaveDto = {
        employeeId: 999,
        fechaInicio: new Date('2025-05-15'),
        fechaFin: new Date('2025-05-30'),
        tipoLicencia: LeaveType.VACACIONES,
        notas: 'Vacaciones anuales programadas',
      };

      mockEmployeesService.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.create(createDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockEmployeesService.findOne).toHaveBeenCalledWith(999);
    });

    it('should throw BadRequestException if fechaFin is before fechaInicio', async () => {
      console.log(
        '🧪 TEST: Debe lanzar BadRequestException si fechaFin es anterior a fechaInicio',
      );
      // Arrange
      const createDto: CreateEmployeeLeaveDto = {
        employeeId: 1,
        fechaInicio: new Date('2025-05-30'),
        fechaFin: new Date('2025-05-15'), // Fecha anterior a la de inicio
        tipoLicencia: LeaveType.VACACIONES,
        notas: 'Vacaciones anuales programadas',
      };

      mockEmployeesService.findOne.mockResolvedValue(mockEmployee);

      // Act & Assert
      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockEmployeesService.findOne).toHaveBeenCalledWith(1);
    });

    it('should throw BadRequestException if there is overlap with another leave', async () => {
      console.log(
        '🧪 TEST: Debe lanzar BadRequestException si hay solapamiento con otra licencia',
      );
      // Arrange
      const createDto: CreateEmployeeLeaveDto = {
        employeeId: 1,
        fechaInicio: new Date('2025-05-15'),
        fechaFin: new Date('2025-05-30'),
        tipoLicencia: LeaveType.VACACIONES,
        notas: 'Vacaciones anuales programadas',
      };

      mockEmployeesService.findOne.mockResolvedValue(mockEmployee);
      mockLeaveRepository.findOne.mockResolvedValue(mockLeave); // Ya existe una licencia solapada

      // Act & Assert
      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockEmployeesService.findOne).toHaveBeenCalledWith(1);
      expect(mockLeaveRepository.findOne).toHaveBeenCalledWith({
        where: [
          {
            employeeId: 1,
            fechaInicio: LessThanOrEqual(new Date('2025-05-30')),
            fechaFin: MoreThanOrEqual(new Date('2025-05-15')),
          },
        ],
      });
    });
  });

  describe('findAll', () => {
    it('should return all employee leaves', async () => {
      console.log('🧪 TEST: Debe retornar todas las licencias');
      // Arrange
      mockLeaveRepository.find.mockResolvedValue(mockLeavesList);

      // Act
      const result = await service.findAll();

      // Assert
      expect(mockLeaveRepository.find).toHaveBeenCalledWith({
        relations: ['employee'],
        order: { fechaInicio: 'ASC' },
      });
      expect(result).toEqual(mockLeavesList);
    });
  });

  describe('findOne', () => {
    it('should return a leave by id', async () => {
      console.log('🧪 TEST: Debe retornar una licencia por ID');
      // Arrange
      mockLeaveRepository.findOne.mockResolvedValue(mockLeave);

      // Act
      const result = await service.findOne(1);

      // Assert
      expect(mockLeaveRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['employee'],
      });
      expect(result).toEqual(mockLeave);
    });

    it('should throw NotFoundException if leave is not found', async () => {
      console.log(
        '🧪 TEST: Debe lanzar NotFoundException si la licencia no se encuentra',
      );
      // Arrange
      mockLeaveRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      expect(mockLeaveRepository.findOne).toHaveBeenCalledWith({
        where: { id: 999 },
        relations: ['employee'],
      });
    });
  });

  describe('findByEmployee', () => {
    it('should return leaves for a specific employee', async () => {
      console.log(
        '🧪 TEST: Debe retornar licencias para un empleado específico',
      );
      // Arrange
      mockEmployeesService.findOne.mockResolvedValue(mockEmployee);
      mockLeaveRepository.find.mockResolvedValue(mockLeavesList);

      // Act
      const result = await service.findByEmployee(1);

      // Assert
      expect(mockEmployeesService.findOne).toHaveBeenCalledWith(1);
      expect(mockLeaveRepository.find).toHaveBeenCalledWith({
        where: { employeeId: 1 },
        relations: ['employee'],
        order: { fechaInicio: 'ASC' },
      });
      expect(result).toEqual(mockLeavesList);
    });

    it('should throw NotFoundException if employee is not found', async () => {
      console.log(
        '🧪 TEST: Debe lanzar NotFoundException si el empleado no se encuentra',
      );
      // Arrange
      mockEmployeesService.findOne.mockRejectedValue(
        new NotFoundException('Empleado no encontrado'),
      );

      // Act & Assert
      await expect(service.findByEmployee(999)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockEmployeesService.findOne).toHaveBeenCalledWith(999);
    });
  });

  describe('update', () => {
    it('should update and return a modified leave', async () => {
      console.log(
        '🧪 TEST: Debe actualizar y retornar una licencia modificada',
      );
      // Arrange
      const updateDto: UpdateEmployeeLeaveDto = {
        notas: 'Notas actualizadas',
      };

      const updatedLeave = {
        ...mockLeave,
        notas: 'Notas actualizadas',
      };

      mockLeaveRepository.findOne.mockResolvedValue(mockLeave);
      mockLeaveRepository.save.mockResolvedValue(updatedLeave);

      // Act
      const result = await service.update(1, updateDto);

      // Assert
      expect(mockLeaveRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['employee'],
      });
      expect(mockLeaveRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockLeave,
          notas: 'Notas actualizadas',
        }),
      );
      expect(result).toEqual(updatedLeave);
    });

    it('should throw NotFoundException if leave is not found', async () => {
      console.log(
        '🧪 TEST: Debe lanzar NotFoundException si la licencia no se encuentra',
      );
      // Arrange
      const updateDto: UpdateEmployeeLeaveDto = {
        notas: 'Notas actualizadas',
      };

      mockLeaveRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.update(999, updateDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockLeaveRepository.findOne).toHaveBeenCalledWith({
        where: { id: 999 },
        relations: ['employee'],
      });
    });

    it('should validate dates when updating', async () => {
      console.log('🧪 TEST: Debe validar las fechas al actualizar');
      // Arrange
      const updateDto: UpdateEmployeeLeaveDto = {
        fechaInicio: new Date('2025-05-30'),
        fechaFin: new Date('2025-05-15'), // Fecha inválida (anterior a inicio)
      };

      mockLeaveRepository.findOne.mockResolvedValue(mockLeave);
      mockEmployeesService.findOne.mockResolvedValue(mockEmployee);

      // Act & Assert
      await expect(service.update(1, updateDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockLeaveRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['employee'],
      });
    });
  });

  describe('remove', () => {
    it('should delete a leave and return success message', async () => {
      console.log(
        '🧪 TEST: Debe eliminar una licencia y retornar un mensaje de éxito',
      );
      // Arrange
      mockLeaveRepository.findOne.mockResolvedValue(mockLeave);
      mockLeaveRepository.remove.mockResolvedValue({});

      // Act
      const result = await service.remove(1);

      // Assert
      expect(mockLeaveRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['employee'],
      });
      expect(mockLeaveRepository.remove).toHaveBeenCalledWith(mockLeave);
      expect(result).toEqual({
        message: 'Licencia #1 eliminada correctamente',
      });
    });

    it('should throw NotFoundException if leave is not found', async () => {
      console.log(
        '🧪 TEST: Debe lanzar NotFoundException si la licencia no se encuentra',
      );
      // Arrange
      mockLeaveRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
      expect(mockLeaveRepository.findOne).toHaveBeenCalledWith({
        where: { id: 999 },
        relations: ['employee'],
      });
    });
  });

  describe('isEmployeeAvailable', () => {
    it('should return true if employee has no leave on the date', async () => {
      console.log(
        '🧪 TEST: Debe retornar true si el empleado no tiene licencia en la fecha',
      );
      // Arrange
      const date = new Date('2025-07-15');
      mockLeaveRepository.count.mockResolvedValue(0);

      // Act
      const result = await service.isEmployeeAvailable(1, date);

      // Assert
      expect(mockLeaveRepository.count).toHaveBeenCalledWith({
        where: {
          employeeId: 1,
          fechaInicio: LessThanOrEqual(expect.any(Date)),
          fechaFin: MoreThanOrEqual(expect.any(Date)),
          aprobado: true,
        },
      });
      expect(result).toBe(true);
    });

    it('should return false if employee has leave on the date', async () => {
      console.log(
        '🧪 TEST: Debe retornar false si el empleado tiene licencia en la fecha',
      );
      // Arrange
      const date = new Date('2025-05-20'); // Dentro del período de licencia
      mockLeaveRepository.count.mockResolvedValue(1);

      // Act
      const result = await service.isEmployeeAvailable(1, date);

      // Assert
      expect(mockLeaveRepository.count).toHaveBeenCalledWith({
        where: {
          employeeId: 1,
          fechaInicio: LessThanOrEqual(expect.any(Date)),
          fechaFin: MoreThanOrEqual(expect.any(Date)),
          aprobado: true,
        },
      });
      expect(result).toBe(false);
    });
  });

  describe('getActiveLeaves', () => {
    it('should return active leaves for a specific date', async () => {
      console.log(
        '🧪 TEST: Debe retornar licencias activas para una fecha específica',
      );
      // Arrange
      const date = new Date('2025-05-20');
      mockLeaveRepository.find.mockResolvedValue([mockLeave]);

      // Act
      const result = await service.getActiveLeaves(date);

      // Assert
      expect(mockLeaveRepository.find).toHaveBeenCalledWith({
        where: {
          fechaInicio: LessThanOrEqual(expect.any(Date)),
          fechaFin: MoreThanOrEqual(expect.any(Date)),
          aprobado: true,
        },
        relations: ['employee'],
      });
      expect(result).toEqual([mockLeave]);
    });
  });

  describe('approve', () => {
    it('should approve a leave and update employee vacation days', async () => {
      console.log(
        '🧪 TEST: Debe aprobar una licencia y actualizar los días de vacaciones del empleado',
      );
      // Arrange
      const unapprovedLeave = { ...mockLeave, aprobado: false };
      const approvedLeave = { ...mockLeave, aprobado: true };

      mockLeaveRepository.findOne
        .mockResolvedValueOnce(unapprovedLeave)
        .mockResolvedValueOnce(approvedLeave);
      mockEmployeesService.findOne.mockResolvedValue(mockEmployee);
      mockLeaveRepository.save.mockResolvedValue(approvedLeave);

      // Act
      const result = await service.approve(1);

      // Assert
      expect(mockLeaveRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['employee'],
      });
      expect(mockEmployeesService.findOne).toHaveBeenCalledWith(1);
      expect(mockEmployeesService.update).toHaveBeenCalledWith(1, {
        diasVacacionesRestantes: 0, // 15 - 15 = 0
        diasVacacionesUsados: 15, // 0 + 15 = 15
      });
      expect(mockLeaveRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          ...unapprovedLeave,
          aprobado: true,
        }),
      );
      expect(result).toEqual(approvedLeave);
    });

    it('should throw BadRequestException if leave is already approved', async () => {
      console.log(
        '🧪 TEST: Debe lanzar BadRequestException si la licencia ya está aprobada',
      );
      // Arrange
      const alreadyApprovedLeave = { ...mockLeave, aprobado: true };
      mockLeaveRepository.findOne.mockResolvedValue(alreadyApprovedLeave);

      // Act & Assert
      await expect(service.approve(1)).rejects.toThrow(BadRequestException);
      expect(mockLeaveRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['employee'],
      });
    });

    it('should throw BadRequestException if employee has insufficient vacation days', async () => {
      console.log(
        '🧪 TEST: Debe lanzar BadRequestException si el empleado no tiene suficientes días de vacaciones',
      );
      // Arrange
      const unapprovedLeave = {
        ...mockLeave,
        fechaInicio: new Date('2025-05-01'),
        fechaFin: new Date('2025-06-30'), // 61 días de licencia, más de los disponibles
        aprobado: false,
      };

      mockLeaveRepository.findOne.mockResolvedValue(unapprovedLeave);
      mockEmployeesService.findOne.mockResolvedValue(mockEmployee); // Solo tiene 15 días disponibles

      // Act & Assert
      await expect(service.approve(1)).rejects.toThrow(BadRequestException);
      expect(mockLeaveRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['employee'],
      });
      expect(mockEmployeesService.findOne).toHaveBeenCalledWith(1);
    });
  });
});

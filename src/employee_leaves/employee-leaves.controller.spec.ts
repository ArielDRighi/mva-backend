import { Test, TestingModule } from '@nestjs/testing';
import { EmployeeLeavesController } from './employee-leaves.controller';
import { EmployeeLeavesService } from './employee-leaves.service';
import { LeaveType } from './entities/employee-leave.entity';

// Mock manual de tipos para evitar problemas de importación
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

// Jest mock para la entidad
jest.mock('./entities/employee-leave.entity', () => {
  // Importamos la implementación real del enum para mantener la consistencia
  const originalModule = jest.requireActual('./entities/employee-leave.entity');
  return {
    ...originalModule,
    EmployeeLeave: class EmployeeLeave {},
  };
});

describe('EmployeeLeavesController', () => {
  let controller: EmployeeLeavesController;

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

  // Mock service
  const mockEmployeeLeavesService = {
    create: jest.fn().mockResolvedValue(mockLeave),
    findAll: jest.fn().mockResolvedValue(mockLeavesList),
    findOne: jest.fn().mockResolvedValue(mockLeave),
    findByEmployee: jest.fn().mockResolvedValue(mockLeavesList),
    update: jest.fn().mockImplementation((id, dto) =>
      Promise.resolve({
        ...mockLeave,
        ...dto,
      }),
    ),
    approve: jest.fn().mockResolvedValue({ ...mockLeave, aprobado: true }),
    remove: jest
      .fn()
      .mockResolvedValue({ message: 'Licencia #1 eliminada correctamente' }),
  };

  beforeEach(async () => {
    console.log(
      '======== PREPARANDO TESTS DE EMPLOYEE LEAVES CONTROLLER ========',
    );

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmployeeLeavesController],
      providers: [
        {
          provide: EmployeeLeavesService,
          useValue: mockEmployeeLeavesService,
        },
      ],
    }).compile();

    controller = module.get<EmployeeLeavesController>(EmployeeLeavesController);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    console.log('🧪 TEST: El controlador de licencias debería estar definido');
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new employee leave', async () => {
      console.log('🧪 TEST: Debe crear una nueva licencia');
      // Arrange
      const createDto = {
        employeeId: 1,
        fechaInicio: new Date('2025-05-15'),
        fechaFin: new Date('2025-05-30'),
        tipoLicencia: LeaveType.VACACIONES,
        notas: 'Vacaciones anuales programadas',
      };

      // Act
      const result = await controller.create(createDto);

      // Assert
      expect(mockEmployeeLeavesService.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockLeave);
    });
  });

  describe('findAll', () => {
    it('should return all employee leaves', async () => {
      console.log('🧪 TEST: Debe retornar todas las licencias');
      // Act
      const result = await controller.findAll();

      // Assert
      expect(mockEmployeeLeavesService.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockLeavesList);
    });
  });

  describe('findOne', () => {
    it('should return a leave by id', async () => {
      console.log('🧪 TEST: Debe retornar una licencia por ID');
      // Act
      const result = await controller.findOne('1');

      // Assert
      expect(mockEmployeeLeavesService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockLeave);
    });
  });

  describe('findByEmployee', () => {
    it('should return leaves for a specific employee', async () => {
      console.log(
        '🧪 TEST: Debe retornar licencias para un empleado específico',
      );
      // Act
      const result = await controller.findByEmployee('1');

      // Assert
      expect(mockEmployeeLeavesService.findByEmployee).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockLeavesList);
    });
  });

  describe('update', () => {
    it('should update a leave', async () => {
      console.log('🧪 TEST: Debe actualizar una licencia');
      // Arrange
      const updateDto = {
        notas: 'Notas actualizadas',
      };

      // Act
      const result = await controller.update('1', updateDto);

      // Assert
      expect(mockEmployeeLeavesService.update).toHaveBeenCalledWith(
        1,
        updateDto,
      );
      expect(result).toEqual({
        ...mockLeave,
        notas: 'Notas actualizadas',
      });
    });
  });

  describe('approve', () => {
    it('should approve a leave', async () => {
      console.log('🧪 TEST: Debe aprobar una licencia');
      // Act
      const result = await controller.approve(1);

      // Assert
      expect(mockEmployeeLeavesService.approve).toHaveBeenCalledWith(1);
      expect(result).toEqual({
        ...mockLeave,
        aprobado: true,
      });
    });
  });

  describe('remove', () => {
    it('should delete a leave', async () => {
      console.log('🧪 TEST: Debe eliminar una licencia');
      // Act
      const result = await controller.remove('1');

      // Assert
      expect(mockEmployeeLeavesService.remove).toHaveBeenCalledWith(1);
      expect(result).toEqual({
        message: 'Licencia #1 eliminada correctamente',
      });
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EmployeeLeaveSchedulerService } from './employee-leave-scheduler.service';
import { EmployeeLeave } from '../../employee_leaves/entities/employee-leave.entity';
import { EmployeesService } from '../../employees/employees.service';
import { Logger } from '@nestjs/common';

describe('EmployeeLeaveSchedulerService', () => {
  let service: EmployeeLeaveSchedulerService;
  let leaveRepositoryMock: any;
  let employeesServiceMock: any;

  // Preparar datos de prueba
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const mockStartingLeave = {
    id: 1,
    employeeId: 101,
    tipoLicencia: 'VACACIONES',
    fechaInicio: today,
    fechaFin: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000), // Una semana después
    aprobado: true,
    employee: {
      id: 101,
      nombre: 'Juan',
      apellido: 'Pérez',
      estado: 'DISPONIBLE',
    },
  };

  const mockEndingLeave = {
    id: 2,
    employeeId: 102,
    tipoLicencia: 'VACACIONES',
    fechaInicio: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000), // Una semana antes
    fechaFin: today,
    aprobado: true,
    employee: {
      id: 102,
      nombre: 'María',
      apellido: 'González',
      estado: 'NO_DISPONIBLE',
    },
  };

  const mockEndingLeaveWithNextLeave = {
    id: 3,
    employeeId: 103,
    tipoLicencia: 'ENFERMEDAD',
    fechaInicio: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000), // Tres días antes
    fechaFin: today,
    aprobado: true,
    employee: {
      id: 103,
      nombre: 'Carlos',
      apellido: 'Rodríguez',
      estado: 'NO_DISPONIBLE',
    },
  };

  const mockNextLeaveForEmployee103 = {
    id: 4,
    employeeId: 103,
    tipoLicencia: 'VACACIONES',
    fechaInicio: today,
    fechaFin: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000), // Cinco días después
    aprobado: true,
  };

  beforeEach(async () => {
    // Mocks para repositorio y servicio
    leaveRepositoryMock = {
      find: jest.fn(),
      findOne: jest.fn(),
    };

    employeesServiceMock = {
      changeStatus: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeLeaveSchedulerService,
        {
          provide: getRepositoryToken(EmployeeLeave),
          useValue: leaveRepositoryMock,
        },
        {
          provide: EmployeesService,
          useValue: employeesServiceMock,
        },
      ],
    }).compile();

    service = module.get<EmployeeLeaveSchedulerService>(
      EmployeeLeaveSchedulerService,
    );

    // Espiar el logger
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleScheduledLeaves', () => {
    it('should update employee status for starting leaves', async () => {
      // Configurar mocks
      leaveRepositoryMock.find.mockImplementation((query) => {
        if (query.where.fechaInicio) {
          return [mockStartingLeave]; // Empleado comienza licencia hoy
        } else if (query.where.fechaFin) {
          return []; // Ningún empleado termina licencia hoy
        }
        return [];
      });

      // Ejecutar el método
      await service.handleScheduledLeaves();

      // Verificar que se llamó a changeStatus para el empleado que comienza licencia
      expect(employeesServiceMock.changeStatus).toHaveBeenCalledWith(
        101,
        'NO_DISPONIBLE',
      );
      expect(employeesServiceMock.changeStatus).toHaveBeenCalledTimes(1);
    });

    it('should update employee status for ending leaves with no consecutive leave', async () => {
      // Configurar mocks
      leaveRepositoryMock.find.mockImplementation((query) => {
        if (query.where.fechaInicio) {
          return []; // Ningún empleado comienza licencia hoy
        } else if (query.where.fechaFin) {
          return [mockEndingLeave]; // Empleado termina licencia hoy
        }
        return [];
      });

      // No hay licencia siguiente
      leaveRepositoryMock.findOne.mockResolvedValue(null);

      // Ejecutar el método
      await service.handleScheduledLeaves();

      // Verificar que se llamó a changeStatus para el empleado que termina licencia
      expect(employeesServiceMock.changeStatus).toHaveBeenCalledWith(
        102,
        'DISPONIBLE',
      );
      expect(employeesServiceMock.changeStatus).toHaveBeenCalledTimes(1);
    });

    it('should not update status if employee has consecutive leave', async () => {
      // Configurar mocks
      leaveRepositoryMock.find.mockImplementation((query) => {
        if (query.where.fechaInicio) {
          return []; // Ningún empleado comienza licencia hoy
        } else if (query.where.fechaFin) {
          return [mockEndingLeaveWithNextLeave]; // Empleado termina licencia hoy
        }
        return [];
      });

      // Tiene una licencia siguiente que comienza hoy
      leaveRepositoryMock.findOne.mockResolvedValue(
        mockNextLeaveForEmployee103,
      );

      // Ejecutar el método
      await service.handleScheduledLeaves();

      // No debería llamar a changeStatus para este empleado
      expect(employeesServiceMock.changeStatus).not.toHaveBeenCalledWith(
        103,
        'DISPONIBLE',
      );
      expect(employeesServiceMock.changeStatus).toHaveBeenCalledTimes(0);
    });

    it('should handle both starting and ending leaves in same day', async () => {
      // Configurar mocks para ambos casos
      leaveRepositoryMock.find.mockImplementation((query) => {
        if (query.where.fechaInicio) {
          return [mockStartingLeave]; // Empleado comienza licencia hoy
        } else if (query.where.fechaFin) {
          return [mockEndingLeave]; // Empleado termina licencia hoy
        }
        return [];
      });

      // No hay licencia siguiente
      leaveRepositoryMock.findOne.mockResolvedValue(null);

      // Ejecutar el método
      await service.handleScheduledLeaves();

      // Verificar que se llamó a changeStatus para ambos empleados
      expect(employeesServiceMock.changeStatus).toHaveBeenCalledWith(
        101,
        'NO_DISPONIBLE',
      );
      expect(employeesServiceMock.changeStatus).toHaveBeenCalledWith(
        102,
        'DISPONIBLE',
      );
      expect(employeesServiceMock.changeStatus).toHaveBeenCalledTimes(2);
    });
  });
});

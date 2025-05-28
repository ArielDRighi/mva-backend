// Mocks para PaginationDto y Pagination
jest.mock(
  'src/common/dto/pagination.dto',
  () => ({
    PaginationDto: class PaginationDto {
      page?: number;
      limit?: number;
      search?: string;
    },
  }),
  { virtual: true },
);

jest.mock(
  'src/common/interfaces/paginations.interface',
  () => ({
    Pagination: class Pagination {},
  }),
  { virtual: true },
);

// Mocks de todas las entidades que causan problemas en las pruebas
jest.mock(
  'src/salary_advance/entities/salary_advance.entity',
  () => ({
    SalaryAdvance: class SalaryAdvance {},
  }),
  { virtual: true },
);

jest.mock(
  'src/clothing/entities/clothing.entity',
  () => ({
    RopaTalles: class RopaTalles {},
  }),
  { virtual: true },
);

jest.mock(
  '../../employee_leaves/entities/employee-leave.entity',
  () => ({
    EmployeeLeave: class EmployeeLeave {},
  }),
  { virtual: true },
);

jest.mock(
  '../../users/entities/user.entity',
  () => ({
    User: class User {},
  }),
  { virtual: true },
);

jest.mock(
  '../../services/entities/service.entity',
  () => ({
    Service: class Service {},
  }),
  { virtual: true },
);

jest.mock(
  '../../services/entities/resource-assignment.entity',
  () => ({
    ResourceAssignment: class ResourceAssignment {},
  }),
  { virtual: true },
);

jest.mock(
  '../../toilet_maintenance/entities/toilet_maintenance.entity',
  () => ({
    ToiletMaintenance: class ToiletMaintenance {},
  }),
  { virtual: true },
);

// Mocks de roles
jest.mock(
  'src/roles/enums/role.enum',
  () => ({
    Role: {
      ADMIN: 'admin',
      SUPERVISOR: 'supervisor',
      OPERARIO: 'operario',
    },
  }),
  { virtual: true },
);

jest.mock(
  'src/roles/decorators/roles.decorator',
  () => ({
    Roles: () => jest.fn(),
  }),
  { virtual: true },
);

jest.mock(
  'src/roles/guards/roles.guard',
  () => ({
    RolesGuard: jest.fn().mockImplementation(() => ({
      canActivate: jest.fn().mockReturnValue(true),
    })),
  }),
  { virtual: true },
);

jest.mock(
  'src/auth/guards/jwt-auth.guard',
  () => ({
    JwtAuthGuard: jest.fn().mockImplementation(() => ({
      canActivate: jest.fn().mockReturnValue(true),
    })),
  }),
  { virtual: true },
);

// Mocks de las entidades del módulo employees
jest.mock('./entities/employee.entity', () => ({
  Empleado: class Empleado {
    id: number;
    nombre: string;
    apellido: string;
    documento: string;
    telefono: string;
    email: string;
    direccion: string;
    fecha_nacimiento: string;
    fecha_contratacion: string;
    cargo: string;
    estado: string;
    diasVacacionesDisponibles: number;
    diasVacacionesRestantes: number;
    diasVacacionesTotales: number;
    licencia: any;
    emergencyContacts: any[];
    examenesPreocupacionales: any[];
    talleRopa: any;
  },
}));

jest.mock('./entities/license.entity', () => ({
  Licencias: class Licencias {
    licencia_id: number;
    categoria: string;
    fecha_expedicion: string;
    fecha_vencimiento: string;
    empleado: any;
  },
}));

jest.mock('./entities/emergencyContacts.entity', () => ({
  ContactosEmergencia: class ContactosEmergencia {
    id: number;
    nombre: string;
    apellido: string;
    parentesco: string;
    telefono: string;
    empleado: any;
  },
}));

jest.mock('./entities/examenPreocupacional.entity', () => ({
  ExamenPreocupacional: class ExamenPreocupacional {
    examen_preocupacional_id: number;
    fecha_examen: string;
    resultado: string;
    observaciones: string;
    realizado_por: string;
    empleado: any;
  },
}));

import { Test, TestingModule } from '@nestjs/testing';
import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './__mocks__/dto/create_employee.dto';
import { UpdateEmployeeDto } from './dto/update_employee.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { CreateLicenseDto } from './__mocks__/dto/create_license.dto';
import { UpdateLicenseDto } from './__mocks__/dto/update_license.dto';
import { CreateContactEmergencyDto } from './__mocks__/dto/create_contact_emergency.dto';
import { UpdateContactEmergencyDto } from './dto/update_contact_emergency.dto';
import { CreateExamenPreocupacionalDto } from './__mocks__/dto/create_examen.dto';
import { UpdateExamenPreocupacionalDto } from './dto/modify_examen.dto';

describe('EmployeesController', () => {
  let controller: EmployeesController;

  const mockEmployeesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByDocumento: jest.fn(),
    update: jest.fn(),
    changeStatus: jest.fn(),
    remove: jest.fn(),
    createLicencia: jest.fn(),
    updateLicencia: jest.fn(),
    removeLicencia: jest.fn(),
    createEmergencyContact: jest.fn(),
    updateEmergencyContact: jest.fn(),
    removeEmergencyContact: jest.fn(),
    createExamenPreocupacional: jest.fn(),
    updateExamenPreocupacional: jest.fn(),
    removeExamenPreocupacional: jest.fn(),
    findExamenesByEmpleadoId: jest.fn(),
    findLicenciasByEmpleadoId: jest.fn(),
    findLicensesToExpire: jest.fn(),
    findLicencias: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmployeesController],
      providers: [
        {
          provide: EmployeesService,
          useValue: mockEmployeesService,
        },
      ],
    }).compile();

    controller = module.get<EmployeesController>(EmployeesController);
    service = module.get<EmployeesService>(EmployeesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
  describe('create', () => {
    const createEmployeeDto: CreateEmployeeDto = {
      nombre: 'Juan',
      apellido: 'Pérez',
      documento: '12345678',
      telefono: '123456789',
      email: 'juan.perez@example.com',
      direccion: 'Calle Principal 123',
      fecha_nacimiento: '1990-01-01',
      fecha_contratacion: '2023-01-01',
      cargo: 'Conductor',
      estado: 'DISPONIBLE',
      numero_legajo: 123,
      cuil: '20123456789',
      cbu: '1234567890123456789012',
      diasVacacionesDisponibles: 15,
      diasVacacionesRestantes: 15,
      diasVacacionesTotales: 15,
    };

    const mockEmployee = {
      id: 1,
      ...createEmployeeDto,
    };

    it('should create an employee successfully', async () => {
      mockEmployeesService.create.mockResolvedValue(mockEmployee);

      const result = await controller.create(createEmployeeDto);

      expect(result).toEqual(mockEmployee);
      expect(mockEmployeesService.create).toHaveBeenCalledWith(
        createEmployeeDto,
      );
    });
  });

  describe('findAll', () => {
    const paginationDto: PaginationDto = {
      page: 1,
      limit: 10,
      search: '',
    };

    const mockPaginatedEmployees = {
      data: [
        {
          id: 1,
          nombre: 'Juan',
          apellido: 'Pérez',
          documento: '12345678',
        },
        {
          id: 2,
          nombre: 'María',
          apellido: 'Gómez',
          documento: '87654321',
        },
      ],
      totalItems: 2,
      currentPage: 1,
      totalPages: 1,
    };

    it('should return paginated employees', async () => {
      mockEmployeesService.findAll.mockResolvedValue(mockPaginatedEmployees);

      const result = await controller.findAll(paginationDto);

      expect(result).toEqual(mockPaginatedEmployees);
      expect(mockEmployeesService.findAll).toHaveBeenCalledWith(paginationDto);
    });
  });

  describe('findOne', () => {
    const mockEmployee = {
      id: 1,
      nombre: 'Juan',
      apellido: 'Pérez',
      documento: '12345678',
      telefono: '123456789',
      email: 'juan.perez@example.com',
    };

    it('should return an employee by id', async () => {
      mockEmployeesService.findOne.mockResolvedValue(mockEmployee);

      const result = await controller.findOne(1);

      expect(result).toEqual(mockEmployee);
      expect(mockEmployeesService.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('findByDocumento', () => {
    const mockEmployee = {
      id: 1,
      nombre: 'Juan',
      apellido: 'Pérez',
      documento: '12345678',
    };

    it('should return an employee by documento', async () => {
      mockEmployeesService.findByDocumento.mockResolvedValue(mockEmployee);

      const result = await controller.findByDocumento('12345678');

      expect(result).toEqual(mockEmployee);
      expect(mockEmployeesService.findByDocumento).toHaveBeenCalledWith(
        '12345678',
      );
    });
  });

  describe('update', () => {
    const updateEmployeeDto: UpdateEmployeeDto = {
      nombre: 'Juan Carlos',
      apellido: 'Pérez López',
    };

    const mockUpdatedEmployee = {
      id: 1,
      nombre: 'Juan Carlos',
      apellido: 'Pérez López',
      documento: '12345678',
      telefono: '123456789',
      email: 'juan.perez@example.com',
    };

    it('should update an employee successfully', async () => {
      mockEmployeesService.update.mockResolvedValue(mockUpdatedEmployee);

      const result = await controller.update(1, updateEmployeeDto);

      expect(result).toEqual(mockUpdatedEmployee);
      expect(mockEmployeesService.update).toHaveBeenCalledWith(
        1,
        updateEmployeeDto,
      );
    });
  });

  describe('changeStatus', () => {
    const mockUpdatedEmployee = {
      id: 1,
      nombre: 'Juan',
      apellido: 'Pérez',
      estado: 'LICENCIA',
    };

    it('should change employee status successfully', async () => {
      mockEmployeesService.changeStatus.mockResolvedValue(mockUpdatedEmployee);

      const result = await controller.changeStatus(1, 'LICENCIA');

      expect(result).toEqual(mockUpdatedEmployee);
      expect(mockEmployeesService.changeStatus).toHaveBeenCalledWith(
        1,
        'LICENCIA',
      );
    });
  });

  describe('remove', () => {
    const mockResponse = {
      message: 'Empleado Juan Pérez eliminado correctamente',
    };

    it('should remove an employee successfully', async () => {
      mockEmployeesService.remove.mockResolvedValue(mockResponse);

      const result = await controller.remove(1);

      expect(result).toEqual(mockResponse);
      expect(mockEmployeesService.remove).toHaveBeenCalledWith(1);
    });
  });

  describe('createLicencia', () => {
    const createLicenseDto: CreateLicenseDto = {
      categoria: 'B',
      fecha_expedicion: new Date('2022-01-15'),
      fecha_vencimiento: new Date('2027-01-15'),
      empleado_id: 1,
    };

    const mockLicense = {
      licencia_id: 1,
      ...createLicenseDto,
    };

    it('should create a license for an employee successfully', async () => {
      mockEmployeesService.createLicencia.mockResolvedValue(mockLicense);

      const result = await controller.createLicencia(createLicenseDto, 1);

      expect(result).toEqual(mockLicense);
      expect(mockEmployeesService.createLicencia).toHaveBeenCalledWith(
        createLicenseDto,
        1,
      );
    });
  });

  describe('updateLicencia', () => {
    const updateLicenseDto: UpdateLicenseDto = {
      categoria: 'A',
      fecha_vencimiento: new Date('2028-01-15'),
    };
    const mockUpdatedLicense = {
      licencia_id: 1,
      categoria: 'A',
      fecha_expedicion: new Date('2022-01-15'),
      fecha_vencimiento: new Date('2028-01-15'),
    };

    it('should update a license successfully', async () => {
      mockEmployeesService.updateLicencia.mockResolvedValue(mockUpdatedLicense);

      const result = await controller.updateLicencia(updateLicenseDto, 1);

      expect(result).toEqual(mockUpdatedLicense);
      expect(mockEmployeesService.updateLicencia).toHaveBeenCalledWith(
        1,
        updateLicenseDto,
      );
    });
  });

  describe('removeLicencia', () => {
    const mockResponse = {
      message: 'Licencia eliminada correctamente',
    };

    it('should remove a license successfully', async () => {
      mockEmployeesService.removeLicencia.mockResolvedValue(mockResponse);

      const result = await controller.removeLicencia(1);

      expect(result).toEqual(mockResponse);
      expect(mockEmployeesService.removeLicencia).toHaveBeenCalledWith(1);
    });
  });

  describe('createEmergencyContact', () => {
    const createContactEmergencyDto: CreateContactEmergencyDto = {
      nombre: 'María',
      apellido: 'Gómez',
      parentesco: 'Esposa',
      telefono: '123456789',
      empleado_id: 1,
    };

    const mockContact = {
      id: 1,
      ...createContactEmergencyDto,
    };

    it('should create an emergency contact successfully', async () => {
      mockEmployeesService.createEmergencyContact.mockResolvedValue(
        mockContact,
      );

      const result = await controller.createEmergencyContact(
        createContactEmergencyDto,
        1,
      );

      expect(result).toEqual(mockContact);
      expect(mockEmployeesService.createEmergencyContact).toHaveBeenCalledWith(
        createContactEmergencyDto,
        1,
      );
    });
  });

  describe('updateEmergencyContact', () => {
    const updateContactEmergencyDto: UpdateContactEmergencyDto = {
      telefono: '987654321',
    };

    const mockUpdatedContact = {
      id: 1,
      nombre: 'María',
      apellido: 'Gómez',
      parentesco: 'Esposa',
      telefono: '987654321',
    };

    it('should update an emergency contact successfully', async () => {
      mockEmployeesService.updateEmergencyContact.mockResolvedValue(
        mockUpdatedContact,
      );

      const result = await controller.updateEmergencyContact(
        updateContactEmergencyDto,
        1,
      );

      expect(result).toEqual(mockUpdatedContact);
      expect(mockEmployeesService.updateEmergencyContact).toHaveBeenCalledWith(
        1,
        updateContactEmergencyDto,
      );
    });
  });

  describe('removeEmergencyContact', () => {
    const mockResponse = {
      message: 'Contacto de emergencia eliminado correctamente',
    };

    it('should remove an emergency contact successfully', async () => {
      mockEmployeesService.removeEmergencyContact.mockResolvedValue(
        mockResponse,
      );

      const result = await controller.removeEmergencyContact(1);

      expect(result).toEqual(mockResponse);
      expect(mockEmployeesService.removeEmergencyContact).toHaveBeenCalledWith(
        1,
      );
    });
  });

  describe('createExamenPreocupacional', () => {
    const createExamenDto: CreateExamenPreocupacionalDto = {
      fecha_examen: new Date('2023-01-10'),
      resultado: 'APTO',
      observaciones: 'Excelente condición física',
      realizado_por: 'Dr. Martínez - Centro Médico San Juan',
      empleado_id: 1,
    };

    const mockExamen = {
      examen_preocupacional_id: 1,
      ...createExamenDto,
    };

    it('should create a pre-employment exam successfully', async () => {
      mockEmployeesService.createExamenPreocupacional.mockResolvedValue(
        mockExamen,
      );

      const result =
        await controller.createExamenPreocupacional(createExamenDto);

      expect(result).toEqual(mockExamen);
      expect(
        mockEmployeesService.createExamenPreocupacional,
      ).toHaveBeenCalledWith(createExamenDto);
    });
  });

  describe('updateExamenPreocupacional', () => {
    const updateExamenDto: UpdateExamenPreocupacionalDto = {
      resultado: 'APTO CON OBSERVACIONES',
      observaciones: 'Leve problema de visión',
    };
    const mockUpdatedExamen = {
      examen_preocupacional_id: 1,
      fecha_examen: new Date('2023-01-10'),
      resultado: 'APTO CON OBSERVACIONES',
      observaciones: 'Leve problema de visión',
      realizado_por: 'Dr. Martínez - Centro Médico San Juan',
    };

    it('should update a pre-employment exam successfully', async () => {
      mockEmployeesService.updateExamenPreocupacional.mockResolvedValue(
        mockUpdatedExamen,
      );

      const result = await controller.updateExamenPreocupacional(
        updateExamenDto,
        1,
      );

      expect(result).toEqual(mockUpdatedExamen);
      expect(
        mockEmployeesService.updateExamenPreocupacional,
      ).toHaveBeenCalledWith(1, updateExamenDto);
    });
  });

  describe('removeExamenPreocupacional', () => {
    const mockResponse = {
      message: 'Examen preocupacional eliminado correctamente',
    };

    it('should remove a pre-employment exam successfully', async () => {
      mockEmployeesService.removeExamenPreocupacional.mockResolvedValue(
        mockResponse,
      );

      const result = await controller.removeExamenPreocupacional(1);

      expect(result).toEqual(mockResponse);
      expect(
        mockEmployeesService.removeExamenPreocupacional,
      ).toHaveBeenCalledWith(1);
    });
  });

  describe('findExamenesByEmpleadoId', () => {
    const mockExamenes = [
      {
        examen_preocupacional_id: 1,
        fecha_examen: new Date('2023-01-10'),
        resultado: 'APTO',
        observaciones: 'Excelente condición física',
        realizado_por: 'Dr. Martínez - Centro Médico San Juan',
      },
    ];

    it('should return examenes by employee id', async () => {
      mockEmployeesService.findExamenesByEmpleadoId.mockResolvedValue(
        mockExamenes,
      );

      const result = await controller.findExamenesByEmpleadoId(1);

      expect(result).toEqual(mockExamenes);
      expect(
        mockEmployeesService.findExamenesByEmpleadoId,
      ).toHaveBeenCalledWith(1);
    });
  });

  describe('findLicenciasByEmpleadoId', () => {
    const mockLicense = {
      licencia_id: 1,
      categoria: 'B',
      fecha_expedicion: new Date('2022-01-15'),
      fecha_vencimiento: new Date('2027-01-15'),
    };

    it('should return license by employee id', async () => {
      mockEmployeesService.findLicenciasByEmpleadoId.mockResolvedValue(
        mockLicense,
      );

      const result = await controller.findLicenciasByEmpleadoId(1);

      expect(result).toEqual(mockLicense);
      expect(
        mockEmployeesService.findLicenciasByEmpleadoId,
      ).toHaveBeenCalledWith(1);
    });
  });

  describe('findLicensesToExpire', () => {
    const mockPaginatedLicenses = {
      data: [
        {
          licencia_id: 1,
          categoria: 'B',
          fecha_expedicion: new Date('2022-01-15'),
          fecha_vencimiento: new Date('2023-06-01'),
          empleado: {
            id: 1,
            nombre: 'Juan',
            apellido: 'Pérez',
            documento: '12345678',
          },
        },
      ],
      totalItems: 1,
      currentPage: 1,
      totalPages: 1,
    };

    it('should return licenses about to expire with pagination and custom days', async () => {
      mockEmployeesService.findLicensesToExpire.mockResolvedValue(
        mockPaginatedLicenses,
      );

      const result = await controller.findLicensesToExpire(60, 1, 10);

      expect(result).toEqual(mockPaginatedLicenses);
      expect(mockEmployeesService.findLicensesToExpire).toHaveBeenCalledWith(
        60,
        1,
        10,
      );
    });
  });

  describe('findLicencias', () => {
    const mockPaginatedLicencias = {
      data: [
        {
          licencia_id: 1,
          categoria: 'B',
          fecha_expedicion: new Date('2022-01-15'),
          fecha_vencimiento: new Date('2023-06-01'),
          empleado: {
            id: 1,
            nombre: 'Juan',
            apellido: 'Pérez',
            documento: '12345678',
          },
        },
      ],
      totalItems: 1,
      currentPage: 1,
      totalPages: 1,
    };

    it('should return all licenses with pagination', async () => {
      mockEmployeesService.findLicencias.mockResolvedValue(
        mockPaginatedLicencias,
      );

      const result = await controller.findLicencias(0, 1, 10);

      expect(result).toEqual(mockPaginatedLicencias);
      expect(mockEmployeesService.findLicencias).toHaveBeenCalledWith(0, 1, 10);
    });

    it('should return licenses filtered by days parameter', async () => {
      mockEmployeesService.findLicencias.mockResolvedValue(
        mockPaginatedLicencias,
      );

      const result = await controller.findLicencias(30, 1, 10);

      expect(result).toEqual(mockPaginatedLicencias);
      expect(mockEmployeesService.findLicencias).toHaveBeenCalledWith(
        30,
        1,
        10,
      );
    });
  });
});

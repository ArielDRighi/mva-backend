// filepath: d:\Personal\mva-backend\src\clients\clients.controller.spec.ts
// Mocks adicionales para resolver problemas de módulos
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
  '../../employees/entities/employee.entity',
  () => ({
    Empleado: class Empleado {},
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

// Mocks de las entidades para no importarlas directamente
jest.mock('./entities/client.entity', () => ({
  Cliente: class Cliente {
    clienteId: number;
    nombre: string;
    email: string;
    cuit: string;
    direccion: string;
    telefono: string;
    contacto_principal: string;
    contacto_principal_telefono: string;
    estado: string;
    fecha_registro: Date;
    contratos: any[];
    servicios: any[];
    futurasLimpiezas: any[];
  },
}));

jest.mock(
  '../contractual_conditions/entities/contractual_conditions.entity',
  () => {
    class MockCliente {
      clienteId: number;
      nombre: string;
    }

    enum TipoContrato {
      TEMPORAL = 'Temporal',
      PERMANENTE = 'Permanente',
    }

    enum Periodicidad {
      DIARIA = 'Diaria',
      SEMANAL = 'Semanal',
      MENSUAL = 'Mensual',
      ANUAL = 'Anual',
    }

    enum EstadoContrato {
      ACTIVO = 'Activo',
      INACTIVO = 'Inactivo',
      TERMINADO = 'Terminado',
    }

    return {
      CondicionesContractuales: class CondicionesContractuales {
        condicionContractualId: number;
        cliente: MockCliente;
        tipo_de_contrato: TipoContrato;
        fecha_inicio: Date;
        fecha_fin: Date;
        condiciones_especificas: string;
        tarifa: number;
        tarifa_alquiler?: number;
        tarifa_instalacion?: number;
        tarifa_limpieza?: number;
        tipo_servicio?: string;
        cantidad_banos?: number;
        periodicidad: Periodicidad;
        estado: EstadoContrato;
      },
      TipoContrato,
      Periodicidad,
      EstadoContrato,
    };
  },
);

jest.mock('../chemical_toilets/entities/chemical_toilet.entity', () => ({
  ChemicalToilet: class ChemicalToilet {
    baño_id: number;
    codigo_interno: string;
    modelo: string;
    fecha_adquisicion: Date;
    estado: string;
    maintenances: any[];
  },
}));

jest.mock('../chemical_toilets/chemical_toilets.service', () => ({
  ChemicalToiletsService: jest.fn().mockImplementation(() => ({
    findByClientId: jest.fn(),
  })),
}));

jest.mock('../common/enums/resource-states.enum', () => ({
  ResourceState: {
    DISPONIBLE: 'DISPONIBLE',
    ASIGNADO: 'ASIGNADO',
    EN_MANTENIMIENTO: 'EN_MANTENIMIENTO',
    FUERA_DE_SERVICIO: 'FUERA_DE_SERVICIO',
    BAJA: 'BAJA',
    VACACIONES: 'VACACIONES',
    LICENCIA: 'LICENCIA',
    INACTIVO: 'INACTIVO',
    EN_CAPACITACION: 'EN_CAPACITACION',
    RESERVADO: 'RESERVADO',
    toString: function () {
      return this;
    },
  },
}));

// Importamos después de los mocks
import { Test, TestingModule } from '@nestjs/testing';
import { ClientController } from './clients.controller';
import { ClientService } from './clients.service';
import { CreateClientDto } from './dto/create_client.dto';
import { UpdateClientDto } from './dto/update_client.dto';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Cliente } from './entities/client.entity';
import {
  CondicionesContractuales,
  EstadoContrato,
  TipoContrato,
  Periodicidad,
} from '../contractual_conditions/entities/contractual_conditions.entity';
import { ChemicalToilet } from '../chemical_toilets/entities/chemical_toilet.entity';
import { ResourceState } from '../common/enums/resource-states.enum';

// Mock del Cliente
const mockCliente: Cliente = {
  clienteId: 1,
  nombre: 'Empresa ABC',
  email: 'contacto@abc.com',
  cuit: '30-12345678-9',
  direccion: 'Calle Principal 123',
  telefono: '11-12345678',
  contacto_principal: 'Juan Pérez',
  contacto_principal_telefono: '11-87654321',
  estado: ResourceState.DISPONIBLE,
  fecha_registro: new Date('2025-01-15'),
  contratos: [],
  servicios: [],
  futurasLimpiezas: [],
};

// Mock del resultado paginado
const mockPaginatedResult = {
  items: [mockCliente],
  total: 1,
  page: 1,
  limit: 10,
  totalPages: 1,
};

// Mock del contrato activo y baños asignados
const mockContract: Partial<CondicionesContractuales> = {
  condicionContractualId: 1,
  cliente: { clienteId: 1, nombre: 'Empresa ABC' } as any,
  tipo_de_contrato: TipoContrato.PERMANENTE,
  fecha_inicio: new Date('2025-01-01'),
  fecha_fin: new Date('2025-12-31'),
  condiciones_especificas: 'Términos específicos...',
  tarifa: 5000,
  periodicidad: Periodicidad.SEMANAL,
  estado: EstadoContrato.ACTIVO,
};

const mockToilets: Partial<ChemicalToilet>[] = [
  {
    baño_id: 1,
    codigo_interno: 'BQ-2025-001',
    modelo: 'Estándar',
    fecha_adquisicion: new Date('2024-01-01'),
    estado: ResourceState.DISPONIBLE,
    maintenances: [],
  },
  {
    baño_id: 2,
    codigo_interno: 'BQ-2025-002',
    modelo: 'Premium',
    fecha_adquisicion: new Date('2024-01-15'),
    estado: ResourceState.DISPONIBLE,
    maintenances: [],
  },
];

const mockActiveContract = {
  contrato: mockContract as CondicionesContractuales,
  banosAsignados: mockToilets as ChemicalToilet[],
};

describe('ClientController', () => {
  let controller: ClientController;
  let clientService: ClientService;

  beforeEach(async () => {
    console.log('======== PREPARANDO TESTS DE CLIENT CONTROLLER ========');

    const mockClientService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOneClient: jest.fn(),
      updateClient: jest.fn(),
      deleteClient: jest.fn(),
      getActiveContract: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientController],
      providers: [
        {
          provide: ClientService,
          useValue: mockClientService,
        },
      ],
    }).compile();

    controller = module.get<ClientController>(ClientController);
    clientService = module.get<ClientService>(ClientService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    console.log('🧪 TEST: El controlador de clientes debe estar definido');
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new client', async () => {
      console.log('🧪 TEST: Debe crear un nuevo cliente');

      const createDto: CreateClientDto = {
        nombre: 'Empresa ABC',
        email: 'contacto@abc.com',
        cuit: '30-12345678-9',
        direccion: 'Calle Principal 123',
        telefono: '11-12345678',
        contacto_principal: 'Juan Pérez',
        contacto_principal_telefono: '11-87654321',
        estado: ResourceState.DISPONIBLE,
      };

      jest.spyOn(clientService, 'create').mockResolvedValue(mockCliente);

      const result = await controller.create(createDto);

      expect(clientService.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockCliente);
    });

    it('should handle ConflictException from service', async () => {
      console.log('🧪 TEST: Debe manejar ConflictException del servicio');

      const createDto: CreateClientDto = {
        nombre: 'Empresa XYZ',
        email: 'contacto@xyz.com',
        cuit: '30-12345678-9', // CUIT duplicado
        direccion: 'Otra Calle 456',
        telefono: '11-99887766',
        contacto_principal: 'Ana López',
        contacto_principal_telefono: '11-55443322',
        estado: ResourceState.DISPONIBLE,
      };

      jest
        .spyOn(clientService, 'create')
        .mockRejectedValue(
          new ConflictException(
            `Ya existe un cliente con el CUIT ${createDto.cuit}`,
          ),
        );

      await expect(controller.create(createDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated list of clients', async () => {
      console.log('🧪 TEST: Debe devolver una lista paginada de clientes');

      const paginationDto: PaginationDto = { page: 1, limit: 10 };

      jest
        .spyOn(clientService, 'findAll')
        .mockResolvedValue(mockPaginatedResult);

      const result = await controller.findAll(paginationDto);

      expect(clientService.findAll).toHaveBeenCalledWith(paginationDto);
      expect(result).toEqual(mockPaginatedResult);
    });

    it('should apply search filters when provided', async () => {
      console.log(
        '🧪 TEST: Debe aplicar filtros de búsqueda cuando se proporcionan',
      );

      const paginationDto: PaginationDto = {
        page: 1,
        limit: 10,
        search: 'ABC',
      };

      jest.spyOn(clientService, 'findAll').mockResolvedValue({
        ...mockPaginatedResult,
        items: [mockCliente],
      });

      const result = await controller.findAll(paginationDto);

      expect(clientService.findAll).toHaveBeenCalledWith(paginationDto);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].nombre).toEqual('Empresa ABC');
    });
  });

  describe('findOne', () => {
    it('should return a client by id', async () => {
      console.log('🧪 TEST: Debe devolver un cliente por ID');

      jest.spyOn(clientService, 'findOneClient').mockResolvedValue(mockCliente);

      const result = await controller.findOne(1);

      expect(clientService.findOneClient).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockCliente);
    });

    it('should handle NotFoundException from service', async () => {
      console.log('🧪 TEST: Debe manejar NotFoundException del servicio');

      jest
        .spyOn(clientService, 'findOneClient')
        .mockRejectedValue(
          new NotFoundException('Client with id 999 not found'),
        );

      await expect(controller.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update client', async () => {
      console.log('🧪 TEST: Debe actualizar un cliente');

      const updateDto: UpdateClientDto = {
        telefono: '11-99998888',
        contacto_principal: 'Carlos Gómez',
      };

      const updatedClient: Cliente = {
        ...mockCliente,
        telefono: '11-99998888',
        contacto_principal: 'Carlos Gómez',
      };

      jest
        .spyOn(clientService, 'updateClient')
        .mockResolvedValue(updatedClient);

      const result = await controller.update(1, updateDto);

      expect(clientService.updateClient).toHaveBeenCalledWith(1, updateDto);
      expect(result).toEqual(updatedClient);
    });

    it('should handle NotFoundException from service', async () => {
      console.log(
        '🧪 TEST: Debe manejar NotFoundException del servicio al actualizar',
      );

      const updateDto: UpdateClientDto = {
        telefono: '11-99998888',
      };

      jest
        .spyOn(clientService, 'updateClient')
        .mockRejectedValue(
          new NotFoundException('Client with id 999 not found'),
        );

      await expect(controller.update(999, updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('delete', () => {
    it('should delete client', async () => {
      console.log('🧪 TEST: Debe eliminar un cliente');

      jest.spyOn(clientService, 'deleteClient').mockResolvedValue(undefined);

      await controller.delete(1);

      expect(clientService.deleteClient).toHaveBeenCalledWith(1);
    });

    it('should handle NotFoundException from service', async () => {
      console.log(
        '🧪 TEST: Debe manejar NotFoundException del servicio al eliminar',
      );

      jest
        .spyOn(clientService, 'deleteClient')
        .mockRejectedValue(
          new NotFoundException('Client with id 999 not found'),
        );

      await expect(controller.delete(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getActiveContract', () => {
    it('should return active contract and assigned toilets for a client', async () => {
      console.log('🧪 TEST: Debe devolver contrato activo y baños asignados');

      jest
        .spyOn(clientService, 'getActiveContract')
        .mockResolvedValue(mockActiveContract);

      const result = await controller.getActiveContract(1);

      expect(clientService.getActiveContract).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockActiveContract);
      expect(result.contrato).toBeDefined();
      expect(result.banosAsignados).toHaveLength(2);
    });

    it('should handle NotFoundException from service', async () => {
      console.log(
        '🧪 TEST: Debe manejar NotFoundException cuando no hay contratos activos',
      );

      jest
        .spyOn(clientService, 'getActiveContract')
        .mockRejectedValue(
          new NotFoundException(
            'No hay contratos activos para el cliente Empresa ABC',
          ),
        );

      await expect(controller.getActiveContract(1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

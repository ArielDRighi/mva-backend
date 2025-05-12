// filepath: d:\Personal\mva-backend\src\clients\clients.service.spec.ts
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
import { ClientService } from './clients.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { CreateClientDto } from './dto/create_client.dto';
import { UpdateClientDto } from './dto/update_client.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Cliente } from './entities/client.entity';
import {
  CondicionesContractuales,
  EstadoContrato,
  TipoContrato,
  Periodicidad,
} from '../contractual_conditions/entities/contractual_conditions.entity';
import { ChemicalToiletsService } from '../chemical_toilets/chemical_toilets.service';
import { ChemicalToilet } from '../chemical_toilets/entities/chemical_toilet.entity';
import { ResourceState } from '../common/enums/resource-states.enum';

// Mock de datos para pruebas
const mockCliente = {
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

const mockServiceMethods = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOneClient: jest.fn(),
  updateClient: jest.fn(),
  deleteClient: jest.fn(),
  getActiveContract: jest.fn(),
};

// Mock del servicio de baños químicos
const mockChemicalToiletsService = {
  findByClientId: jest.fn(),
};

describe('ClientService', () => {
  let service: ClientService;

  beforeEach(async () => {
    console.log('======== PREPARANDO TESTS DE CLIENT SERVICE ========');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ClientService,
          useValue: mockServiceMethods,
        },
        {
          provide: getRepositoryToken(Cliente),
          useValue: {},
        },
        {
          provide: getRepositoryToken(CondicionesContractuales),
          useValue: {},
        },
        {
          provide: ChemicalToiletsService,
          useValue: mockChemicalToiletsService,
        },
      ],
    }).compile();

    service = module.get<ClientService>(ClientService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    console.log('🧪 TEST: El servicio de clientes debe estar definido');
    expect(service).toBeDefined();
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

      mockServiceMethods.create.mockResolvedValue(mockCliente);

      const result = await service.create(createDto);

      expect(result).toEqual(mockCliente);
    });

    it('should throw ConflictException when cuit already exists', async () => {
      console.log(
        '🧪 TEST: Debe lanzar ConflictException cuando el CUIT ya existe',
      );
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

      mockServiceMethods.create.mockRejectedValue(
        new ConflictException(
          `Ya existe un cliente con el CUIT ${createDto.cuit}`,
        ),
      );

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated list of clients', async () => {
      console.log('🧪 TEST: Debe devolver una lista paginada de clientes');

      const mockPaginatedResult = {
        items: [mockCliente],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      mockServiceMethods.findAll.mockResolvedValue(mockPaginatedResult);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result).toEqual(mockPaginatedResult);
    });

    it('should return filtered list when search parameter is provided', async () => {
      console.log(
        '🧪 TEST: Debe devolver una lista filtrada cuando se proporciona el parámetro de búsqueda',
      );

      const paginationDto: PaginationDto = {
        page: 1,
        limit: 10,
        search: 'ABC',
      };

      const mockPaginatedResult = {
        items: [mockCliente],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      mockServiceMethods.findAll.mockResolvedValue(mockPaginatedResult);

      const result = await service.findAll(paginationDto);

      expect(result).toEqual(mockPaginatedResult);
    });
  });

  describe('findOneClient', () => {
    it('should return a client by id', async () => {
      console.log('🧪 TEST: Debe devolver un cliente por su ID');

      mockServiceMethods.findOneClient.mockResolvedValue(mockCliente);

      const result = await service.findOneClient(1);

      expect(result).toEqual(mockCliente);
    });

    it('should throw NotFoundException when client not found', async () => {
      console.log(
        '🧪 TEST: Debe lanzar NotFoundException cuando el cliente no existe',
      );

      mockServiceMethods.findOneClient.mockRejectedValue(
        new NotFoundException('Client with id 999 not found'),
      );

      await expect(service.findOneClient(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateClient', () => {
    it('should update a client', async () => {
      console.log('🧪 TEST: Debe actualizar un cliente');

      const updateDto: UpdateClientDto = {
        telefono: '11-99998888',
        contacto_principal: 'Carlos Gómez',
      };

      const updatedClient = {
        ...mockCliente,
        telefono: '11-99998888',
        contacto_principal: 'Carlos Gómez',
      };

      mockServiceMethods.updateClient.mockResolvedValue(updatedClient);

      const result = await service.updateClient(1, updateDto);

      expect(result).toEqual(updatedClient);
    });

    it('should throw NotFoundException when client to update not found', async () => {
      console.log(
        '🧪 TEST: Debe lanzar NotFoundException cuando el cliente a actualizar no existe',
      );

      const updateDto: UpdateClientDto = {
        telefono: '11-99998888',
      };

      mockServiceMethods.updateClient.mockRejectedValue(
        new NotFoundException('Client with id 999 not found'),
      );

      await expect(service.updateClient(999, updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteClient', () => {
    it('should delete a client', async () => {
      console.log('🧪 TEST: Debe eliminar un cliente');

      mockServiceMethods.deleteClient.mockResolvedValue(undefined);

      await service.deleteClient(1);

      expect(service.deleteClient).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when client to delete not found', async () => {
      console.log(
        '🧪 TEST: Debe lanzar NotFoundException cuando el cliente a eliminar no existe',
      );

      mockServiceMethods.deleteClient.mockRejectedValue(
        new NotFoundException('Client with id 999 not found'),
      );

      await expect(service.deleteClient(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getActiveContract', () => {
    it('should return active contract and assigned toilets for a client', async () => {
      console.log(
        '🧪 TEST: Debe devolver contrato activo y baños asignados para un cliente',
      );
      const mockContract: Partial<CondicionesContractuales> = {
        condicionContractualId: 1,
        cliente: {
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
        } as Cliente,
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

      mockServiceMethods.getActiveContract.mockResolvedValue(
        mockActiveContract,
      );

      const result = await service.getActiveContract(1);

      expect(result).toEqual(mockActiveContract);
      expect(result.contrato).toBeDefined();
      expect(result.banosAsignados).toHaveLength(2);
    });

    it('should throw NotFoundException when no active contracts found', async () => {
      console.log(
        '🧪 TEST: Debe lanzar NotFoundException cuando no hay contratos activos',
      );

      mockServiceMethods.getActiveContract.mockRejectedValue(
        new NotFoundException(
          'No hay contratos activos para el cliente Empresa ABC',
        ),
      );

      await expect(service.getActiveContract(1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

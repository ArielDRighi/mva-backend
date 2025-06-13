import { Test, TestingModule } from '@nestjs/testing';
import { ContractualConditionsService } from './contractual_conditions.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import {
  CondicionesContractuales,
  EstadoContrato,
  Periodicidad,
} from './entities/__mocks__/contractual_conditions.entity';
import { CreateContractualConditionDto } from './dto/create_contractual_conditions.dto';
import { ModifyCondicionContractualDto } from './dto/modify_contractual_conditions.dto';
import { ServiceType } from '../common/enums/resource-states.enum';

// Mock Cliente class for repository token
class Cliente {}

describe('ContractualConditionsService', () => {
  let service: ContractualConditionsService;

  // Mock repository functions
  const mockContractualConditionsRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockClientRepository = {
    findOne: jest.fn(),
  };

  // Mock data
  const mockClient = {
    clienteId: 1,
    nombre: 'Constructora ABC',
    cuit: '30-71234567-0',
  };
  const mockContractualCondition = {
    condicionContractualId: 1,
    cliente: mockClient as any, // Use 'any' to avoid typing issues
    fecha_inicio: new Date('2025-01-01'),
    fecha_fin: new Date('2025-12-31'),
    condiciones_especificas:
      'Incluye servicio de limpieza semanal sin costo adicional',
    tarifa: 2500,
    periodicidad: Periodicidad.MENSUAL,
    estado: EstadoContrato.ACTIVO,
    tipo_servicio: ServiceType.INSTALACION,
    cantidad_banos: 5,
    tarifa_alquiler: 2000,
    tarifa_instalacion: 500,
    tarifa_limpieza: 300,
  };

  const mockContractualConditionsList = [
    mockContractualCondition,    {
      ...mockContractualCondition,
      condicionContractualId: 2,
      fecha_inicio: new Date('2025-05-01'),
      fecha_fin: new Date('2025-05-31'),
    },
  ];
  beforeEach(async () => {
    console.log(
      '======== PREPARANDO TESTS DE CONTRACTUAL CONDITIONS SERVICE ========',
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContractualConditionsService,
        {
          provide: getRepositoryToken(CondicionesContractuales),
          useValue: mockContractualConditionsRepository,
        },
        {
          provide: getRepositoryToken(Cliente),
          useValue: mockClientRepository,
        },
      ],
    }).compile();

    service = module.get<ContractualConditionsService>(
      ContractualConditionsService,
    );

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    console.log(
      '🧪 TEST: El servicio de condiciones contractuales debería estar definido',
    );
    expect(service).toBeDefined();
  });

  describe('getAllContractualConditions', () => {
    it('should return a paginated list of contractual conditions', async () => {
      console.log(
        '🧪 TEST: Debe retornar una lista paginada de condiciones contractuales',
      );
      // Arrange
      const page = 1;
      const limit = 10;
      const total = 2;
      mockContractualConditionsRepository.findAndCount.mockResolvedValue([
        mockContractualConditionsList,
        total,
      ]);

      // Act
      const result = await service.getAllContractualConditions(page, limit);

      // Assert
      expect(
        mockContractualConditionsRepository.findAndCount,
      ).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
      });
      expect(result).toEqual({
        items: mockContractualConditionsList,
        total,
        page,
        limit,
        totalPages: 1,
      });
    });

    it('should throw an error if pagination parameters are invalid', async () => {
      console.log(
        '🧪 TEST: Debe lanzar error si los parámetros de paginación son inválidos',
      );
      await expect(service.getAllContractualConditions(-1, 0)).rejects.toThrow(
        'Invalid pagination parameters',
      );
    });
  });

  describe('getContractualConditionById', () => {
    it('should return a contractual condition by id', async () => {
      console.log('🧪 TEST: Debe retornar una condición contractual por ID');
      // Arrange
      mockContractualConditionsRepository.findOne.mockResolvedValue(
        mockContractualCondition,
      );

      // Act
      const result = await service.getContractualConditionById(1);

      // Assert
      expect(mockContractualConditionsRepository.findOne).toHaveBeenCalledWith({
        where: { condicionContractualId: 1 },
        relations: ['cliente'],
      });
      expect(result).toEqual(mockContractualCondition);
    });

    it('should throw NotFoundException if contractual condition is not found', async () => {
      console.log(
        '🧪 TEST: Debe lanzar NotFoundException si la condición contractual no se encuentra',
      );
      // Arrange
      mockContractualConditionsRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getContractualConditionById(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getContractualConditionsByClient', () => {
    it('should return contractual conditions for a specific client', async () => {
      console.log(
        '🧪 TEST: Debe retornar condiciones contractuales para un cliente específico',
      );
      // Arrange
      mockClientRepository.findOne.mockResolvedValue(mockClient);
      mockContractualConditionsRepository.find.mockResolvedValue(
        mockContractualConditionsList,
      );

      // Act
      const result = await service.getContractualConditionsByClient(1);

      // Assert
      expect(mockClientRepository.findOne).toHaveBeenCalledWith({
        where: { clienteId: 1 },
      });
      expect(mockContractualConditionsRepository.find).toHaveBeenCalledWith({
        relations: ['cliente'],
        where: {
          cliente: {
            clienteId: 1,
          },
        },
      });
      expect(result).toEqual(mockContractualConditionsList);
    });

    it('should throw NotFoundException if client is not found', async () => {
      console.log(
        '🧪 TEST: Debe lanzar NotFoundException si el cliente no se encuentra',
      );
      // Arrange
      mockClientRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.getContractualConditionsByClient(999),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if client has no contractual conditions', async () => {
      console.log(
        '🧪 TEST: Debe lanzar NotFoundException si el cliente no tiene condiciones contractuales',
      );
      // Arrange
      mockClientRepository.findOne.mockResolvedValue(mockClient);
      mockContractualConditionsRepository.find.mockResolvedValue([]);

      // Act & Assert
      await expect(service.getContractualConditionsByClient(1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createContractualCondition', () => {
    it('should create and return a new contractual condition', async () => {      console.log(
        '🧪 TEST: Debe crear y retornar una nueva condición contractual',
      );
      // Arrange
      const createDto: CreateContractualConditionDto = {
        clientId: 1,
        fecha_inicio: new Date('2025-01-01'),
        fecha_fin: new Date('2025-12-31'),
        condiciones_especificas:
          'Incluye servicio de limpieza semanal sin costo adicional',
        tarifa: 2500,
        periodicidad: Periodicidad.MENSUAL,
        estado: EstadoContrato.ACTIVO,
        tipo_servicio: ServiceType.INSTALACION,
        cantidad_banos: 5,
        tarifa_alquiler: 2000,
        tarifa_instalacion: 500,
        tarifa_limpieza: 300,
      };

      mockClientRepository.findOne.mockResolvedValue(mockClient);
      mockContractualConditionsRepository.create.mockReturnValue(
        mockContractualCondition,
      );
      mockContractualConditionsRepository.save.mockResolvedValue(
        mockContractualCondition,
      );

      // Act
      const result = await service.createContractualCondition(createDto);

      // Assert
      expect(mockClientRepository.findOne).toHaveBeenCalledWith({
        where: { clienteId: 1 },
      });      expect(mockContractualConditionsRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          cliente: mockClient,
          fecha_inicio: new Date('2025-01-01'),
          fecha_fin: new Date('2025-12-31'),
        }),
      );
      expect(mockContractualConditionsRepository.save).toHaveBeenCalledWith(
        mockContractualCondition,
      );
      expect(result).toEqual(mockContractualCondition);
    });

    it('should throw NotFoundException if client is not found', async () => {
      console.log(
        '🧪 TEST: Debe lanzar NotFoundException si el cliente no se encuentra',
      );
      // Arrange      const createDto: CreateContractualConditionDto = {
        clientId: 999,
        fecha_inicio: new Date('2025-01-01'),
        fecha_fin: new Date('2025-12-31'),
        condiciones_especificas:
          'Incluye servicio de limpieza semanal sin costo adicional',
        tarifa: 2500,
        periodicidad: Periodicidad.MENSUAL,
      };

      mockClientRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.createContractualCondition(createDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('modifyContractualCondition', () => {
    it('should update and return a modified contractual condition', async () => {
      console.log(
        '🧪 TEST: Debe actualizar y retornar una condición contractual modificada',
      );
      // Arrange
      const modifyDto: ModifyCondicionContractualDto = {
        tarifa: 3000,
        estado: EstadoContrato.INACTIVO,
      };

      const modifiedCondition = {
        ...mockContractualCondition,
        tarifa: 3000,
        estado: EstadoContrato.INACTIVO,
      };

      mockContractualConditionsRepository.findOne
        .mockResolvedValueOnce(mockContractualCondition)
        .mockResolvedValueOnce(modifiedCondition);

      mockContractualConditionsRepository.update.mockResolvedValue({
        affected: 1,
      });

      // Act
      const result = await service.modifyContractualCondition(modifyDto, 1);

      // Assert
      expect(mockContractualConditionsRepository.findOne).toHaveBeenCalledWith({
        where: { condicionContractualId: 1 },
      });
      expect(mockContractualConditionsRepository.update).toHaveBeenCalledWith(
        1,
        modifyDto,
      );
      expect(result).toEqual(modifiedCondition);
    });

    it('should throw NotFoundException if contractual condition is not found', async () => {
      console.log(
        '🧪 TEST: Debe lanzar NotFoundException si la condición contractual no se encuentra',
      );
      // Arrange
      const modifyDto: ModifyCondicionContractualDto = {
        tarifa: 3000,
      };

      mockContractualConditionsRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.modifyContractualCondition(modifyDto, 999),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteContractualCondition', () => {
    it('should delete a contractual condition and return success message', async () => {
      console.log(
        '🧪 TEST: Debe eliminar una condición contractual y retornar mensaje de éxito',
      );
      // Arrange
      mockContractualConditionsRepository.findOne.mockResolvedValue(
        mockContractualCondition,
      );
      mockContractualConditionsRepository.delete.mockResolvedValue({
        affected: 1,
      });

      // Act
      const result = await service.deleteContractualCondition(1);

      // Assert
      expect(mockContractualConditionsRepository.findOne).toHaveBeenCalledWith({
        where: { condicionContractualId: 1 },
      });
      expect(mockContractualConditionsRepository.delete).toHaveBeenCalledWith(
        1,
      );
      expect(result).toBe('Contractual Condition with ID 1 has been deleted');
    });

    it('should throw NotFoundException if contractual condition is not found', async () => {
      console.log(
        '🧪 TEST: Debe lanzar NotFoundException si la condición contractual no se encuentra',
      );
      // Arrange
      mockContractualConditionsRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.deleteContractualCondition(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

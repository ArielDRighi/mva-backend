import { Test, TestingModule } from '@nestjs/testing';
import { ContractualConditionsController } from './contractual_conditions.controller';
import { ContractualConditionsService } from './contractual_conditions.service';
import { HttpException, HttpStatus } from '@nestjs/common';
import {
  EstadoContrato,
  Periodicidad,
  TipoContrato,
} from './entities/__mocks__/contractual_conditions.entity';
import { CreateContractualConditionDto } from './dto/create_contractual_conditions.dto';
import { ModifyCondicionContractualDto } from './dto/modify_contractual_conditions.dto';
import { ServiceType } from '../common/enums/resource-states.enum';

describe('ContractualConditionsController', () => {
  let controller: ContractualConditionsController;
  let service: ContractualConditionsService;

  // Mock data
  const mockClient = {
    clienteId: 1,
    nombre: 'Constructora ABC',
    cuit: '30-71234567-0',
  };

  const mockContractualCondition = {
    condicionContractualId: 1,
    cliente: mockClient,
    tipo_de_contrato: TipoContrato.PERMANENTE,
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
    mockContractualCondition,
    {
      ...mockContractualCondition,
      condicionContractualId: 2,
      tipo_de_contrato: TipoContrato.TEMPORAL,
      fecha_inicio: new Date('2025-05-01'),
      fecha_fin: new Date('2025-05-31'),
    },
  ];

  const mockPaginatedResult = {
    items: mockContractualConditionsList,
    total: 2,
    page: 1,
    limit: 10,
    totalPages: 1,
  };

  // Create mock service
  const mockContractualConditionsService = {
    getAllContractualConditions: jest.fn(),
    getContractualConditionById: jest.fn(),
    getContractualConditionsByClient: jest.fn(),
    createContractualCondition: jest.fn(),
    modifyContractualCondition: jest.fn(),
    deleteContractualCondition: jest.fn(),
  };

  beforeEach(async () => {
    console.log(
      '======== PREPARANDO TESTS DE CONTRACTUAL CONDITIONS CONTROLLER ========',
    );
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContractualConditionsController],
      providers: [
        {
          provide: ContractualConditionsService,
          useValue: mockContractualConditionsService,
        },
      ],
    }).compile();

    controller = module.get<ContractualConditionsController>(
      ContractualConditionsController,
    );
    service = module.get<ContractualConditionsService>(
      ContractualConditionsService,
    );

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    console.log(
      '🧪 TEST: El controlador de condiciones contractuales debería estar definido',
    );
    expect(controller).toBeDefined();
  });

  describe('getAllContractualConditions', () => {
    it('should return a paginated list of contractual conditions', async () => {
      console.log(
        '🧪 TEST: Debe retornar una lista paginada de condiciones contractuales',
      );
      // Arrange
      mockContractualConditionsService.getAllContractualConditions.mockResolvedValue(
        mockPaginatedResult,
      );

      // Act
      const result = await controller.getAllContractualConditions(1, 10);

      // Assert
      expect(service.getAllContractualConditions).toHaveBeenCalledWith(1, 10);
      expect(result).toEqual(mockPaginatedResult);
    });

    it('should throw HttpException if service throws an error', async () => {
      console.log(
        '🧪 TEST: Debe lanzar HttpException si el servicio lanza un error',
      );
      // Arrange
      const errorMessage = 'Invalid pagination parameters';
      mockContractualConditionsService.getAllContractualConditions.mockRejectedValue(
        new Error(errorMessage),
      );

      // Act & Assert
      await expect(
        controller.getAllContractualConditions(-1, 0),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('getContractualConditionById', () => {
    it('should return a contractual condition by id', async () => {
      console.log('🧪 TEST: Debe retornar una condición contractual por ID');
      // Arrange
      mockContractualConditionsService.getContractualConditionById.mockResolvedValue(
        mockContractualCondition,
      );

      // Act
      const result = await controller.getContractualConditionById(1);

      // Assert
      expect(service.getContractualConditionById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockContractualCondition);
    });
    it('should throw HttpException if service throws an error', async () => {
      console.log(
        '🧪 TEST: Debe lanzar HttpException si el servicio lanza un error',
      );
      // Arrange
      const errorMessage = 'Contractual Condition not found';
      mockContractualConditionsService.getContractualConditionById.mockRejectedValue(
        new Error(errorMessage),
      );

      // Act & Assert
      await expect(controller.getContractualConditionById(999)).rejects.toThrow(
        HttpException,
      );
    });
  });

  describe('getContractualConditionsByClient', () => {
    it('should return contractual conditions for a specific client', async () => {
      console.log(
        '🧪 TEST: Debe retornar las condiciones contractuales para un cliente',
      );
      // Arrange
      mockContractualConditionsService.getContractualConditionsByClient.mockResolvedValue(
        mockContractualConditionsList,
      );

      // Act
      const result = await controller.getContractualConditionsByClient(1);

      // Assert
      expect(service.getContractualConditionsByClient).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockContractualConditionsList);
    });

    it('should throw HttpException if service throws an error', async () => {
      console.log(
        '🧪 TEST: Debe lanzar HttpException si el servicio lanza un error',
      );
      // Arrange
      const errorMessage = 'Client not found';
      mockContractualConditionsService.getContractualConditionsByClient.mockRejectedValue(
        new Error(errorMessage),
      );

      // Act & Assert
      await expect(
        controller.getContractualConditionsByClient(999),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('createContractualCondition', () => {
    it('should create and return a new contractual condition', async () => {
      console.log('🧪 TEST: Debe crear una condición contractual');
      // Arrange
      const createDto: CreateContractualConditionDto = {
        clientId: 1,
        tipo_de_contrato: TipoContrato.PERMANENTE,
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

      mockContractualConditionsService.createContractualCondition.mockResolvedValue(
        mockContractualCondition,
      );

      // Act
      const result = await controller.createContractualCondition(createDto);

      // Assert
      expect(service.createContractualCondition).toHaveBeenCalledWith(
        createDto,
      );
      expect(result).toEqual(mockContractualCondition);
    });

    it('should throw HttpException if service throws an error', async () => {
      console.log(
        '🧪 TEST: Debe lanzar HttpException si el servicio lanza un error',
      );
      // Arrange
      const createDto: CreateContractualConditionDto = {
        clientId: 999,
        tipo_de_contrato: TipoContrato.PERMANENTE,
        fecha_inicio: new Date('2025-01-01'),
        fecha_fin: new Date('2025-12-31'),
        condiciones_especificas:
          'Incluye servicio de limpieza semanal sin costo adicional',
        tarifa: 2500,
        periodicidad: Periodicidad.MENSUAL,
      };

      const errorMessage = 'Client not found';
      mockContractualConditionsService.createContractualCondition.mockRejectedValue(
        new Error(errorMessage),
      );

      // Act & Assert
      await expect(
        controller.createContractualCondition(createDto),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('modifyContractualCondition', () => {
    it('should update and return a modified contractual condition', async () => {
      console.log('🧪 TEST: Debe modificar una condición contractual');
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

      mockContractualConditionsService.modifyContractualCondition.mockResolvedValue(
        modifiedCondition,
      );

      // Act
      const result = await controller.modifyContractualCondition(modifyDto, 1);

      // Assert
      expect(service.modifyContractualCondition).toHaveBeenCalledWith(
        modifyDto,
        1,
      );
      expect(result).toEqual(modifiedCondition);
    });

    it('should throw HttpException if service throws an error', async () => {
      console.log(
        '🧪 TEST: Debe lanzar HttpException si el servicio lanza un error',
      );
      // Arrange
      const modifyDto: ModifyCondicionContractualDto = {
        tarifa: 3000,
      };

      const errorMessage = 'Contractual Condition not found';
      mockContractualConditionsService.modifyContractualCondition.mockRejectedValue(
        new Error(errorMessage),
      );

      // Act & Assert
      await expect(
        controller.modifyContractualCondition(modifyDto, 999),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('deleteContractualCondition', () => {
    it('should delete a contractual condition and return success message', async () => {
      console.log('🧪 TEST: Debe eliminar una condición contractual');
      // Arrange
      const successMessage = 'Contractual Condition with ID 1 has been deleted';
      mockContractualConditionsService.deleteContractualCondition.mockResolvedValue(
        successMessage,
      );

      // Act
      const result = await controller.deleteContractualCondition(1);

      // Assert
      expect(service.deleteContractualCondition).toHaveBeenCalledWith(1);
      expect(result).toBe(successMessage);
    });

    it('should throw HttpException if service throws an error', async () => {
      console.log(
        '🧪 TEST: Debe lanzar HttpException si el servicio lanza un error',
      );
      // Arrange
      const errorMessage = 'Contractual Condition not found';
      mockContractualConditionsService.deleteContractualCondition.mockRejectedValue(
        new Error(errorMessage),
      );

      // Act & Assert
      await expect(controller.deleteContractualCondition(999)).rejects.toThrow(
        HttpException,
      );
    });
  });
});

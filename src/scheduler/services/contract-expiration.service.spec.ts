import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ContractExpirationService } from './contract-expiration.service';
import { Service } from '../../services/entities/service.entity';
import { ChemicalToilet } from '../../chemical_toilets/entities/chemical_toilet.entity';
import {
  ResourceState,
  ServiceType,
} from '../../common/enums/resource-states.enum';
import { Logger } from '@nestjs/common';

describe('ContractExpirationService', () => {
  let service: ContractExpirationService;
  let serviceRepositoryMock: any;
  let toiletsRepositoryMock: any;
  // Mocks para pruebas
  const mockService = {
    id: 1,
    descripcion: 'Servicio de instalación de baños químicos en obra',
    tipoServicio: ServiceType.INSTALACION,
    fechaFinAsignacion: new Date('2025-05-01'),
    asignaciones: [
      {
        id: 1,
        bano: {
          baño_id: 123,
          codigo: 'B001',
          estado: ResourceState.ASIGNADO,
        },
      },
      {
        id: 2,
        bano: {
          baño_id: 456,
          codigo: 'B002',
          estado: ResourceState.ASIGNADO,
        },
      },
    ],
  };

  const mockExpiredServices = [mockService];

  beforeEach(async () => {
    // Mocks de los repositorios
    serviceRepositoryMock = {
      find: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
    };

    toiletsRepositoryMock = {
      update: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContractExpirationService,
        {
          provide: getRepositoryToken(Service),
          useValue: serviceRepositoryMock,
        },
        {
          provide: getRepositoryToken(ChemicalToilet),
          useValue: toiletsRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<ContractExpirationService>(ContractExpirationService);

    // Espiar el logger para verificar las llamadas
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkExpiredContracts', () => {
    it('should process expired contracts and update toilet status', async () => {
      // Configuración del mock para simular contratos expirados
      serviceRepositoryMock.find.mockResolvedValue(mockExpiredServices);

      // Ejecutar el método bajo prueba
      await service.checkExpiredContracts();

      // Verificaciones
      expect(serviceRepositoryMock.find).toHaveBeenCalled();

      // Debería actualizar el estado de los baños
      expect(toiletsRepositoryMock.update).toHaveBeenCalledTimes(2);
      expect(toiletsRepositoryMock.update).toHaveBeenCalledWith(123, {
        estado: ResourceState.DISPONIBLE,
      });
      expect(toiletsRepositoryMock.update).toHaveBeenCalledWith(456, {
        estado: ResourceState.DISPONIBLE,
      });

      // Debería actualizar el servicio
      expect(serviceRepositoryMock.update).toHaveBeenCalledWith(1, {
        fechaFinAsignacion: undefined,
      });
    });

    it('should handle empty assignments array gracefully', async () => {
      // Servicio sin asignaciones
      const serviceWithoutAssignments = {
        id: 2,
        descripcion: 'Servicio sin asignaciones',
        tipoServicio: ServiceType.INSTALACION,
        fechaFinAsignacion: new Date('2025-05-01'),
        asignaciones: [],
      };

      serviceRepositoryMock.find.mockResolvedValue([serviceWithoutAssignments]);

      // Ejecutar el método
      await service.checkExpiredContracts();

      // No debería intentar actualizar ningún baño
      expect(toiletsRepositoryMock.update).not.toHaveBeenCalled();

      // Pero sí debería actualizar el servicio
      expect(serviceRepositoryMock.update).toHaveBeenCalledWith(2, {
        fechaFinAsignacion: undefined,
      });
    });

    it('should handle null assignments gracefully', async () => {
      // Servicio con asignaciones null
      const serviceWithNullAssignments = {
        id: 3,
        descripcion: 'Servicio con asignaciones null',
        tipoServicio: ServiceType.INSTALACION,
        fechaFinAsignacion: new Date('2025-05-01'),
        asignaciones: null,
      };

      serviceRepositoryMock.find.mockResolvedValue([
        serviceWithNullAssignments,
      ]);

      // Ejecutar el método
      await service.checkExpiredContracts();

      // No debería intentar actualizar ningún baño
      expect(toiletsRepositoryMock.update).not.toHaveBeenCalled();

      // Pero sí debería actualizar el servicio
      expect(serviceRepositoryMock.update).toHaveBeenCalledWith(3, {
        fechaFinAsignacion: undefined,
      });
    });

    it('should handle errors gracefully', async () => {
      // Simular un error
      serviceRepositoryMock.find.mockRejectedValue(
        new Error('Database connection error'),
      );

      // Ejecutar el método
      await service.checkExpiredContracts();

      // Debería loguear el error
      expect(Logger.prototype.error).toHaveBeenCalled();

      // No debería intentar actualizar
      expect(toiletsRepositoryMock.update).not.toHaveBeenCalled();
      expect(serviceRepositoryMock.update).not.toHaveBeenCalled();
    });
  });
});

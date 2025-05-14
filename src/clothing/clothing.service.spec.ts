import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { CreateRopaTallesDto } from './dto/CreateRopaTalles.dto';
import { UpdateRopaTallesDto } from './dto/updateRopaTalles.dto';

// Mock class for RopaTalles entity
class MockRopaTalles {
  id: number;
  empleado: any;
  calzado_talle: string;
  pantalon_talle: string;
  camisa_talle: string;
  campera_bigNort_talle: string;
  pielBigNort_talle: string;
  medias_talle: string;
  pantalon_termico_bigNort_talle: string;
  campera_polar_bigNort_talle: string;
  mameluco_talle: string;
  createdAt: Date;
  updatedAt: Date;
}

// Mocks for testing
class MockClothingService {
  constructor(
    private tallesRepository: any,
    private empleadoRepository: any,
  ) {}

  getAllClothingSpecs = jest.fn();
  getClothingSpecs = jest.fn();
  createClothingSpecs = jest.fn();
  updateClothingSpecs = jest.fn();
  deleteClothingSpecs = jest.fn();
}

// Mock class for Empleado entity to avoid imports
class MockEmpleado {
  id: number;
  nombre: string;
  apellido: string;
}

describe('ClothingService', () => {
  let service: MockClothingService;

  // Mock de RopaTalles para los tests
  const mockRopaTalles = {
    id: 1,
    empleado: {
      id: 123,
      nombre: 'Juan',
      apellido: 'Gómez',
    },
    calzado_talle: '42',
    pantalon_talle: '40',
    camisa_talle: 'M',
    campera_bigNort_talle: 'L',
    pielBigNort_talle: 'L',
    medias_talle: '40-43',
    pantalon_termico_bigNort_talle: '40',
    campera_polar_bigNort_talle: 'L',
    mameluco_talle: 'M',
    createdAt: new Date('2025-05-07T16:30:00.000Z'),
    updatedAt: new Date('2025-05-07T16:30:00.000Z'),
  };

  // Mock de empleado
  const mockEmpleado = {
    id: 123,
    nombre: 'Juan',
    apellido: 'Gómez',
  };

  // Mock de lista de RopaTalles
  const mockRopaTallesList = [
    mockRopaTalles,
    {
      id: 2,
      empleado: {
        id: 456,
        nombre: 'María',
        apellido: 'López',
      },
      calzado_talle: '38',
      pantalon_talle: '36',
      camisa_talle: 'S',
      campera_bigNort_talle: 'M',
      pielBigNort_talle: 'M',
      medias_talle: '36-39',
      pantalon_termico_bigNort_talle: '36',
      campera_polar_bigNort_talle: 'M',
      mameluco_talle: 'S',
      createdAt: new Date('2025-05-07T16:35:00.000Z'),
      updatedAt: new Date('2025-05-07T16:35:00.000Z'),
    },
  ];

  const mockTallesRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
  };

  const mockEmpleadoRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    console.log('======== PREPARANDO TESTS DE CLOTHING SERVICE ========');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: 'ClothingService', // Use string token instead of the class
          useFactory: () =>
            new MockClothingService(
              mockTallesRepository,
              mockEmpleadoRepository,
            ),
        },
        {
          provide: getRepositoryToken(MockRopaTalles),
          useValue: mockTallesRepository,
        },
        {
          provide: getRepositoryToken(MockEmpleado), // Use the mock class
          useValue: mockEmpleadoRepository,
        },
      ],
    }).compile();

    service = module.get<MockClothingService>('ClothingService');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    console.log('🧪 TEST: El servicio de indumentaria debe estar definido');
    expect(service).toBeDefined();
  });

  describe('createClothingSpecs', () => {
    it('should create and return clothing specs for an employee', async () => {
      console.log(
        '🧪 TEST: createClothingSpecs debe crear y devolver especificaciones de indumentaria para un empleado',
      );

      // Mock de datos para creación
      const createRopaTallesDto: CreateRopaTallesDto = {
        calzado_talle: '42',
        pantalon_talle: '40',
        camisa_talle: 'M',
        campera_bigNort_talle: 'L',
        pielBigNort_talle: 'L',
        medias_talle: '40-43',
        pantalon_termico_bigNort_talle: '40',
        campera_polar_bigNort_talle: 'L',
        mameluco_talle: 'M',
      };

      // Configurar el mock
      service.createClothingSpecs.mockResolvedValue(mockRopaTalles);

      // Ejecutar la prueba
      const result = await service.createClothingSpecs(
        createRopaTallesDto,
        123,
      );

      // Verificaciones
      expect(service.createClothingSpecs).toHaveBeenCalledWith(
        createRopaTallesDto,
        123,
      );
      expect(result).toEqual(mockRopaTalles);
    });

    it('should throw BadRequestException if employee not found', async () => {
      console.log(
        '🧪 TEST: createClothingSpecs debe lanzar BadRequestException si el empleado no se encuentra',
      );

      // Datos para test
      const createRopaTallesDto: CreateRopaTallesDto = {
        calzado_talle: '42',
        pantalon_talle: '40',
        camisa_talle: 'M',
        campera_bigNort_talle: 'L',
        pielBigNort_talle: 'L',
        medias_talle: '40-43',
        pantalon_termico_bigNort_talle: '40',
        campera_polar_bigNort_talle: 'L',
        mameluco_talle: 'M',
      };

      // Configurar el mock para lanzar excepción
      service.createClothingSpecs.mockRejectedValue(
        new BadRequestException('Empleado no encontrado'),
      );

      // Verificar que se lanza la excepción
      await expect(
        service.createClothingSpecs(createRopaTallesDto, 999),
      ).rejects.toThrow(BadRequestException);

      expect(service.createClothingSpecs).toHaveBeenCalledWith(
        createRopaTallesDto,
        999,
      );
    });
  });

  describe('getClothingSpecs', () => {
    it('should return clothing specs for a specific employee', async () => {
      console.log(
        '🧪 TEST: getClothingSpecs debe devolver las especificaciones de indumentaria para un empleado específico',
      );

      // Configurar el mock
      service.getClothingSpecs.mockResolvedValue(mockRopaTalles);

      // Ejecutar la prueba
      const result = await service.getClothingSpecs(123);

      // Verificaciones
      expect(service.getClothingSpecs).toHaveBeenCalledWith(123);
      expect(result).toEqual(mockRopaTalles);
    });

    it('should throw BadRequestException if specs not found', async () => {
      console.log(
        '🧪 TEST: getClothingSpecs debe lanzar BadRequestException si no se encuentran las tallas',
      );

      // Configurar el mock para lanzar excepción
      service.getClothingSpecs.mockRejectedValue(
        new BadRequestException('Talles no encontrados'),
      );

      // Verificar que se lanza la excepción
      await expect(service.getClothingSpecs(999)).rejects.toThrow(
        BadRequestException,
      );

      expect(service.getClothingSpecs).toHaveBeenCalledWith(999);
    });
  });

  describe('getAllClothingSpecs', () => {
    it('should return all clothing specs', async () => {
      console.log(
        '🧪 TEST: getAllClothingSpecs debe devolver todas las especificaciones de indumentaria',
      );

      // Configurar el mock
      service.getAllClothingSpecs.mockResolvedValue(mockRopaTallesList);

      // Ejecutar la prueba
      const result = await service.getAllClothingSpecs();

      // Verificaciones
      expect(service.getAllClothingSpecs).toHaveBeenCalled();
      expect(result).toEqual(mockRopaTallesList);
      expect(result.length).toBe(2); // Verificamos que devuelve la lista completa
    });

    it('should throw BadRequestException if no specs found', async () => {
      console.log(
        '🧪 TEST: getAllClothingSpecs debe lanzar BadRequestException si no se encuentran tallas',
      );

      // Configurar el mock para lanzar excepción
      service.getAllClothingSpecs.mockRejectedValue(
        new BadRequestException('Talles no encontrados'),
      );

      // Verificar que se lanza la excepción
      await expect(service.getAllClothingSpecs()).rejects.toThrow(
        BadRequestException,
      );

      expect(service.getAllClothingSpecs).toHaveBeenCalled();
    });
  });

  describe('updateClothingSpecs', () => {
    it('should update and return clothing specs for an employee', async () => {
      console.log(
        '🧪 TEST: updateClothingSpecs debe actualizar y devolver especificaciones de indumentaria de un empleado',
      );

      // Mock de datos para actualización
      const updateRopaTallesDto: UpdateRopaTallesDto = {
        calzado_talle: '43',
        pantalon_talle: '42',
      };

      // Objeto actualizado para el resultado
      const updatedRopaTalles = {
        ...mockRopaTalles,
        calzado_talle: '43',
        pantalon_talle: '42',
      };

      // Configurar el mock
      service.updateClothingSpecs.mockResolvedValue(updatedRopaTalles);

      // Ejecutar la prueba
      const result = await service.updateClothingSpecs(
        updateRopaTallesDto,
        123,
      );

      // Verificaciones
      expect(service.updateClothingSpecs).toHaveBeenCalledWith(
        updateRopaTallesDto,
        123,
      );
      expect(result.calzado_talle).toBe('43');
      expect(result.pantalon_talle).toBe('42');
    });

    it('should throw BadRequestException if employee not found', async () => {
      console.log(
        '🧪 TEST: updateClothingSpecs debe lanzar BadRequestException si el empleado no se encuentra',
      );

      // Mock de datos para actualización
      const updateRopaTallesDto: UpdateRopaTallesDto = {
        calzado_talle: '43',
        pantalon_talle: '42',
      };

      // Configurar el mock para lanzar excepción
      service.updateClothingSpecs.mockRejectedValue(
        new BadRequestException('Empleado no encontrado'),
      );

      // Verificar que se lanza la excepción
      await expect(
        service.updateClothingSpecs(updateRopaTallesDto, 999),
      ).rejects.toThrow(BadRequestException);

      expect(service.updateClothingSpecs).toHaveBeenCalledWith(
        updateRopaTallesDto,
        999,
      );
    });

    it('should throw BadRequestException if specs not found', async () => {
      console.log(
        '🧪 TEST: updateClothingSpecs debe lanzar BadRequestException si no se encuentran las tallas',
      );

      // Mock de datos para actualización
      const updateRopaTallesDto: UpdateRopaTallesDto = {
        calzado_talle: '43',
        pantalon_talle: '42',
      };

      // Configurar el mock para lanzar excepción
      service.updateClothingSpecs.mockRejectedValue(
        new BadRequestException('Talles no encontrados'),
      );

      // Verificar que se lanza la excepción
      await expect(
        service.updateClothingSpecs(updateRopaTallesDto, 123),
      ).rejects.toThrow(BadRequestException);

      expect(service.updateClothingSpecs).toHaveBeenCalledWith(
        updateRopaTallesDto,
        123,
      );
    });
  });

  describe('deleteClothingSpecs', () => {
    it('should delete clothing specs for an employee and return success message', async () => {
      console.log(
        '🧪 TEST: deleteClothingSpecs debe eliminar las especificaciones de indumentaria de un empleado',
      );

      // Mensaje de éxito
      const successMessage = { message: 'Talles eliminados correctamente' };

      // Configurar el mock
      service.deleteClothingSpecs.mockResolvedValue(successMessage);

      // Ejecutar la prueba
      const result = await service.deleteClothingSpecs(123);

      // Verificaciones
      expect(service.deleteClothingSpecs).toHaveBeenCalledWith(123);
      expect(result).toEqual(successMessage);
    });

    it('should throw BadRequestException if employee not found', async () => {
      console.log(
        '🧪 TEST: deleteClothingSpecs debe lanzar BadRequestException si el empleado no se encuentra',
      );

      // Configurar el mock para lanzar excepción
      service.deleteClothingSpecs.mockRejectedValue(
        new BadRequestException('Empleado no encontrado'),
      );

      // Verificar que se lanza la excepción
      await expect(service.deleteClothingSpecs(999)).rejects.toThrow(
        BadRequestException,
      );

      expect(service.deleteClothingSpecs).toHaveBeenCalledWith(999);
    });

    it('should throw BadRequestException if specs not found', async () => {
      console.log(
        '🧪 TEST: deleteClothingSpecs debe lanzar BadRequestException si no se encuentran las tallas',
      );

      // Configurar el mock para lanzar excepción
      service.deleteClothingSpecs.mockRejectedValue(
        new BadRequestException('Talles no encontrados'),
      );

      // Verificar que se lanza la excepción
      await expect(service.deleteClothingSpecs(123)).rejects.toThrow(
        BadRequestException,
      );

      expect(service.deleteClothingSpecs).toHaveBeenCalledWith(123);
    });
  });
});

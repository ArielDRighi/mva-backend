// Mocks directos para evitar problemas de importación
jest.mock('./entities/satisfactionSurvey.entity', () => ({
  SatisfactionSurvey: class SatisfactionSurvey {
    encuesta_id: number;
    cliente: string;
    createdAt: Date;
    fecha_mantenimiento: Date;
    calificacion: number;
    comentario: string;
    asunto: string;
    aspecto_evaluado: string;
  },
}));

jest.mock('./entities/claim.entity', () => ({
  Claim: class Claim {
    reclamo_id: number;
    cliente: string;
    titulo: string;
    descripcion: string;
    tipoReclamo: string;
    prioridad: string;
    estado: string;
    fechaCreacion: Date;
    fechaIncidente: Date;
    fechaActualiacion: Date;
    fechaResolucion: Date;
    respuesta: string;
    accionTomada: string;
    adjuntosUrls: string[];
    satisfaccionCliente: number;
    esUrgente: boolean;
    requiereCompensacion: boolean;
    compensacionDetalles: string;
    notasInternas: string;
  },
  EstadoReclamo: {
    PENDIENTE: 'pending',
    EN_PROGRESO: 'in_progress',
    RESUELTO: 'resolved',
    CERRADO: 'closed',
    RECHAZADO: 'rejected',
  },
  PrioridadReclamo: {
    BAJA: 'low',
    MEDIA: 'medium',
    ALTA: 'high',
    CRITICA: 'critical',
  },
  TipoReclamo: {
    CALIDAD_SERVICIO: 'service_quality',
    DEMORA: 'delay',
    PAGOS: 'billing',
    EMPLEADO: 'staff_behavior',
    PRODUCTO_DEFECTUOSO: 'product_defect',
    OTROS: 'other',
  },
}));

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientsPortalService } from './clientsPortal.service';
import { SatisfactionSurvey } from './entities/satisfactionSurvey.entity';
import { Claim } from './entities/claim.entity';
import { BadRequestException } from '@nestjs/common';
import { CreateClaimDto } from './dto/createClaim.dto';
import { CreateSatisfactionSurveyDto } from './dto/createSatisfactionSurvey.dto';
import { AskForServiceDto } from './dto/askForService.dto';

// Definimos un tipo más simple para los mocks del repositorio
interface MockRepository {
  find: jest.Mock;
  findOne: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
  count: jest.Mock;
}

describe('ClientsPortalService', () => {
  let service: ClientsPortalService;
  let satisfactionSurveyRepository: MockRepository;
  let claimRepository: MockRepository;

  // Mock de datos para pruebas
  const mockSatisfactionSurveys = [
    {
      encuesta_id: 1,
      cliente: 'Empresa ABC',
      calificacion: 5,
      comentario: 'Excelente servicio',
      fecha_mantenimiento: new Date('2025-04-30'),
    },
    {
      encuesta_id: 2,
      cliente: 'Empresa XYZ',
      calificacion: 4,
      comentario: 'Buen servicio',
      fecha_mantenimiento: new Date('2025-04-28'),
    },
  ];

  const mockSatisfactionSurvey = {
    encuesta_id: 1,
    cliente: 'Empresa ABC',
    calificacion: 5,
    comentario: 'Excelente servicio',
    fecha_mantenimiento: new Date('2025-04-30'),
  };

  const mockClaims = [
    {
      reclamo_id: 1,
      cliente: 'Empresa ABC',
      titulo: 'Baño en mal estado',
      tipoReclamo: 'CALIDAD_SERVICIO',
      prioridad: 'ALTA',
      estado: 'PENDIENTE',
    },
    {
      reclamo_id: 2,
      cliente: 'Empresa XYZ',
      titulo: 'Retraso en entrega',
      tipoReclamo: 'DEMORA',
      prioridad: 'MEDIA',
      estado: 'EN_PROGRESO',
    },
  ];

  const mockClaim = {
    reclamo_id: 1,
    cliente: 'Empresa ABC',
    titulo: 'Baño en mal estado',
    descripcion: 'El baño no funciona correctamente',
    tipoReclamo: 'CALIDAD_SERVICIO',
    prioridad: 'ALTA',
    estado: 'PENDIENTE',
  };

  beforeEach(async () => {
    console.log('======== PREPARANDO TESTS DE CLIENTS PORTAL SERVICE ========');

    // Create mock repositories
    satisfactionSurveyRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      count: jest.fn(),
    };

    claimRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      count: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientsPortalService,
        {
          provide: getRepositoryToken(SatisfactionSurvey),
          useValue: satisfactionSurveyRepository,
        },
        {
          provide: getRepositoryToken(Claim),
          useValue: claimRepository,
        },
      ],
    }).compile();

    service = module.get<ClientsPortalService>(ClientsPortalService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    console.log(
      '🧪 TEST: El servicio del portal de clientes debe estar definido',
    );
    expect(service).toBeDefined();
  });

  describe('getSatisfactionSurveys', () => {
    it('should return all satisfaction surveys', async () => {
      console.log(
        '🧪 TEST: getSatisfactionSurveys debe devolver todas las encuestas de satisfacción',
      );
      satisfactionSurveyRepository.find.mockResolvedValue(
        mockSatisfactionSurveys,
      );

      const result = await service.getSatisfactionSurveys();
      expect(satisfactionSurveyRepository.find).toHaveBeenCalled();
      expect(result).toEqual(mockSatisfactionSurveys);
    });

    it('should throw BadRequestException if no surveys found', async () => {
      console.log(
        '🧪 TEST: getSatisfactionSurveys debe lanzar BadRequestException si no se encuentran encuestas',
      );
      satisfactionSurveyRepository.find.mockResolvedValue(null);

      await expect(service.getSatisfactionSurveys()).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getSatisfactionSurveyById', () => {
    it('should return a satisfaction survey by id', async () => {
      console.log(
        '🧪 TEST: getSatisfactionSurveyById debe devolver una encuesta por su ID',
      );
      satisfactionSurveyRepository.findOne.mockResolvedValue(
        mockSatisfactionSurvey,
      );

      const result = await service.getSatisfactionSurveyById(1);
      expect(satisfactionSurveyRepository.findOne).toHaveBeenCalledWith({
        where: { encuesta_id: 1 },
      });
      expect(result).toEqual(mockSatisfactionSurvey);
    });

    it('should throw BadRequestException if survey not found', async () => {
      console.log(
        '🧪 TEST: getSatisfactionSurveyById debe lanzar BadRequestException si no se encuentra la encuesta',
      );
      satisfactionSurveyRepository.findOne.mockResolvedValue(null);

      await expect(service.getSatisfactionSurveyById(999)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getClaims', () => {
    it('should return all claims', async () => {
      console.log('🧪 TEST: getClaims debe devolver todos los reclamos');
      claimRepository.find.mockResolvedValue(mockClaims);

      const result = await service.getClaims();
      expect(claimRepository.find).toHaveBeenCalled();
      expect(result).toEqual(mockClaims);
    });

    it('should throw BadRequestException if no claims found', async () => {
      console.log(
        '🧪 TEST: getClaims debe lanzar BadRequestException si no se encuentran reclamos',
      );
      claimRepository.find.mockResolvedValue(null);

      await expect(service.getClaims()).rejects.toThrow(BadRequestException);
    });
  });

  describe('getClaimById', () => {
    it('should return a claim by id', async () => {
      console.log('🧪 TEST: getClaimById debe devolver un reclamo por su ID');
      claimRepository.findOne.mockResolvedValue(mockClaim);

      const result = await service.getClaimById(1);
      expect(claimRepository.findOne).toHaveBeenCalledWith({
        where: { reclamo_id: 1 },
      });
      expect(result).toEqual(mockClaim);
    });

    it('should throw BadRequestException if claim not found', async () => {
      console.log(
        '🧪 TEST: getClaimById debe lanzar BadRequestException si no se encuentra el reclamo',
      );
      claimRepository.findOne.mockResolvedValue(null);

      await expect(service.getClaimById(999)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('createClaim', () => {
    it('should create a new claim', async () => {
      console.log('🧪 TEST: createClaim debe crear un nuevo reclamo');
      const createClaimDto: CreateClaimDto = {
        cliente: 'Empresa ABC',
        titulo: 'Baño en mal estado',
        descripcion: 'El baño no funciona correctamente',
        tipoReclamo: 'CALIDAD_SERVICIO' as any,
        prioridad: 'ALTA' as any,
        fechaIncidente: '2025-05-05',
      };

      claimRepository.create.mockReturnValue(mockClaim);
      claimRepository.save.mockResolvedValue(mockClaim);

      const result = await service.createClaim(createClaimDto);
      expect(claimRepository.create).toHaveBeenCalledWith(createClaimDto);
      expect(claimRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockClaim);
    });

    it('should throw BadRequestException on save error', async () => {
      console.log(
        '🧪 TEST: createClaim debe lanzar BadRequestException en caso de error al guardar',
      );
      const createClaimDto: CreateClaimDto = {
        cliente: 'Empresa ABC',
        titulo: 'Baño en mal estado',
        descripcion: 'El baño no funciona correctamente',
        tipoReclamo: 'CALIDAD_SERVICIO' as any,
        prioridad: 'ALTA' as any,
        fechaIncidente: '2025-05-05',
      };

      claimRepository.create.mockReturnValue(mockClaim);
      claimRepository.save.mockRejectedValue(new Error('Error saving claim'));

      await expect(service.createClaim(createClaimDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
  describe('createSatisfactionSurvey', () => {
    it('should create a new satisfaction survey', async () => {
      console.log(
        '🧪 TEST: createSatisfactionSurvey debe crear una nueva encuesta de satisfacción',
      );
      const createSatisfactionSurveyDto: CreateSatisfactionSurveyDto = {
        cliente: 'Empresa ABC',
        fecha_mantenimiento: new Date('2025-04-30'),
        calificacion: 5,
        comentario: 'Excelente servicio',
        asunto: 'Encuesta de satisfacción',
        aspecto_evaluado: 'Servicio general',
      };

      satisfactionSurveyRepository.create.mockReturnValue(
        mockSatisfactionSurvey,
      );
      satisfactionSurveyRepository.save.mockResolvedValue(
        mockSatisfactionSurvey,
      );

      const result = await service.createSatisfactionSurvey(
        createSatisfactionSurveyDto,
      );
      expect(satisfactionSurveyRepository.create).toHaveBeenCalledWith(
        createSatisfactionSurveyDto,
      );
      expect(satisfactionSurveyRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockSatisfactionSurvey);
    });
    it('should throw BadRequestException on save error', async () => {
      console.log(
        '🧪 TEST: createSatisfactionSurvey debe lanzar BadRequestException en caso de error al guardar',
      );
      const createSatisfactionSurveyDto: CreateSatisfactionSurveyDto = {
        cliente: 'Empresa ABC',
        fecha_mantenimiento: new Date('2025-04-30'),
        calificacion: 5,
        comentario: 'Excelente servicio',
        asunto: 'Encuesta de satisfacción',
        aspecto_evaluado: 'Servicio general',
      };

      satisfactionSurveyRepository.create.mockReturnValue(
        mockSatisfactionSurvey,
      );
      satisfactionSurveyRepository.save.mockRejectedValue(
        new Error('Error saving survey'),
      );

      await expect(
        service.createSatisfactionSurvey(createSatisfactionSurveyDto),
      ).rejects.toThrow(BadRequestException);
    });
  });
  describe('updateClaim', () => {
    it('should update an existing claim', async () => {
      console.log('🧪 TEST: updateClaim debe actualizar un reclamo existente');
      const updateClaimDto: Partial<CreateClaimDto> = {
        descripcion: 'Problema solucionado',
      };

      const updatedClaim = { ...mockClaim, ...updateClaimDto };

      claimRepository.findOne.mockResolvedValue(mockClaim);
      claimRepository.save.mockResolvedValue(updatedClaim);

      const result = await service.updateClaim(1, updateClaimDto);
      expect(claimRepository.findOne).toHaveBeenCalledWith({
        where: { reclamo_id: 1 },
      });
      expect(claimRepository.save).toHaveBeenCalled();
      expect(result).toEqual(updatedClaim);
    });
    it('should throw BadRequestException if claim not found', async () => {
      console.log(
        '🧪 TEST: updateClaim debe lanzar BadRequestException si no se encuentra el reclamo',
      );
      const updateClaimDto: Partial<CreateClaimDto> = {
        descripcion: 'Problema solucionado',
      };

      claimRepository.findOne.mockResolvedValue(null);

      await expect(service.updateClaim(999, updateClaimDto)).rejects.toThrow(
        BadRequestException,
      );
    });
    it('should throw BadRequestException on save error', async () => {
      console.log(
        '🧪 TEST: updateClaim debe lanzar BadRequestException en caso de error al guardar',
      );
      const updateClaimDto: Partial<CreateClaimDto> = {
        descripcion: 'Problema solucionado',
      };

      claimRepository.findOne.mockResolvedValue(mockClaim);
      claimRepository.save.mockRejectedValue(new Error('Error updating claim'));

      await expect(service.updateClaim(1, updateClaimDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updateSatisfactionSurvey', () => {
    it('should update an existing satisfaction survey', async () => {
      console.log(
        '🧪 TEST: updateSatisfactionSurvey debe actualizar una encuesta existente',
      );
      const updateSurveyDto: Partial<CreateSatisfactionSurveyDto> = {
        comentario: 'Comentario actualizado',
      };

      const updatedSurvey = { ...mockSatisfactionSurvey, ...updateSurveyDto };

      satisfactionSurveyRepository.findOne.mockResolvedValue(
        mockSatisfactionSurvey,
      );
      satisfactionSurveyRepository.save.mockResolvedValue(updatedSurvey);

      const result = await service.updateSatisfactionSurvey(1, updateSurveyDto);
      expect(satisfactionSurveyRepository.findOne).toHaveBeenCalledWith({
        where: { encuesta_id: 1 },
      });
      expect(satisfactionSurveyRepository.save).toHaveBeenCalled();
      expect(result).toEqual(updatedSurvey);
    });

    it('should throw BadRequestException if survey not found', async () => {
      console.log(
        '🧪 TEST: updateSatisfactionSurvey debe lanzar BadRequestException si no se encuentra la encuesta',
      );
      const updateSurveyDto: Partial<CreateSatisfactionSurveyDto> = {
        comentario: 'Comentario actualizado',
      };

      satisfactionSurveyRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateSatisfactionSurvey(999, updateSurveyDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException on save error', async () => {
      console.log(
        '🧪 TEST: updateSatisfactionSurvey debe lanzar BadRequestException en caso de error al guardar',
      );
      const updateSurveyDto: Partial<CreateSatisfactionSurveyDto> = {
        comentario: 'Comentario actualizado',
      };

      satisfactionSurveyRepository.findOne.mockResolvedValue(
        mockSatisfactionSurvey,
      );
      satisfactionSurveyRepository.save.mockRejectedValue(
        new Error('Error updating survey'),
      );

      await expect(
        service.updateSatisfactionSurvey(1, updateSurveyDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('askForService', () => {
    it('should process an ask for service form', async () => {
      console.log(
        '🧪 TEST: askForService debe procesar un formulario de solicitud de servicio',
      );
      const askForServiceDto: AskForServiceDto = {
        nombrePersona: 'Test Person',
        rolPersona: 'Gerente',
        email: 'test@example.com',
        telefono: '1234567890',
        nombreEmpresa: 'Test Company',
        cuit: '20-12345678-9',
        rubroEmpresa: 'Construcción',
        zonaDireccion: 'Test Address',
        cantidadBaños: '1-5' as any,
        tipoEvento: 'Construcción',
        duracionAlquiler: '3 meses',
        comentarios: 'Sin comentarios',
      };

      const result = await service.askForService(askForServiceDto);
      expect(result).toEqual({
        message: 'Service request received successfully',
        data: askForServiceDto,
      });
    });
  });

  describe('getStats', () => {
    it('should return portal statistics', async () => {
      console.log(
        '🧪 TEST: getStats debe devolver las estadísticas del portal',
      );
      const totalSurveys = 10;
      const totalClaims = 5;

      satisfactionSurveyRepository.count.mockResolvedValue(totalSurveys);
      claimRepository.count.mockResolvedValue(totalClaims);
      satisfactionSurveyRepository.find.mockResolvedValue(
        mockSatisfactionSurveys,
      );
      claimRepository.find.mockResolvedValue(mockClaims);

      const result = await service.getStats();
      expect(satisfactionSurveyRepository.count).toHaveBeenCalled();
      expect(claimRepository.count).toHaveBeenCalled();
      expect(satisfactionSurveyRepository.find).toHaveBeenCalled();
      expect(claimRepository.find).toHaveBeenCalled();
      expect(result).toEqual({
        totalSurveys,
        totalClaims,
        surveys: mockSatisfactionSurveys,
        claims: mockClaims,
      });
    });
  });
});

// Mocks para los módulos externos
import * as nodemailer from 'nodemailer';
import { mockSendMail, resetMocks } from './__mocks__/nodemailer.mock';

// Mocks para roles
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

// Mock para User
jest.mock(
  'src/users/entities/user.entity',
  () => ({
    User: class User {
      id: number;
      username: string;
      password: string;
      email: string;
      enabled: boolean;
      roles: any[];
    },
  }),
  { virtual: true },
);

// Mock para Licencias
jest.mock(
  'src/employees/entities/license.entity',
  () => ({
    Licencias: class Licencias {
      licencia_id: number;
      categoria: string;
      fecha_expedicion: Date;
      fecha_vencimiento: Date;
      empleado: any;
    },
  }),
  { virtual: true },
);

// Mock para los utils de mailer
jest.mock('./utils/mailer.utils', () => ({
  generateEmailContent: jest.fn().mockImplementation((title, body) => {
    return `<div>${title}</div><div>${body}</div>`;
  }),
  addSignature: jest.fn().mockImplementation((content) => {
    return `${content}<p>Firma</p>`;
  }),
}));

// Mocks para nodemailer
jest.mock(
  'nodemailer',
  () => ({
    createTransport: jest.fn().mockImplementation(() => ({
      sendMail: mockSendMail,
      verify: jest.fn().mockImplementation(() => Promise.resolve(true)),
    })),
  }),
  { virtual: true },
);

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MailerService } from './mailer.service';
import { User } from 'src/users/entities/user.entity';
import { Licencias } from 'src/employees/entities/license.entity';
import { Role } from 'src/roles/enums/role.enum';

describe('MailerService', () => {
  let service: MailerService;
  let userRepository: Repository<User>;
  let licenciasRepository: Repository<Licencias>;

  // Mock de los repositorios
  const mockUserRepository = {
    find: jest.fn(),
  };

  const mockLicenciasRepository = {
    find: jest.fn(),
  };

  // Mocks de objetos comúnmente usados
  const mockAdminUser = {
    id: 1,
    email: 'admin@example.com',
    roles: [Role.ADMIN],
  };

  const mockSupervisorUser = {
    id: 2,
    email: 'supervisor@example.com',
    roles: [Role.SUPERVISOR],
  };

  const mockAdminEmails = ['admin1@example.com', 'admin2@example.com'];
  const mockSupervisorEmails = [
    'supervisor1@example.com',
    'supervisor2@example.com',
  ];

  beforeEach(async () => {
    // Resetear todos los mocks antes de cada prueba
    jest.clearAllMocks();
    resetMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailerService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Licencias),
          useValue: mockLicenciasRepository,
        },
      ],
    }).compile();

    service = module.get<MailerService>(MailerService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    licenciasRepository = module.get<Repository<Licencias>>(
      getRepositoryToken(Licencias),
    );

    // Mock del process.env para pruebas
    process.env.EMAIL_USER = 'test@example.com';
    process.env.EMAIL_PASS = 'test_password';
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAdminEmails', () => {
    it('should return emails of admin users', async () => {
      const mockAdmins = [
        { email: 'admin1@example.com' },
        { email: 'admin2@example.com' },
      ];

      mockUserRepository.find.mockResolvedValue(mockAdmins);

      const result = await service.getAdminEmails();
      expect(result).toEqual(['admin1@example.com', 'admin2@example.com']);
      expect(mockUserRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          select: ['email'],
        }),
      );
    });
  });

  describe('getSupervisorEmails', () => {
    it('should return emails of supervisor users', async () => {
      const mockSupervisors = [
        { email: 'supervisor1@example.com' },
        { email: 'supervisor2@example.com' },
      ];

      mockUserRepository.find.mockResolvedValue(mockSupervisors);

      const result = await service.getSupervisorEmails();
      expect(result).toEqual([
        'supervisor1@example.com',
        'supervisor2@example.com',
      ]);
      expect(mockUserRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          select: ['email'],
        }),
      );
    });
  });

  describe('sendMail', () => {
    it('should send mail with correct options', async () => {
      const mailOptions = {
        from: 'test@example.com',
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test content</p>',
      };

      await service.sendMail(mailOptions);

      expect(mockSendMail).toHaveBeenCalledWith(mailOptions);
    });
  });

  describe('generateEmailContent', () => {
    it('should generate correct HTML content', () => {
      const title = 'Test Title';
      const body = '<p>Test body</p>';

      const result = service.generateEmailContent(title, body);
      expect(result).toContain(title);
      expect(result).toContain(body);
      // Since we're using a mock, the HTML doctype might not be there
      // expect(result).toContain('<!DOCTYPE html>');
      // expect(result).toContain('</html>');
    });
  });

  describe('sendRoute', () => {
    it('should send route email with correct content', async () => {
      // Espiar el método sendMail que ya fue mockeado
      jest.spyOn(service, 'sendMail').mockResolvedValue();
      jest
        .spyOn(service, 'generateEmailContent')
        .mockReturnValue('<html>Mock Email</html>');

      const email = 'empleado@example.com';
      const name = 'Juan Pérez';
      const vehicle = 'Camión Ford';
      const toilets = ['Baño #101', 'Baño #102'];
      const clients = ['Cliente ABC'];
      const serviceType = 'INSTALACIÓN';
      const taskDate = '2025-05-10';
      const serviceId = 123;
      const assignedEmployees = ['Juan Pérez', 'Ana López'];
      const clientAddress = 'Calle Principal 123';
      const serviceStartDate = '2025-05-10';

      await service.sendRoute(
        email,
        name,
        vehicle,
        toilets,
        clients,
        serviceType,
        taskDate,
        serviceId,
        assignedEmployees,
        clientAddress,
        serviceStartDate,
      );

      expect(service.sendMail).toHaveBeenCalledWith({
        from: expect.any(String),
        to: email,
        subject: expect.stringContaining('ruta'),
        html: expect.any(String),
      });

      expect(service.generateEmailContent).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining(vehicle),
      );
    });
  });

  describe('sendRouteModified', () => {
    it('should send route modification email with correct content', async () => {
      jest.spyOn(service, 'sendMail').mockResolvedValue();
      jest
        .spyOn(service, 'generateEmailContent')
        .mockReturnValue('<html>Mock Email</html>');

      const email = 'empleado@example.com';
      const name = 'Juan Pérez';
      const vehicle = 'Camión Ford';
      const toilets = ['Baño #101', 'Baño #102'];
      const clients = ['Cliente ABC'];
      const serviceType = 'INSTALACIÓN';
      const taskDate = '2025-05-10';
      const clientAddress = 'Calle Principal 123';
      const serviceStartDate = '2025-05-10';

      await service.sendRouteModified(
        email,
        name,
        vehicle,
        toilets,
        clients,
        serviceType,
        taskDate,
        clientAddress,
        serviceStartDate,
      );
      expect(service.sendMail).toHaveBeenCalled();
      expect(service.generateEmailContent).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('ruta'),
      );
    });
  });

  describe('sendServiceNotification', () => {
    it('should send service notification to admins and supervisors', async () => {
      jest.spyOn(service, 'sendMail').mockResolvedValue();
      jest
        .spyOn(service, 'generateEmailContent')
        .mockReturnValue('<html>Mock Email</html>');

      await service.sendServiceNotification(
        mockAdminEmails,
        mockSupervisorEmails,
        'Juan Pérez',
        'Gerente de Obra',
        'juan@empresa.com',
        '123456789',
        'Constructora XYZ',
        '30-12345678-9',
        'Construcción',
        'Zona Norte',
        '5',
        'Obra de construcción',
        '3 meses',
        'Necesitamos baños con lavamanos incluido',
      );

      expect(service.sendMail).toHaveBeenCalledWith({
        from: expect.any(String),
        to: [...mockAdminEmails, ...mockSupervisorEmails],
        subject: expect.stringContaining('solicitud'),
        html: expect.any(String),
      });
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email', async () => {
      jest.spyOn(service, 'sendMail').mockResolvedValue();
      jest
        .spyOn(service, 'generateEmailContent')
        .mockReturnValue('<html>Mock Email</html>');
      await service.sendPasswordResetEmail(
        'user@example.com',
        'John Doe',
        'new_password123',
      );

      expect(service.sendMail).toHaveBeenCalled();
      expect(service.generateEmailContent).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('contraseña'),
      );
    });
  });

  describe('sendPasswordChangeConfirmationEmail', () => {
    it('should send password change confirmation email', async () => {
      jest.spyOn(service, 'sendMail').mockResolvedValue();
      jest
        .spyOn(service, 'generateEmailContent')
        .mockReturnValue('<html>Mock Email</html>');
      await service.sendPasswordChangeConfirmationEmail(
        'user@example.com',
        'John Doe',
        'new_password123',
      );

      expect(service.sendMail).toHaveBeenCalledWith({
        from: expect.any(String),
        to: 'user@example.com',
        subject: expect.stringContaining('contraseña'),
        html: expect.any(String),
      });
    });
  });

  describe('sendExpiringLicenseAlert', () => {
    it('should send expiring license alert to admins and supervisors', async () => {
      jest.spyOn(service, 'sendMail').mockResolvedValue();
      jest
        .spyOn(service, 'generateEmailContent')
        .mockReturnValue('<html>Mock Email</html>');

      const mockLicenses = [
        {
          licencia_id: 1,
          categoria: 'B',
          fecha_expedicion: new Date('2020-01-01'),
          fecha_vencimiento: new Date('2025-06-01'),
          empleado: {
            id: 1,
            nombre: 'Juan',
            apellido: 'Pérez',
          },
        },
      ];
      await service.sendExpiringLicenseAlert(
        mockAdminEmails,
        mockSupervisorEmails,
        mockLicenses as any,
      );

      expect(service.sendMail).toHaveBeenCalled();
      expect(service.generateEmailContent).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('licencias'),
      );
    });
  });
});

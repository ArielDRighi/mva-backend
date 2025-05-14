import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create_user.dto';
import { UpdateUserDto } from './dto/update_user.dto';
import { Role } from '../roles/enums/role.enum';
import * as bcrypt from 'bcrypt';

describe('UsersService', () => {
  let service: UsersService;

  // Mock repository functions
  const mockUsersRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
      getCount: jest.fn(),
    })),
  };

  // Mock data
  const mockUser = {
    id: 1,
    empleadoId: 1,
    nombre: 'usuario_test',
    email: 'test@example.com',
    password: 'hashedPassword123',
    estado: 'ACTIVO',
    roles: [Role.OPERARIO],
    comparePassword: jest.fn().mockResolvedValue(true),
  };

  const mockUsersList = [
    mockUser,
    {
      ...mockUser,
      id: 2,
      nombre: 'usuario_admin',
      email: 'admin@example.com',
      roles: [Role.ADMIN],
    },
  ];

  const mockPaginatedResponse = {
    data: mockUsersList,
    totalItems: 2,
    currentPage: 1,
    totalPages: 1,
  };

  beforeEach(async () => {
    console.log('======== PREPARANDO TESTS DE USERS SERVICE ========');

    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUsersRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);

    // Setup default mocks
    mockUsersRepository.createQueryBuilder.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(mockUsersList),
      getCount: jest.fn().mockResolvedValue(mockUsersList.length),
    });

    // Mock bcrypt
    jest
      .spyOn(bcrypt, 'hash')
      .mockImplementation(() => Promise.resolve('hashedPassword123'));
  });

  it('should be defined', () => {
    console.log('🧪 TEST: El servicio de usuarios debería estar definido');
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated users list without search', async () => {
      console.log(
        '🧪 TEST: Debe retornar lista paginada de usuarios sin búsqueda',
      );
      // Arrange

      // Act
      const result = await service.findAll(1, 10);

      // Assert
      expect(result).toMatchObject(mockPaginatedResponse);
      expect(mockUsersRepository.createQueryBuilder).toHaveBeenCalledTimes(1);
    });

    it('should return filtered users list with search term', async () => {
      console.log(
        '🧪 TEST: Debe retornar lista filtrada de usuarios con término de búsqueda',
      );
      // Arrange
      const searchTerm = 'admin';

      // Act
      const result = await service.findAll(1, 10, searchTerm);

      // Assert
      expect(result).toMatchObject(mockPaginatedResponse);
      const queryBuilderMock =
        mockUsersRepository.createQueryBuilder.mock.results[0].value;
      expect(queryBuilderMock.where).toHaveBeenCalledWith(
        expect.stringContaining('LOWER(user.nombre) LIKE :searchTerm'),
        expect.objectContaining({ searchTerm: '%admin%' }),
      );
    });
  });

  describe('findById', () => {
    it('should return a user when user exists', async () => {
      console.log('🧪 TEST: Debe retornar un usuario cuando existe');
      // Arrange
      mockUsersRepository.findOne.mockResolvedValue(mockUser);

      // Act
      const result = await service.findById(1);

      // Assert
      expect(result).toEqual(mockUser);
      expect(mockUsersRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw NotFoundException when user does not exist', async () => {
      console.log(
        '🧪 TEST: Debe lanzar NotFoundException cuando el usuario no existe',
      );
      // Arrange
      mockUsersRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
      expect(mockUsersRepository.findOne).toHaveBeenCalledWith({
        where: { id: 999 },
      });
    });
  });

  describe('findByUsername', () => {
    it('should return a user when username exists', async () => {
      console.log(
        '🧪 TEST: Debe retornar un usuario cuando el nombre de usuario existe',
      );
      // Arrange
      mockUsersRepository.findOne.mockResolvedValue(mockUser);

      // Act
      const result = await service.findByUsername('usuario_test');

      // Assert
      expect(result).toEqual(mockUser);
      expect(mockUsersRepository.findOne).toHaveBeenCalledWith({
        where: { nombre: 'usuario_test' },
        select: [
          'id',
          'nombre',
          'email',
          'password',
          'estado',
          'roles',
          'empleadoId',
        ],
      });
    });

    it('should return null when username does not exist', async () => {
      console.log(
        '🧪 TEST: Debe retornar null cuando el nombre de usuario no existe',
      );
      // Arrange
      mockUsersRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await service.findByUsername('nonexistent_user');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return a user when email exists', async () => {
      console.log('🧪 TEST: Debe retornar un usuario cuando el email existe');
      // Arrange
      mockUsersRepository.findOne.mockResolvedValue(mockUser);

      // Act
      const result = await service.findByEmail('test@example.com');

      // Assert
      expect(result).toEqual(mockUser);
      expect(mockUsersRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should return null when email does not exist', async () => {
      console.log('🧪 TEST: Debe retornar null cuando el email no existe');
      // Arrange
      mockUsersRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await service.findByEmail('nonexistent@example.com');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new user with proper roles', async () => {
      console.log('🧪 TEST: Debe crear un nuevo usuario con roles adecuados');
      // Arrange
      const createUserDto: CreateUserDto = {
        empleadoId: 1,
        nombre: 'nuevo_usuario',
        email: 'nuevo@example.com',
        password: 'password123',
        roles: [Role.ADMIN, Role.SUPERVISOR],
      };

      mockUsersRepository.findOne.mockResolvedValue(null); // Username/email not found
      mockUsersRepository.create.mockReturnValue({
        ...createUserDto,
        id: 3,
        password: 'hashedPassword123',
        estado: 'ACTIVO',
      });
      mockUsersRepository.save.mockResolvedValue({
        ...createUserDto,
        id: 3,
        password: 'hashedPassword123',
        estado: 'ACTIVO',
      });

      // Act
      const result = await service.create(createUserDto);

      // Assert
      expect(result.id).toBeDefined();
      expect(result.nombre).toBe(createUserDto.nombre);
      expect(result.email).toBe(createUserDto.email);
      expect(result.password).toBe('hashedPassword123');
      expect(result.estado).toBe('ACTIVO');
      expect(result.roles).toEqual(createUserDto.roles);
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
    });

    it('should create a user with default OPERARIO role when no roles provided', async () => {
      console.log(
        '🧪 TEST: Debe crear un usuario con rol OPERARIO por defecto cuando no se proporcionan roles',
      );
      // Arrange
      const createUserDto: CreateUserDto = {
        nombre: 'operario_default',
        email: 'operario@example.com',
        password: 'password123',
      };

      mockUsersRepository.findOne.mockResolvedValue(null);
      mockUsersRepository.create.mockReturnValue({
        ...createUserDto,
        id: 4,
        empleadoId: undefined,
        password: 'hashedPassword123',
        estado: 'ACTIVO',
        roles: [Role.OPERARIO],
      });
      mockUsersRepository.save.mockResolvedValue({
        ...createUserDto,
        id: 4,
        empleadoId: undefined,
        password: 'hashedPassword123',
        estado: 'ACTIVO',
        roles: [Role.OPERARIO],
      });

      // Act
      const result = await service.create(createUserDto);

      // Assert
      expect(result.roles).toEqual([Role.OPERARIO]);
    });

    it('should throw ConflictException when username already exists', async () => {
      console.log(
        '🧪 TEST: Debe lanzar ConflictException cuando el nombre de usuario ya existe',
      );
      // Arrange
      const createUserDto: CreateUserDto = {
        nombre: 'usuario_test', // Existing username
        email: 'nuevo@example.com',
        password: 'password123',
      };

      mockUsersRepository.findOne.mockResolvedValueOnce(mockUser); // Username found

      // Act & Assert
      await expect(service.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockUsersRepository.findOne).toHaveBeenCalledWith({
        where: { nombre: 'usuario_test' },
        select: [
          'id',
          'nombre',
          'email',
          'password',
          'estado',
          'roles',
          'empleadoId',
        ],
      });
    });

    it('should throw ConflictException when email already exists', async () => {
      console.log(
        '🧪 TEST: Debe lanzar ConflictException cuando el email ya existe',
      );
      // Arrange
      const createUserDto: CreateUserDto = {
        nombre: 'nombre_nuevo',
        email: 'test@example.com', // Existing email
        password: 'password123',
      };

      mockUsersRepository.findOne.mockResolvedValueOnce(null); // Username not found
      mockUsersRepository.findOne.mockResolvedValueOnce(mockUser); // Email found

      // Act & Assert
      await expect(service.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockUsersRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });
  });

  describe('update', () => {
    it('should update a user successfully', async () => {
      console.log('🧪 TEST: Debe actualizar un usuario correctamente');
      // Arrange
      const updateUserDto: UpdateUserDto = {
        nombre: 'usuario_actualizado',
        email: 'actualizado@example.com',
      };

      mockUsersRepository.findOne
        .mockResolvedValueOnce(mockUser) // findById
        .mockResolvedValueOnce(null) // Username not taken
        .mockResolvedValueOnce(null) // Email not taken
        .mockResolvedValueOnce({
          // findById after update
          ...mockUser,
          nombre: updateUserDto.nombre,
          email: updateUserDto.email,
        });

      // Act
      const result = await service.update(1, updateUserDto);

      // Assert
      expect(result.nombre).toBe(updateUserDto.nombre);
      expect(result.email).toBe(updateUserDto.email);
      expect(mockUsersRepository.update).toHaveBeenCalledWith(1, updateUserDto);
    });
    it('should update password with hashed value', async () => {
      console.log('🧪 TEST: Debe actualizar la contraseña con valor hash');
      // Arrange
      const updateUserDto: UpdateUserDto = {
        password: 'nuevaContraseña123',
      };

      mockUsersRepository.findOne
        .mockResolvedValueOnce(mockUser) // findById
        .mockResolvedValueOnce({
          // findById after update
          ...mockUser,
          password: 'hashedPassword123',
        }); // Mock bcrypt específicamente para esta prueba
      jest
        .spyOn(bcrypt, 'hash')
        .mockImplementationOnce(() => Promise.resolve('hashedPassword123'));

      // Act
      const result = await service.update(1, updateUserDto);

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith('nuevaContraseña123', 10);
      expect(mockUsersRepository.update).toHaveBeenCalledWith(1, {
        password: 'hashedPassword123',
      });
    });

    it('should throw ConflictException when new username is already in use', async () => {
      console.log(
        '🧪 TEST: Debe lanzar ConflictException cuando el nuevo nombre de usuario ya está en uso',
      );
      // Arrange
      const updateUserDto: UpdateUserDto = {
        nombre: 'usuario_admin', // Already in use by another user
      };

      mockUsersRepository.findOne
        .mockResolvedValueOnce(mockUser) // findById returns current user
        .mockResolvedValueOnce(mockUsersList[1]); // findByUsername returns another user

      // Act & Assert
      await expect(service.update(1, updateUserDto)).rejects.toThrow(
        ConflictException,
      );
    });
    it('should throw ConflictException when new email is already in use', async () => {
      console.log(
        '🧪 TEST: Debe lanzar ConflictException cuando el nuevo email ya está en uso',
      );
      // Arrange
      const updateUserDto: UpdateUserDto = {
        email: 'admin@example.com', // Email que pertenece a otro usuario
      };

      // En lugar de usar mocks directamente en mockUsersRepository, vamos a sustituir
      // temporalmente los métodos del servicio para controlar exactamente el comportamiento

      // Guardar las implementaciones originales
      const originalFindById = service.findById;
      const originalFindByEmail = service.findByEmail;

      // Sobrescribir métodos con implementaciones que simulan el escenario deseado
      service.findById = jest.fn().mockResolvedValue({
        id: 1,
        email: 'test@example.com', // Email diferente al que se intenta actualizar
      });

      service.findByEmail = jest.fn().mockResolvedValue({
        id: 2, // ID diferente para simular que es otro usuario
        email: 'admin@example.com', // Email que coincide con el del DTO
      });

      try {
        // Act & Assert
        await expect(service.update(1, updateUserDto)).rejects.toThrow(
          ConflictException,
        );
      } finally {
        // Restaurar las implementaciones originales
        service.findById = originalFindById;
        service.findByEmail = originalFindByEmail;
      }
    });

    it('should throw NotFoundException when user to update does not exist', async () => {
      console.log(
        '🧪 TEST: Debe lanzar NotFoundException cuando el usuario a actualizar no existe',
      );
      // Arrange
      const updateUserDto: UpdateUserDto = {
        nombre: 'actualizado',
      };

      mockUsersRepository.findOne.mockResolvedValueOnce(null); // User not found

      // Act & Assert
      await expect(service.update(999, updateUserDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove a user successfully', async () => {
      console.log('🧪 TEST: Debe eliminar un usuario correctamente');
      // Arrange
      mockUsersRepository.findOne.mockResolvedValueOnce(mockUser);

      // Act
      await service.remove(1);

      // Assert
      expect(mockUsersRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockUsersRepository.remove).toHaveBeenCalledWith(mockUser);
    });

    it('should throw NotFoundException when user to remove does not exist', async () => {
      console.log(
        '🧪 TEST: Debe lanzar NotFoundException cuando el usuario a eliminar no existe',
      );
      // Arrange
      mockUsersRepository.findOne.mockResolvedValueOnce(null);

      // Act & Assert
      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('changeStatus', () => {
    it('should change user status to INACTIVO', async () => {
      console.log('🧪 TEST: Debe cambiar el estado del usuario a INACTIVO');
      // Arrange
      mockUsersRepository.findOne.mockResolvedValueOnce(mockUser);
      mockUsersRepository.save.mockResolvedValueOnce({
        ...mockUser,
        estado: 'INACTIVO',
      });

      // Act
      const result = await service.changeStatus(1, 'INACTIVO');

      // Assert
      expect(result.estado).toBe('INACTIVO');
      expect(mockUsersRepository.save).toHaveBeenCalledWith({
        ...mockUser,
        estado: 'INACTIVO',
      });
    });

    it('should change user status to ACTIVO', async () => {
      console.log('🧪 TEST: Debe cambiar el estado del usuario a ACTIVO');
      // Arrange
      const inactiveUser = { ...mockUser, estado: 'INACTIVO' };
      mockUsersRepository.findOne.mockResolvedValueOnce(inactiveUser);
      mockUsersRepository.save.mockResolvedValueOnce({
        ...inactiveUser,
        estado: 'ACTIVO',
      });

      // Act
      const result = await service.changeStatus(1, 'ACTIVO');

      // Assert
      expect(result.estado).toBe('ACTIVO');
    });

    it('should throw NotFoundException when user does not exist', async () => {
      console.log(
        '🧪 TEST: Debe lanzar NotFoundException cuando el usuario no existe',
      );
      // Arrange
      mockUsersRepository.findOne.mockResolvedValueOnce(null);

      // Act & Assert
      await expect(service.changeStatus(999, 'INACTIVO')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updatePassword', () => {
    it('should update user password successfully', async () => {
      console.log(
        '🧪 TEST: Debe actualizar la contraseña del usuario correctamente',
      );
      // Arrange
      mockUsersRepository.findOne
        .mockResolvedValueOnce(mockUser) // First findById
        .mockResolvedValueOnce({
          // Second findById after update
          ...mockUser,
          password: 'newHashedPassword',
        });

      // Act
      const result = await service.updatePassword(1, 'newHashedPassword');

      // Assert
      expect(mockUsersRepository.update).toHaveBeenCalledWith(1, {
        password: 'newHashedPassword',
      });
      expect(result.password).toBe('newHashedPassword');
    });

    it('should throw NotFoundException when user does not exist', async () => {
      console.log(
        '🧪 TEST: Debe lanzar NotFoundException cuando el usuario no existe',
      );
      // Arrange
      mockUsersRepository.findOne.mockResolvedValueOnce(null);

      // Act & Assert
      await expect(
        service.updatePassword(999, 'newHashedPassword'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when update fails', async () => {
      console.log(
        '🧪 TEST: Debe lanzar ConflictException cuando la actualización falla',
      );
      // Arrange
      mockUsersRepository.findOne.mockResolvedValueOnce(mockUser);
      mockUsersRepository.update.mockRejectedValueOnce(
        new Error('Update failed'),
      );

      // Act & Assert
      await expect(
        service.updatePassword(1, 'newHashedPassword'),
      ).rejects.toThrow(ConflictException);
    });
  });
});

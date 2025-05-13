import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create_user.dto';
import { UpdateUserDto } from './dto/update_user.dto';
import { Role } from '../roles/enums/role.enum';

describe('UsersController', () => {
  let controller: UsersController;

  // Mock data
  const mockUser = {
    id: 1,
    empleadoId: 1,
    nombre: 'usuario_test',
    email: 'test@example.com',
    password: 'hashedPassword123',
    estado: 'ACTIVO',
    roles: [Role.OPERARIO],
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

  // Mock service
  const mockUsersService = {
    create: jest.fn().mockResolvedValue(mockUser),
    findAll: jest.fn().mockResolvedValue(mockPaginatedResponse),
    findById: jest.fn().mockResolvedValue(mockUser),
    update: jest.fn(),
    remove: jest.fn().mockResolvedValue(undefined),
    changeStatus: jest.fn(),
  };

  beforeEach(async () => {
    console.log('======== PREPARANDO TESTS DE USERS CONTROLLER ========');

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);

    // Reset all mocks before each test
    jest.clearAllMocks();

    // Setup default mocks
    mockUsersService.update.mockImplementation((id, dto) =>
      Promise.resolve({
        ...mockUser,
        ...dto,
      }),
    );

    mockUsersService.changeStatus.mockImplementation((id, estado) =>
      Promise.resolve({
        ...mockUser,
        estado,
      }),
    );
  });

  it('should be defined', () => {
    console.log('🧪 TEST: El controlador de usuarios debería estar definido');
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      console.log('🧪 TEST: Debe crear un nuevo usuario');
      // Arrange
      const createUserDto: CreateUserDto = {
        empleadoId: 1,
        nombre: 'nuevo_usuario',
        email: 'nuevo@example.com',
        password: 'password123',
        roles: [Role.OPERARIO],
      };

      // Act
      const result = await controller.create(createUserDto);

      // Assert
      expect(mockUsersService.create).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(mockUser);
    });
  });

  describe('findAll', () => {
    it('should return paginated users without search', async () => {
      console.log('🧪 TEST: Debe retornar usuarios paginados sin búsqueda');
      // Act
      const result = await controller.findAll();

      // Assert
      expect(mockUsersService.findAll).toHaveBeenCalledWith(1, 10, undefined);
      expect(result).toEqual(mockPaginatedResponse);
    });

    it('should return filtered users with search', async () => {
      console.log('🧪 TEST: Debe retornar usuarios filtrados con búsqueda');
      // Arrange
      const page = 2;
      const limit = 5;
      const search = 'admin';

      // Act
      const result = await controller.findAll(page, limit, search);

      // Assert
      expect(mockUsersService.findAll).toHaveBeenCalledWith(
        page,
        limit,
        search,
      );
      expect(result).toEqual(mockPaginatedResponse);
    });
  });

  describe('findById', () => {
    it('should return a user by id', async () => {
      console.log('🧪 TEST: Debe retornar un usuario por ID');
      // Act
      const result = await controller.findById(1);

      // Assert
      expect(mockUsersService.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockUser);
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      console.log('🧪 TEST: Debe actualizar un usuario');
      // Arrange
      const updateUserDto: UpdateUserDto = {
        nombre: 'nombre_actualizado',
        email: 'actualizado@example.com',
      };

      // Act
      const result = await controller.update(1, updateUserDto);

      // Assert
      expect(mockUsersService.update).toHaveBeenCalledWith(1, updateUserDto);
      expect(result).toEqual({
        ...mockUser,
        ...updateUserDto,
      });
    });
  });

  describe('remove', () => {
    it('should remove a user', async () => {
      console.log('🧪 TEST: Debe eliminar un usuario');
      // Act
      await controller.remove(1);

      // Assert
      expect(mockUsersService.remove).toHaveBeenCalledWith(1);
    });
  });

  describe('changeStatus', () => {
    it('should change user status to INACTIVO', async () => {
      console.log('🧪 TEST: Debe cambiar el estado del usuario a INACTIVO');
      // Arrange
      const estado = 'INACTIVO';

      // Act
      const result = await controller.changeStatus(1, estado);

      // Assert
      expect(mockUsersService.changeStatus).toHaveBeenCalledWith(1, estado);
      expect(result.estado).toBe(estado);
    });

    it('should change user status to ACTIVO', async () => {
      console.log('🧪 TEST: Debe cambiar el estado del usuario a ACTIVO');
      // Arrange
      const estado = 'ACTIVO';

      // Act
      const result = await controller.changeStatus(1, estado);

      // Assert
      expect(mockUsersService.changeStatus).toHaveBeenCalledWith(1, estado);
      expect(result.estado).toBe(estado);
    });
  });
});

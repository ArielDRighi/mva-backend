import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create_user.dto';
import { UpdateUserDto } from './dto/update_user.dto';
import * as bcrypt from 'bcrypt';
import { Role } from '../roles/enums/role.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findAll(page = 1, limit = 10, search?: string): Promise<any> {
    const query = this.usersRepository.createQueryBuilder('user');

    if (search) {
      const searchTerm = `%${search.toLowerCase()}%`;

      query.where(
        `LOWER(user.nombre) LIKE :searchTerm
        OR LOWER(user.email) LIKE :searchTerm
        OR LOWER(user.estado) LIKE :searchTerm`,
        { searchTerm },
      );
    }

    query.skip((page - 1) * limit).take(limit);

    const [users, total] = await Promise.all([
      query.getMany(),
      query.getCount(),
    ]);

    return {
      data: users,
      totalItems: total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
    return user;
  }

  async findByUsername(nombre: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { nombre },
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
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Verificar si el username ya existe
    const existingUsername = await this.findByUsername(createUserDto.nombre);
    if (existingUsername) {
      throw new ConflictException('El nombre de usuario ya está en uso');
    }

    // Verificar si el email ya existe
    const existingEmail = await this.findByEmail(createUserDto.email);
    if (existingEmail) {
      throw new ConflictException('El correo electrónico ya está en uso');
    }

    // Encriptar la contraseña
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(createUserDto.password, saltRounds);

    // Crear el nuevo usuario
    const newUser = this.usersRepository.create({
      empleadoId: createUserDto.empleadoId,
      nombre: createUserDto.nombre,
      email: createUserDto.email,
      password: passwordHash,
      estado: 'ACTIVO',
      // Asegúrate de que los roles se asignen correctamente
      roles: createUserDto.roles || [Role.OPERARIO], // Rol por defecto
    });

    return this.usersRepository.save(newUser);
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);

    // Verificar si el username ya está en uso por otro usuario
    if (updateUserDto.nombre && updateUserDto.nombre !== user.nombre) {
      const existingUsername = await this.findByUsername(updateUserDto.nombre);
      if (existingUsername) {
        throw new ConflictException('El nombre de usuario ya está en uso');
      }
    }

    // Verificar si el email ya está en uso por otro usuario
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingEmail = await this.findByEmail(updateUserDto.email);
      if (existingEmail) {
        throw new ConflictException('El correo electrónico ya está en uso');
      }
    }

    // Si hay cambio de contraseña, encriptarla
    if (updateUserDto.password) {
      const saltRounds = 10;
      updateUserDto.password = await bcrypt.hash(
        updateUserDto.password,
        saltRounds,
      );
    }

    // Actualizar el usuario
    await this.usersRepository.update(id, updateUserDto);

    // Retornar el usuario actualizado
    return this.findById(id);
  }

  async remove(id: number): Promise<void> {
    const user = await this.findById(id);
    await this.usersRepository.remove(user);
  }

  async changeStatus(id: number, estado: 'ACTIVO' | 'INACTIVO'): Promise<User> {
    const user = await this.findById(id);
    user.estado = estado;
    return this.usersRepository.save(user);
  }

  async updatePassword(id: number, passwordHash: string) {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
    try {
      await this.usersRepository.update(id, { password: passwordHash });
      const updatedUser = await this.findById(id);
      return updatedUser;
    } catch {
      throw new ConflictException('Error al actualizar la contraseña');
    }
  }
}

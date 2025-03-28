import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { Role } from '../roles/enums/role.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async findById(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
    return user;
  }

  async findByUsername(nombre: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { nombre } });
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
}

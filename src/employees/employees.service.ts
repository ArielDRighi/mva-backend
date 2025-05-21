import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, LessThan, Between } from 'typeorm';
import { Empleado } from './entities/employee.entity';
import { CreateEmployeeDto } from './dto/create_employee.dto';
import { UpdateEmployeeDto } from './dto/update_employee.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Licencias } from './entities/license.entity';
import { CreateLicenseDto } from './dto/create_license.dto';
import { CreateContactEmergencyDto } from './dto/create_contact_emergency.dto';
import { ContactosEmergencia } from './entities/emergencyContacts.entity';
import { UpdateContactEmergencyDto } from './dto/update_contact_emergency.dto';
import { UpdateLicenseDto } from './dto/update_license.dto';
import { ExamenPreocupacional } from './entities/examenPreocupacional.entity';
import { CreateExamenPreocupacionalDto } from './dto/create_examen.dto';
import { UpdateExamenPreocupacionalDto } from './dto/modify_examen.dto';

@Injectable()
export class EmployeesService {
  private readonly logger = new Logger(EmployeesService.name);

  constructor(
    @InjectRepository(Empleado)
    private employeeRepository: Repository<Empleado>,
    @InjectRepository(Licencias)
    private readonly licenciaRepository: Repository<Licencias>,
    @InjectRepository(ContactosEmergencia)
    private readonly emergencyContactRepository: Repository<ContactosEmergencia>,
    @InjectRepository(ExamenPreocupacional)
    private readonly examenPreocupacionalRepository: Repository<ExamenPreocupacional>,
  ) {}

  async create(createEmployeeDto: CreateEmployeeDto): Promise<Empleado> {
    this.logger.log(
      `Creando empleado: ${createEmployeeDto.nombre} ${createEmployeeDto.apellido}`,
    );

    // Verificar si ya existe un empleado con el mismo documento
    const existingDocumento = await this.employeeRepository.findOne({
      where: { documento: createEmployeeDto.documento },
    });

    if (existingDocumento) {
      throw new ConflictException(
        `Ya existe un empleado con el documento ${createEmployeeDto.documento}`,
      );
    }

    // Verificar si ya existe un empleado con el mismo email
    const existingEmail = await this.employeeRepository.findOne({
      where: { email: createEmployeeDto.email },
    });

    if (existingEmail) {
      throw new ConflictException(
        `Ya existe un empleado con el email ${createEmployeeDto.email}`,
      );
    }

    const employee = this.employeeRepository.create(createEmployeeDto);
    return this.employeeRepository.save(employee);
  }

  async findAll(paginationDto: PaginationDto): Promise<any> {
    const { page = 1, limit = 10, search } = paginationDto;

    this.logger.log(
      `Recuperando empleados - Página: ${page}, Límite: ${limit}, Búsqueda: ${search}`,
    );

    const query = this.employeeRepository.createQueryBuilder('empleado');

    if (search) {
      const searchTerms = search.toLowerCase().split(' ');

      // First term uses WHERE
      query.where(
        `LOWER(UNACCENT(empleado.nombre)) LIKE :term
        OR LOWER(UNACCENT(empleado.apellido)) LIKE :term
        OR LOWER(UNACCENT(empleado.documento)) LIKE :term
        OR LOWER(UNACCENT(empleado.cargo)) LIKE :term
        OR LOWER(UNACCENT(empleado.estado)) LIKE :term`,
        { term: `%${searchTerms[0]}%` },
      );

      // Additional terms use AND
      for (let i = 1; i < searchTerms.length; i++) {
        query.andWhere(
          `LOWER(UNACCENT(empleado.nombre)) LIKE :term${i}
          OR LOWER(UNACCENT(empleado.apellido)) LIKE :term${i}
          OR LOWER(UNACCENT(empleado.documento)) LIKE :term${i}
          OR LOWER(UNACCENT(empleado.cargo)) LIKE :term${i}
          OR LOWER(UNACCENT(empleado.estado)) LIKE :term${i}`,
          { [`term${i}`]: `%${searchTerms[i]}%` },
        );
      }
    }

    const [empleados, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: empleados,
      totalItems: total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number): Promise<Empleado> {
    this.logger.log(`Buscando empleado con id: ${id}`);
    const employee = await this.employeeRepository.findOne({
      where: { id },
      relations: [
        'licencia',
        'emergencyContacts',
        'examenesPreocupacionales',
        'talleRopa',
      ],
    });

    if (!employee) {
      throw new NotFoundException(`Empleado con id ${id} no encontrado`);
    }

    return employee;
  }

  async findByDocumento(documento: string): Promise<Empleado> {
    this.logger.log(`Buscando empleado con documento: ${documento}`);
    const employee = await this.employeeRepository.findOne({
      where: { documento },
    });

    if (!employee) {
      throw new NotFoundException(
        `Empleado con documento ${documento} no encontrado`,
      );
    }

    return employee;
  }

  async update(
    id: number,
    updateEmployeeDto: UpdateEmployeeDto,
  ): Promise<Empleado> {
    this.logger.log(`Actualizando empleado con id: ${id}`);
    const employee = await this.findOne(id);

    // Verificar si el documento se está actualizando y si ya existe
    if (
      updateEmployeeDto.documento &&
      updateEmployeeDto.documento !== employee.documento
    ) {
      const existingDocumento = await this.employeeRepository.findOne({
        where: { documento: updateEmployeeDto.documento },
      });

      if (existingDocumento) {
        throw new ConflictException(
          `Ya existe un empleado con el documento ${updateEmployeeDto.documento}`,
        );
      }
    }

    // Verificar si el email se está actualizando y si ya existe
    if (updateEmployeeDto.email && updateEmployeeDto.email !== employee.email) {
      const existingEmail = await this.employeeRepository.findOne({
        where: { email: updateEmployeeDto.email },
      });

      if (existingEmail) {
        throw new ConflictException(
          `Ya existe un empleado con el email ${updateEmployeeDto.email}`,
        );
      }
    }

    Object.assign(employee, updateEmployeeDto);
    return this.employeeRepository.save(employee);
  }

  async remove(id: number): Promise<{ message: string }> {
    this.logger.log(`Eliminando empleado con id: ${id}`);
    const employee = await this.findOne(id);

    // Check if the employee is assigned to any active service
    const employeeWithAssignments = await this.employeeRepository
      .createQueryBuilder('empleado')
      .leftJoinAndSelect(
        'asignacion_recursos',
        'asignacion',
        'asignacion.empleado_id = empleado.id',
      )
      .leftJoinAndSelect(
        'servicios',
        'servicio',
        'asignacion.servicio_id = servicio.servicio_id',
      )
      .where('empleado.id = :id', { id })
      .andWhere('asignacion.empleado_id IS NOT NULL')
      .getOne();

    if (employeeWithAssignments) {
      throw new BadRequestException(
        `El empleado no puede ser eliminado ya que se encuentra asignado a uno o más servicios.`,
      );
    }

    const nombre = `${employee.nombre} ${employee.apellido}`;
    await this.employeeRepository.remove(employee);
    return { message: `Empleado ${nombre} eliminado correctamente` };
  }

  async changeStatus(id: number, estado: string): Promise<Empleado> {
    this.logger.log(`Cambiando estado del empleado ${id} a ${estado}`);
    const employee = await this.findOne(id);
    employee.estado = estado;
    return this.employeeRepository.save(employee);
  }

  async findByCargo(cargo: string): Promise<Empleado[]> {
    this.logger.log(`Buscando empleados con cargo: ${cargo}`);
    return this.employeeRepository.find({
      where: { cargo },
    });
  }
  async createLicencia(
    createLicenseDto: CreateLicenseDto,
    empleadoId: number,
  ): Promise<Licencias> {
    const employee = await this.employeeRepository.findOne({
      where: { id: empleadoId },
      relations: ['licencia'],
    });
    if (!employee) {
      throw new NotFoundException(
        `Empleado con id ${empleadoId} no encontrado`,
      );
    }
    if (!employee.licencia) {
      const licencia = await this.licenciaRepository.create({
        categoria: createLicenseDto.categoria,
        fecha_expedicion: createLicenseDto.fecha_expedicion,
        fecha_vencimiento: createLicenseDto.fecha_vencimiento,
        empleado: employee,
      });
      await this.licenciaRepository.save(licencia);
      const licenciaCreada = await this.licenciaRepository.findOne({
        where: { licencia_id: licencia.licencia_id },
        relations: ['empleado'],
      });
      if (!licenciaCreada) {
        throw new NotFoundException(
          `Licencia con id ${licencia.licencia_id} no encontrada`,
        );
      }
      return licenciaCreada;
    }
    throw new ConflictException(
      `El empleado con id ${empleadoId} ya tiene una licencia asociada`,
    );
  }

  async findLicenciasByEmpleadoId(empleadoId: number): Promise<Empleado> {
    const employee = await this.employeeRepository.findOne({
      where: { id: empleadoId },
      relations: ['licencia'],
    });
    if (!employee) {
      throw new NotFoundException(
        `Empleado con id ${empleadoId} no encontrado`,
      );
    }
    return employee;
  }

  async createEmergencyContact(
    createEmergencyContactDto: CreateContactEmergencyDto,
    empleadoId: number,
  ): Promise<ContactosEmergencia> {
    const employee = await this.employeeRepository.findOne({
      where: { id: empleadoId },
      relations: ['emergencyContacts'],
    });
    if (!employee) {
      throw new NotFoundException(
        `Empleado con id ${empleadoId} no encontrado`,
      );
    }

    const contactoEmergencia = await this.emergencyContactRepository.create({
      nombre: createEmergencyContactDto.nombre,
      apellido: createEmergencyContactDto.apellido,
      parentesco: createEmergencyContactDto.parentesco,
      telefono: createEmergencyContactDto.telefono,
      empleado: employee,
    });
    await this.emergencyContactRepository.save(contactoEmergencia);
    const contact = await this.emergencyContactRepository.findOne({
      where: { id: contactoEmergencia.id },
      relations: ['empleado'],
    });

    if (!contact) {
      throw new NotFoundException(
        `Contacto de emergencia con id ${contactoEmergencia.id} no encontrado`,
      );
    }
    return contact;
  }

  async findLicencias(): Promise<Licencias[]> {
    const licencias = await this.licenciaRepository.find({
      relations: ['empleado'],
    });
    if (!licencias) {
      throw new NotFoundException(`No se encontraron licencias`);
    }
    return licencias;
  }

  async findEmergencyContactsByEmpleadoId(
    empleadoId: number,
  ): Promise<Empleado> {
    const employee = await this.employeeRepository.findOne({
      where: { id: empleadoId },
      relations: ['emergencyContacts'],
    });
    if (!employee) {
      throw new NotFoundException(
        `Empleado con id ${empleadoId} no encontrado`,
      );
    }
    return employee;
  }

  async updateEmergencyContact(
    contactoId: number,
    updateEmergencyContactDto: UpdateContactEmergencyDto,
  ): Promise<ContactosEmergencia> {
    const contactoEmergencia = await this.emergencyContactRepository.findOne({
      where: { id: contactoId },
    });
    if (!contactoEmergencia) {
      throw new NotFoundException(
        `Contacto de emergencia con id ${contactoId} no encontrado`,
      );
    }

    await this.emergencyContactRepository.update(
      contactoId,
      updateEmergencyContactDto,
    );
    const updatedContact = await this.emergencyContactRepository.findOne({
      where: { id: contactoId },
    });
    if (!updatedContact) {
      throw new NotFoundException(
        `Contacto de emergencia con id ${contactoId} no encontrado`,
      );
    }
    return updatedContact;
  }

  async removeEmergencyContact(
    contactoId: number,
  ): Promise<{ message: string }> {
    {
      const contactoEmergencia = await this.emergencyContactRepository.findOne({
        where: { id: contactoId },
      });
      if (!contactoEmergencia) {
        throw new NotFoundException(
          `Contacto de emergencia con id ${contactoId} no encontrado`,
        );
      }
      await this.emergencyContactRepository.remove(contactoEmergencia);
      return { message: `Contacto de emergencia eliminado correctamente` };
    }
  }

  async updateLicencia(
    empleadoId: number,
    updateLicenseDto: UpdateLicenseDto,
  ): Promise<Licencias> {
    const user = await this.employeeRepository.findOne({
      where: { id: empleadoId },
      relations: ['licencia'],
    });
    if (!user?.licencia) {
      throw new NotFoundException(
        `Licencia con id ${user?.licencia.licencia_id} no encontrada`,
      );
    }
    await this.licenciaRepository.update(
      user.licencia.licencia_id,
      updateLicenseDto,
    );
    const updatedLicense = await this.licenciaRepository.findOne({
      where: { licencia_id: user.licencia.licencia_id },
    });
    if (!updatedLicense) {
      throw new NotFoundException(
        `Licencia con id ${user.licencia.licencia_id} no encontrada`,
      );
    }
    return updatedLicense;
  }

  async removeLicencia(licenciaId: number): Promise<{ message: string }> {
    const licencia = await this.licenciaRepository.findOne({
      where: { licencia_id: licenciaId },
    });
    if (!licencia) {
      throw new NotFoundException(
        `Licencia con id ${licenciaId} no encontrada`,
      );
    }
    await this.licenciaRepository.remove(licencia);
    return { message: `Licencia eliminada correctamente` };
  }

  async findLicensesToExpire(): Promise<Licencias[]> {
    const today = new Date();
    const thirtyDaysLater = new Date(
      today.getTime() + 30 * 24 * 60 * 60 * 1000,
    );

    this.logger.log('Buscando licencias que vencen en los próximos 30 días');

    try {
      const licensesToExpire = await this.licenciaRepository.find({
        where: {
          fecha_vencimiento: Between(today, thirtyDaysLater),
        },
        relations: ['empleado'],
      });

      return licensesToExpire;
    } catch (error) {
      this.logger.error(
        `Error al buscar licencias por vencer: ${error.message}`,
      );
      throw new NotFoundException(
        'No se pudieron encontrar licencias por vencer',
      );
    }
  }

  async findExamenesByEmpleadoId(
    empleadoId: number,
  ): Promise<ExamenPreocupacional[]> {
    const employee = await this.employeeRepository.findOne({
      where: { id: empleadoId },
      relations: ['examenesPreocupacionales'],
    });
    if (!employee) {
      throw new NotFoundException(
        `Empleado con id ${empleadoId} no encontrado`,
      );
    }
    if (!employee.examenesPreocupacionales) {
      throw new NotFoundException(
        `El empleado con id ${empleadoId} no tiene exámenes preocupacionales`,
      );
    }
    return employee.examenesPreocupacionales;
  }

  async createExamenPreocupacional(
    createExamenPreocupacionalDto: CreateExamenPreocupacionalDto,
  ): Promise<ExamenPreocupacional> {
    const employee = await this.employeeRepository.findOne({
      where: { id: createExamenPreocupacionalDto.empleado_id },
    });
    if (!employee) {
      throw new NotFoundException(
        `Empleado con id ${createExamenPreocupacionalDto.empleado_id} no encontrado`,
      );
    }
    const examenPreocupacional =
      await this.examenPreocupacionalRepository.create({
        fecha_examen: createExamenPreocupacionalDto.fecha_examen,
        resultado: createExamenPreocupacionalDto.resultado,
        observaciones: createExamenPreocupacionalDto.observaciones,
        realizado_por: createExamenPreocupacionalDto.realizado_por,
        empleado: employee,
      });
    await this.examenPreocupacionalRepository.save(examenPreocupacional);

    const examenCreado = await this.examenPreocupacionalRepository.findOne({
      where: {
        examen_preocupacional_id: examenPreocupacional.examen_preocupacional_id,
      },
      relations: ['empleado'],
    });
    if (!examenCreado) {
      throw new NotFoundException(
        `Examen preocupacional con id ${examenPreocupacional.examen_preocupacional_id} no encontrado`,
      );
    }
    return examenCreado;
  }

  async removeExamenPreocupacional(
    examenId: number,
  ): Promise<{ message: string }> {
    const examen = await this.examenPreocupacionalRepository.findOne({
      where: { examen_preocupacional_id: examenId },
    });
    if (!examen) {
      throw new NotFoundException(
        `Examen preocupacional con id ${examenId} no encontrado`,
      );
    }
    await this.examenPreocupacionalRepository.remove(examen);
    return { message: `Examen preocupacional eliminado correctamente` };
  }

  async updateExamenPreocupacional(
    examenId: number,
    updateExamenPreocupacionalDto: UpdateExamenPreocupacionalDto,
  ): Promise<ExamenPreocupacional> {
    const examen = await this.examenPreocupacionalRepository.findOne({
      where: { examen_preocupacional_id: examenId },
    });
    if (!examen) {
      throw new NotFoundException(
        `Examen preocupacional con id ${examenId} no encontrado`,
      );
    }

    Object.assign(examen, updateExamenPreocupacionalDto);
    await this.examenPreocupacionalRepository.save(examen);
    const updatedExamen = await this.examenPreocupacionalRepository.findOne({
      where: { examen_preocupacional_id: examenId },
    });
    if (!updatedExamen) {
      throw new NotFoundException(
        `Examen preocupacional con id ${examenId} no encontrado`,
      );
    }
    return updatedExamen;
  }

  async getTotalEmployees(): Promise<{
    total: number;
    totalDisponibles: number;
    totalInactivos: number;
  }> {
    const total = await this.employeeRepository.count();
    const totalDisponibles = await this.employeeRepository.count({
      where: { estado: 'DISPONIBLE' },
    });
    const totalInactivos = await this.employeeRepository.count({
      where: { estado: 'INACTIVO' },
    });
    return {
      total,
      totalDisponibles,
      totalInactivos,
    };
  }
}

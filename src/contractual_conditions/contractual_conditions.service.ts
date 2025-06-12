import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CondicionesContractuales,
  EstadoContrato,
} from './entities/contractual_conditions.entity';
import { Repository } from 'typeorm';
import { CreateContractualConditionDto } from './dto/create_contractual_conditions.dto';
import { ModifyCondicionContractualDto } from './dto/modify_contractual_conditions.dto';
import { Cliente } from 'src/clients/entities/client.entity';
import { Pagination } from 'src/common/interfaces/paginations.interface';

@Injectable()
export class ContractualConditionsService {
  constructor(
    @InjectRepository(CondicionesContractuales)
    private contractualConditionsRepository: Repository<CondicionesContractuales>,
    @InjectRepository(Cliente)
    private clientRepository: Repository<Cliente>,
  ) {}

  async getAllContractualConditions(
    page: number = 1,
    limit: number = 10,
    search?: string,
  ): Promise<Pagination<CondicionesContractuales>> {
    // Validamos que los parámetros de paginación sean válidos
    if (page < 1 || limit < 1) {
      throw new Error(
        `Parámetros de paginación inválidos: "page" y "limit" deben ser mayores que 0. Recibido page=${page}, limit=${limit}.`,
      );
    }

    // Creamos el queryBuilder para poder aplicar filtros de búsqueda
    const queryBuilder = this.contractualConditionsRepository
      .createQueryBuilder('condicion')
      .leftJoinAndSelect('condicion.cliente', 'cliente');

    // Aplicamos filtro de búsqueda si se proporciona el parámetro search
    if (search) {
      queryBuilder.where(
        '(condicion.condiciones_especificas LIKE :search OR ' +
          'condicion.tipo_servicio LIKE :search OR ' +
          'cliente.nombre LIKE :search OR ' +
          'cliente.razon_social LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Aplicamos la paginación
    queryBuilder.skip((page - 1) * limit).take(limit);

    // Obtener las condiciones contractuales con paginación y búsqueda
    const [contractualConditions, total] = await queryBuilder.getManyAndCount();

    // Retornar resultados (aunque esté vacío)
    return {
      items: contractualConditions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getContractualConditionById(contractualConditionId: number) {
    const contractualCondition =
      await this.contractualConditionsRepository.findOne({
        where: { condicionContractualId: contractualConditionId },
        relations: ['cliente'],
      });
    if (!contractualCondition) {
      throw new NotFoundException(
        `Ocurrió un error, Condición Contractual con ID: ${contractualConditionId} no encontrada`,
      );
    }
    return contractualCondition;
  }

  async getContractualConditionsByClient(clientId: number) {
    const client = await this.clientRepository.findOne({
      where: { clienteId: clientId },
    });
    if (!client) {
      throw new NotFoundException(`Cliente con ID: ${clientId} no encontrado`);
    }

    // Modificar la consulta para usar las relaciones explícitamente
    const contractualConditions =
      await this.contractualConditionsRepository.find({
        relations: ['cliente'],
        where: {
          cliente: {
            clienteId: clientId,
          },
        },
      });
    if (!contractualConditions || contractualConditions.length === 0) {
      throw new NotFoundException(
        `El cliente con ID: ${clientId} no tiene Condiciones Contractuales`,
      );
    }
    return contractualConditions;
  }

  async createContractualCondition(
    createContractualConditionDto: CreateContractualConditionDto,
  ) {
    const {
      clientId,
      fecha_inicio,
      fecha_fin,
      condiciones_especificas,
      tarifa,
      periodicidad,
      estado,
      tipo_servicio,
      cantidad_banos,
      tarifa_alquiler,
      tarifa_instalacion,
      tarifa_limpieza,
    } = createContractualConditionDto;

    // Validar fechas
    if (fecha_inicio >= fecha_fin) {
      throw new BadRequestException(
        'La fecha de inicio debe ser anterior a la fecha de fin',
      );
    }

    const client = await this.clientRepository.findOne({
      where: { clienteId: clientId },
    });
    if (!client) {
      throw new NotFoundException(`Cliente con ID: ${clientId} no encontrado`);
    }

    const newContractualCondition = this.contractualConditionsRepository.create(
      {
        cliente: client,
        fecha_inicio: fecha_inicio,
        fecha_fin: fecha_fin,
        condiciones_especificas: condiciones_especificas,
        tarifa: tarifa,
        periodicidad: periodicidad,
        estado: estado || EstadoContrato.ACTIVO,
        tipo_servicio: tipo_servicio,
        cantidad_banos: cantidad_banos,
        tarifa_alquiler: tarifa_alquiler,
        tarifa_instalacion: tarifa_instalacion,
        tarifa_limpieza: tarifa_limpieza,
      },
    );

    return await this.contractualConditionsRepository.save(
      newContractualCondition,
    );
  }
  async modifyContractualCondition(
    modifyContractualConditionDto: ModifyCondicionContractualDto,
    id: number,
  ) {
    const contractualCondition =
      await this.contractualConditionsRepository.findOne({
        where: { condicionContractualId: id },
      });
    if (!contractualCondition) {
      throw new NotFoundException(
        `Condición Contractual con ID: ${id} no encontrada`,
      );
    }

    // Validar fechas si se están modificando
    const fechaInicio =
      modifyContractualConditionDto.fecha_inicio ||
      contractualCondition.fecha_inicio;
    const fechaFin =
      modifyContractualConditionDto.fecha_fin || contractualCondition.fecha_fin;

    if (fechaInicio >= fechaFin) {
      throw new BadRequestException(
        'La fecha de inicio debe ser anterior a la fecha de fin',
      );
    }

    await this.contractualConditionsRepository.update(
      id,
      modifyContractualConditionDto,
    );
    const updatedContractualCondition =
      await this.contractualConditionsRepository.findOne({
        where: { condicionContractualId: id },
      });
    return updatedContractualCondition;
  }

  async deleteContractualCondition(id: number) {
    const contractualCondition =
      await this.contractualConditionsRepository.findOne({
        where: { condicionContractualId: id },
      });
    if (!contractualCondition) {
      throw new NotFoundException(
        `Condición Contractual con ID: ${id} no encontrada`,
      );
    }
    await this.contractualConditionsRepository.delete(id);
    return `Condición Contractual con ID ${id} ha sido eliminada`;
  }
}

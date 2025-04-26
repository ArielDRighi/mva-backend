import { Injectable, NotFoundException } from '@nestjs/common';
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
    limit: number = 10
  ): Promise<Pagination<CondicionesContractuales>> {
    // Validamos que los parámetros sean números válidos
    if (page < 1 || limit < 1) {
      throw new Error('Page and limit must be greater than 0');
    }
  
    // Obtener las condiciones contractuales con paginación
    const [contractualConditions, total] = await this.contractualConditionsRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
    });
  
    if (!contractualConditions || contractualConditions.length === 0) {
      throw new NotFoundException(
        'An error occurred while trying to get the Contractual Conditions'
      );
    }
  
    // Retornamos los resultados con información de la paginación
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
        `An error ocurred, Contractual Condition with ID: ${contractualConditionId} not found`,
      );
    }
    return contractualCondition;
  }

  async getContractualConditionsByClient(clientId: number) {
    const client = await this.clientRepository.findOne({
      where: { clienteId: clientId },
    });
    if (!client) {
      throw new NotFoundException(`Client with ID: ${clientId} not found`);
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
        `The client with ID: ${clientId} not have contractual Conditions`,
      );
    }
    return contractualConditions;
  }

  async createContractualCondition(
    createContractualConditionDto: CreateContractualConditionDto,
  ) {
    const {
      clientId,
      tipo_de_contrato,
      fecha_inicio,
      fecha_fin,
      condiciones_especificas,
      tarifa,
      periodicidad,
      estado,
    } = createContractualConditionDto;
    const client = await this.clientRepository.findOne({
      where: { clienteId: clientId },
    });
    if (!client) {
      throw new NotFoundException(`Client with ID: ${clientId} not found`);
    }
    const newContractualCondition = this.contractualConditionsRepository.create(
      {
        cliente: client,
        tipo_de_contrato: tipo_de_contrato,
        fecha_inicio: fecha_inicio,
        fecha_fin: fecha_fin,
        condiciones_especificas: condiciones_especificas,
        tarifa: tarifa,
        periodicidad: periodicidad,
        estado: estado || EstadoContrato.ACTIVO,
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
        `Contractual Condition with ID: ${id} not found`,
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
        `Contractual Condition with ID: ${id} not found`,
      );
    }
    await this.contractualConditionsRepository.delete(id);
    return `Contractual Condition with ID ${id} has been deleted`;
  }
}

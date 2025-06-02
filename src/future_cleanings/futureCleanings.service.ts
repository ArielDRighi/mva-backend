import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FuturasLimpiezas } from './entities/futureCleanings.entity';
import { Repository } from 'typeorm';
import { ModifyFutureCleaningDto } from './dto/modifyFutureCleanings.dto';
import { CreateFutureCleaningDto } from './dto/createFutureCleanings.dto';
import { Cliente } from 'src/clients/entities/client.entity';
import { Service } from 'src/services/entities/service.entity';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class FutureCleaningsService {
  constructor(
    @InjectRepository(FuturasLimpiezas)
    private readonly futurasLimpiezasRepository: Repository<FuturasLimpiezas>,
    @InjectRepository(Cliente)
    private readonly clientRepository: Repository<Cliente>,
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
  ) {}

  async getAll(paginationDto: PaginationDto) {
    const { page = 1, limit = 5 } = paginationDto;

    // Crear query para poder paginar y contar el total
    const query = this.futurasLimpiezasRepository
      .createQueryBuilder('futurasLimpiezas')
      .leftJoinAndSelect('futurasLimpiezas.cliente', 'cliente')
      .leftJoinAndSelect('futurasLimpiezas.servicio', 'servicio')
      .skip((page - 1) * limit)
      .take(limit);

    // Obtener resultados y total de registros
    const [items, total] = await query.getManyAndCount();

    // Retornar objeto de paginación (incluso si está vacío)
    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
  async getById(id: number) {
    const futureCleaning = await this.futurasLimpiezasRepository.findOne({
      where: { id: id },
      relations: ['cliente', 'servicio'],
    });
    if (!futureCleaning) {
      throw new BadRequestException('Limpieza futura no encontrada');
    }
    return futureCleaning;
  }
  async deleteFutureCleaning(id: number) {
    const futureCleaning = await this.futurasLimpiezasRepository.findOne({
      where: { id: id },
    });
    if (!futureCleaning) {
      throw new BadRequestException('Limpieza futura no encontrada');
    }
    await this.futurasLimpiezasRepository.delete(id);
    return { message: 'Limpieza futura eliminada exitosamente' };
  }
  async updateFutureCleaning(id: number, data: ModifyFutureCleaningDto) {
    const futureCleaning = await this.futurasLimpiezasRepository.findOne({
      where: { id: id },
    });
    if (!futureCleaning) {
      throw new BadRequestException('Limpieza futura no encontrada');
    }
    await this.futurasLimpiezasRepository.update(id, {
      isActive: data.isActive,
    });
    return { message: 'Limpieza futura actualizada exitosamente' };
  }

  async createFutureCleaning(data: CreateFutureCleaningDto) {
    const cliente = await this.clientRepository.findOne({
      where: { clienteId: data.clientId },
    });
    if (!cliente) {
      throw new BadRequestException('Cliente no encontrado');
    }
    const service = await this.serviceRepository.findOne({
      where: { id: data.servicioId },
    });
    if (!service) {
      throw new BadRequestException('Servicio no encontrado');
    }
    try {
      const futureCleaning = this.futurasLimpiezasRepository.create({
        cliente: cliente,
        fecha_de_limpieza: data.fecha_de_limpieza,
        isActive: data.isActive,
        servicio: service,
      });
      await this.futurasLimpiezasRepository.save(futureCleaning);
      return futureCleaning;
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Error desconocido ocurrido',
      );
    }
  }
}

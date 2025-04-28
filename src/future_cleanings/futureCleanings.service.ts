import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FuturasLimpiezas } from './entities/futureCleanings.entity';
import { Repository } from 'typeorm';
import { ModifyFutureCleaningDto } from './dto/modifyFutureCleanings.dto';
import { CreateFutureCleaningDto } from './dto/createFutureCleanings.dto';
import { Cliente } from 'src/clients/entities/client.entity';
import { Service } from 'src/services/entities/service.entity';

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
  async getAll() {
    const futureCleanings = await this.futurasLimpiezasRepository.find({
      relations: ['cliente', 'servicio'],
    });
    if (!futureCleanings) {
      throw new BadRequestException('No future cleanings found');
    }
    return futureCleanings;
  }

  async getById(id: number) {
    const futureCleaning = await this.futurasLimpiezasRepository.findOne({
      where: { id: id },
      relations: ['cliente', 'servicio'],
    });
    if (!futureCleaning) {
      throw new BadRequestException('Future cleaning not found');
    }
    return futureCleaning;
  }

  async deleteFutureCleaning(id: number) {
    const futureCleaning = await this.futurasLimpiezasRepository.findOne({
      where: { id: id },
    });
    if (!futureCleaning) {
      throw new BadRequestException('Future cleaning not found');
    }
    await this.futurasLimpiezasRepository.delete(id);
    return { message: 'Future cleaning deleted successfully' };
  }

  async updateFutureCleaning(id: number, data: ModifyFutureCleaningDto) {
    const futureCleaning = await this.futurasLimpiezasRepository.findOne({
      where: { id: id },
    });
    if (!futureCleaning) {
      throw new BadRequestException('Future cleaning not found');
    }
    await this.futurasLimpiezasRepository.update(id, {
      isActive: data.isActive,
    });
    return { message: 'Future cleaning updated successfully' };
  }

  async createFutureCleaning(data: CreateFutureCleaningDto) {
    const cliente = await this.clientRepository.findOne({
      where: { clienteId: data.clientId },
    });
    if (!cliente) {
      throw new BadRequestException('Client not found');
    }
    const service = await this.serviceRepository.findOne({
      where: { id: data.servicioId },
    });
    if (!service) {
      throw new BadRequestException('Service not found');
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
        error instanceof Error ? error.message : 'Unknown error occurred',
      );
    }
  }
}

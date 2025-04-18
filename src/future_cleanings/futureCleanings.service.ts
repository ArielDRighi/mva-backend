import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FuturasLimpiezas } from './entities/futureCleanings.entity';
import { Repository } from 'typeorm';
import { ModifyFutureCleaningDto } from './dto/modifyFutureCleanings.dto';
import { CreateFutureCleaningDto } from './dto/createFutureCleanings.dto';

@Injectable()
export class FutureCleaningsService {
  constructor(
    @InjectRepository(FuturasLimpiezas)
    private readonly futurasLimpiezasRepository: Repository<FuturasLimpiezas>,
  ) {}
  async getAll() {
    const futureCleanings = await this.futurasLimpiezasRepository.find();
    if (!futureCleanings) {
      throw new BadRequestException('No future cleanings found');
    }
    return futureCleanings;
  }

  async getById(id: number) {
    const futureCleaning = await this.futurasLimpiezasRepository.findOne({
      where: { id: id },
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
    try {
      const futureCleaning = await this.futurasLimpiezasRepository.create(data);
      await this.futurasLimpiezasRepository.save(futureCleaning);
      return futureCleaning;
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Unknown error occurred',
      );
    }
  }
}

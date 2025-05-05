import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateRopaTallesDto } from './dto/CreateRopaTalles.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { RopaTalles } from './entities/clothing.entity';
import { Repository } from 'typeorm';
import { Empleado } from 'src/employees/entities/employee.entity';
import { UpdateRopaTallesDto } from './dto/updateRopaTalles.dto';

@Injectable()
export class ClothingService {
  constructor(
    @InjectRepository(RopaTalles)
    private readonly tallesRepository: Repository<RopaTalles>,
    @InjectRepository(Empleado)
    private readonly empleadoRepository: Repository<Empleado>,
  ) {}
  async createClothingSpecs(
    talles: CreateRopaTallesDto,
    empleadoId: number,
  ): Promise<RopaTalles> {
    const empleado = await this.empleadoRepository.findOne({
      where: { id: empleadoId },
    });

    if (!empleado) {
      throw new BadRequestException('Empleado no encontrado');
    }

    const ropaTalles = this.tallesRepository.create({
      ...talles,
      empleado,
    });

    return this.tallesRepository.save(ropaTalles);
  }

  async getClothingSpecs(empleadoId: number): Promise<RopaTalles> {
    const talles = await this.tallesRepository.findOne({
      where: { empleado: { id: empleadoId } },
      relations: ['empleado'],
    });
    if (!talles) {
      throw new BadRequestException('Talles no encontrados');
    }
    return talles;
  }

  async getAllClothingSpecs(): Promise<RopaTalles[]> {
    const talles = await this.tallesRepository.find({
      relations: ['empleado'],
    });
    if (!talles) {
      throw new BadRequestException('Talles no encontrados');
    }
    return talles;
  }

  async updateClothingSpecs(
    talles: UpdateRopaTallesDto,
    empleadoId: number,
  ): Promise<RopaTalles> {
    const empleado = await this.empleadoRepository.findOne({
      where: { id: empleadoId },
    });

    if (!empleado) {
      throw new BadRequestException('Empleado no encontrado');
    }

    const ropaTalles = await this.tallesRepository.findOne({
      where: { empleado: { id: empleadoId } },
    });

    if (!ropaTalles) {
      throw new BadRequestException('Talles no encontrados');
    }

    Object.assign(ropaTalles, talles);

    return this.tallesRepository.save(ropaTalles);
  }

  async deleteClothingSpecs(empleadoId: number): Promise<{ message: string }> {
    const empleado = await this.empleadoRepository.findOne({
      where: { id: empleadoId },
    });

    if (!empleado) {
      throw new BadRequestException('Empleado no encontrado');
    }

    const ropaTalles = await this.tallesRepository.findOne({
      where: { empleado: { id: empleadoId } },
    });

    if (!ropaTalles) {
      throw new BadRequestException('Talles no encontrados');
    }

    this.tallesRepository.remove(ropaTalles);

    return { message: 'Talles eliminados correctamente' };
  }
}

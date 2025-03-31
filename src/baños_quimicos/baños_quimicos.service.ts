import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateBañosQuimicoDto } from './dto/create-baños_quimico.dto';
import { UpdateBañosQuimicoDto } from './dto/update-baños_quimico.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { BañosQuimico } from './entities/baños_quimico.entity';
import { Repository } from 'typeorm';

@Injectable()
export class BañosQuimicosService {
  constructor(
    @InjectRepository(BañosQuimico)
    private bañosQuimicosRepository: Repository<BañosQuimico>,
  ) {}

  // Método para crear un baño químico
  async create(createBañosQuimicoDto: CreateBañosQuimicoDto): Promise<BañosQuimico> {
    const nuevoBaño = this.bañosQuimicosRepository.create(createBañosQuimicoDto);
    return await this.bañosQuimicosRepository.save(nuevoBaño);
  }

  async findAll(): Promise<BañosQuimico[]> {
    return await this.bañosQuimicosRepository.find();
  }

  async findById(id: number): Promise<BañosQuimico> {
    const baño = await this.bañosQuimicosRepository.findOne({ where: { baño_id: id } });

    if (!baño) {
      throw new NotFoundException(`Baño químico con ID ${id} no encontrado`);
    }

    return baño;
  }

  async update(id: number, updateBañosQuimicoDto: UpdateBañosQuimicoDto): Promise<BañosQuimico> {
    const baño = await this.bañosQuimicosRepository.findOne({ where: { baño_id: id } });

    if (!baño) {
      throw new NotFoundException(`Baño químico con ID ${id} no encontrado`);
    }

    // Actualizamos los campos del baño con los nuevos valores
    Object.assign(baño, updateBañosQuimicoDto);

    return this.bañosQuimicosRepository.save(baño);
  }

  async remove(id: number): Promise<void> {
    const baño = await this.bañosQuimicosRepository.findOne({ where: { baño_id: id } });

    if (!baño) {
      throw new NotFoundException(`Baño químico con ID ${id} no encontrado`);
    }

    await this.bañosQuimicosRepository.remove(baño);
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateMantenimientoBañoDto } from './dto/update-mantenimiento_baño.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { MantenimientoBaño } from './entities/mantenimiento_baño.entity';
import { BañosQuimico } from 'src/baños_quimicos/entities/baños_quimico.entity';
import { Repository } from 'typeorm';
import { CreateMantenimientoBañoDto } from './dto/create-mantenimiento_baño.dto';

@Injectable()
export class MantenimientoBañoService {
  constructor(
    @InjectRepository(MantenimientoBaño)
    private mantenimientoRepository: Repository<MantenimientoBaño>,
    @InjectRepository(BañosQuimico)
    private bañosQuimicosRepository: Repository<BañosQuimico>,
  ) {}

  // Método para crear un nuevo mantenimiento de baño
  async create(createMantenimientoBañoDto: CreateMantenimientoBañoDto): Promise<MantenimientoBaño> {
    // Verificamos si el baño existe
    const baño = await this.bañosQuimicosRepository.findOne({ where: { baño_id: createMantenimientoBañoDto.baño_id } });

    if (!baño) {
      throw new NotFoundException(`Baño con ID ${createMantenimientoBañoDto.baño_id} no encontrado`);
    }

    // Creamos el nuevo objeto de mantenimiento
    const mantenimiento = this.mantenimientoRepository.create({
      ...createMantenimientoBañoDto,
      baño, // Relacionamos el baño con el mantenimiento
    });

    return await this.mantenimientoRepository.save(mantenimiento);
  }
  async findAll(): Promise<MantenimientoBaño[]> {
    return await this.mantenimientoRepository.find({
      relations: ['baño'], // Aseguramos que se incluya la relación con la entidad BañosQuimico
    });
  }

  async findById(mantenimiento_id: number): Promise<MantenimientoBaño> {
    const mantenimiento = await this.mantenimientoRepository.findOne({
      where: { mantenimiento_id },
      relations: ['baño'], // Incluimos la relación con BañosQuimico
    });

    if (!mantenimiento) {
      throw new NotFoundException(`Mantenimiento con ID ${mantenimiento_id} no encontrado`);
    }

    return mantenimiento;
  }

  async update(
    mantenimiento_id: number,
    updateMantenimientoBañoDto: UpdateMantenimientoBañoDto,
  ): Promise<MantenimientoBaño> {
    // Verificamos si el mantenimiento existe
    const mantenimiento = await this.mantenimientoRepository.findOne({
      where: { mantenimiento_id },
      relations: ['baño'], // Incluimos la relación con BañosQuimico
    });

    if (!mantenimiento) {
      throw new NotFoundException(`Mantenimiento con ID ${mantenimiento_id} no encontrado`);
    }

    // Verificamos si el baño existe
    const baño = await this.bañosQuimicosRepository.findOne({
      where: { baño_id: updateMantenimientoBañoDto.baño_id },
    });

    if (!baño) {
      throw new NotFoundException(`Baño con ID ${updateMantenimientoBañoDto.baño_id} no encontrado`);
    }

    // Usamos Object.assign para actualizar el mantenimiento con los nuevos datos
    Object.assign(mantenimiento, updateMantenimientoBañoDto);
    mantenimiento.baño = baño; // Asignamos el baño actualizado

    // Guardamos el mantenimiento actualizado en la base de datos
    return await this.mantenimientoRepository.save(mantenimiento);
  }

  async delete(mantenimiento_id: number): Promise<void> {
    // Verificamos si el mantenimiento existe
    const mantenimiento = await this.mantenimientoRepository.findOne({
      where: { mantenimiento_id },
    });

    if (!mantenimiento) {
      throw new NotFoundException(`Mantenimiento con ID ${mantenimiento_id} no encontrado`);
    }

    // Procedemos a eliminar el mantenimiento
    await this.mantenimientoRepository.delete(mantenimiento_id);
  }
}

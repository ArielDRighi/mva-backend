import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateBañosQuimicoDto } from './dto/create-baños_quimico.dto';
import { UpdateBañosQuimicoDto } from './dto/update-baños_quimico.dto';
import { FilterBañosQuimicoDto } from './dto/filter-baños_quimico.dto';
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
  async create(
    createBañosQuimicoDto: CreateBañosQuimicoDto,
  ): Promise<BañosQuimico> {
    const nuevoBaño = this.bañosQuimicosRepository.create(
      createBañosQuimicoDto,
    );
    return await this.bañosQuimicosRepository.save(nuevoBaño);
  }

  async findAll(): Promise<BañosQuimico[]> {
    return await this.bañosQuimicosRepository.find();
  }

  async findAllWithFilters(
    filterDto: FilterBañosQuimicoDto,
  ): Promise<BañosQuimico[]> {
    const query = this.bañosQuimicosRepository.createQueryBuilder('baño');

    if (filterDto.estado) {
      query.andWhere('baño.estado = :estado', { estado: filterDto.estado });
    }

    if (filterDto.modelo) {
      query.andWhere('baño.modelo LIKE :modelo', {
        modelo: `%${filterDto.modelo}%`,
      });
    }

    if (filterDto.codigoInterno) {
      query.andWhere('baño.codigo_interno LIKE :codigoInterno', {
        codigoInterno: `%${filterDto.codigoInterno}%`,
      });
    }

    if (filterDto.fechaDesde) {
      query.andWhere('baño.fecha_adquisicion >= :fechaDesde', {
        fechaDesde: filterDto.fechaDesde,
      });
    }

    if (filterDto.fechaHasta) {
      query.andWhere('baño.fecha_adquisicion <= :fechaHasta', {
        fechaHasta: filterDto.fechaHasta,
      });
    }

    return await query.getMany();
  }

  async findById(id: number): Promise<BañosQuimico> {
    const baño = await this.bañosQuimicosRepository.findOne({
      where: { baño_id: id },
    });

    if (!baño) {
      throw new NotFoundException(`Baño químico con ID ${id} no encontrado`);
    }

    return baño;
  }

  async update(
    id: number,
    updateBañosQuimicoDto: UpdateBañosQuimicoDto,
  ): Promise<BañosQuimico> {
    const baño = await this.bañosQuimicosRepository.findOne({
      where: { baño_id: id },
    });

    if (!baño) {
      throw new NotFoundException(`Baño químico con ID ${id} no encontrado`);
    }

    // Actualizamos los campos del baño con los nuevos valores
    Object.assign(baño, updateBañosQuimicoDto);

    return this.bañosQuimicosRepository.save(baño);
  }

  async remove(id: number): Promise<void> {
    const baño = await this.bañosQuimicosRepository.findOne({
      where: { baño_id: id },
    });

    if (!baño) {
      throw new NotFoundException(`Baño químico con ID ${id} no encontrado`);
    }

    await this.bañosQuimicosRepository.remove(baño);
  }

  async getMantenimientosStats(id: number): Promise<any> {
    const baño = await this.bañosQuimicosRepository.findOne({
      where: { baño_id: id },
      relations: ['mantenimientos'],
    });

    if (!baño) {
      throw new NotFoundException(`Baño químico con ID ${id} no encontrado`);
    }

    // Calcular estadísticas
    const totalMantenimientos = baño.mantenimientos.length;
    const costoTotal = baño.mantenimientos.reduce((sum, m) => sum + m.costo, 0);
    const ultimoMantenimiento = baño.mantenimientos.sort(
      (a, b) =>
        new Date(b.fecha_mantenimiento).getTime() -
        new Date(a.fecha_mantenimiento).getTime(),
    )[0];

    return {
      totalMantenimientos,
      costoTotal,
      ultimoMantenimiento: ultimoMantenimiento
        ? {
            fecha: ultimoMantenimiento.fecha_mantenimiento,
            tipo: ultimoMantenimiento.tipo_mantenimiento,
            tecnico: ultimoMantenimiento.tecnico_responsable,
          }
        : null,
      diasDesdeUltimoMantenimiento: ultimoMantenimiento
        ? Math.floor(
            (new Date().getTime() -
              new Date(ultimoMantenimiento.fecha_mantenimiento).getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : null,
    };
  }
}

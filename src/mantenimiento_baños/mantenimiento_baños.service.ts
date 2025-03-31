import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateMantenimientoBañoDto } from './dto/update-mantenimiento_baño.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { MantenimientoBaño } from './entities/mantenimiento_baño.entity';
import { BañosQuimico } from 'src/baños_quimicos/entities/baños_quimico.entity';
import { Repository } from 'typeorm';
import { CreateMantenimientoBañoDto } from './dto/create-mantenimiento_baño.dto';
import { FilterMantenimientoBañoDto } from './dto/filter-mantenimiento_baño.dto';

@Injectable()
export class MantenimientoBañoService {
  constructor(
    @InjectRepository(MantenimientoBaño)
    private mantenimientoRepository: Repository<MantenimientoBaño>,
    @InjectRepository(BañosQuimico)
    private bañosQuimicosRepository: Repository<BañosQuimico>,
  ) {}

  // Método para crear un nuevo mantenimiento de baño
  async create(
    createMantenimientoBañoDto: CreateMantenimientoBañoDto,
  ): Promise<MantenimientoBaño> {
    // Verificamos si el baño existe
    const baño = await this.bañosQuimicosRepository.findOne({
      where: { baño_id: createMantenimientoBañoDto.baño_id },
    });

    if (!baño) {
      throw new NotFoundException(
        `Baño con ID ${createMantenimientoBañoDto.baño_id} no encontrado`,
      );
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
      throw new NotFoundException(
        `Mantenimiento con ID ${mantenimiento_id} no encontrado`,
      );
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
      throw new NotFoundException(
        `Mantenimiento con ID ${mantenimiento_id} no encontrado`,
      );
    }

    // Verificamos si el baño existe
    const baño = await this.bañosQuimicosRepository.findOne({
      where: { baño_id: updateMantenimientoBañoDto.baño_id },
    });

    if (!baño) {
      throw new NotFoundException(
        `Baño con ID ${updateMantenimientoBañoDto.baño_id} no encontrado`,
      );
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
      throw new NotFoundException(
        `Mantenimiento con ID ${mantenimiento_id} no encontrado`,
      );
    }

    // Procedemos a eliminar el mantenimiento
    await this.mantenimientoRepository.delete(mantenimiento_id);
  }

  async findAllWithFilters(
    filterDto: FilterMantenimientoBañoDto,
  ): Promise<MantenimientoBaño[]> {
    const query = this.mantenimientoRepository
      .createQueryBuilder('mantenimiento')
      .leftJoinAndSelect('mantenimiento.baño', 'baño');

    if (filterDto.baño_id) {
      query.andWhere('baño.baño_id = :baño_id', { baño_id: filterDto.baño_id });
    }

    if (filterDto.tipo_mantenimiento) {
      query.andWhere('mantenimiento.tipo_mantenimiento LIKE :tipo', {
        tipo: `%${filterDto.tipo_mantenimiento}%`,
      });
    }

    if (filterDto.tecnico_responsable) {
      query.andWhere('mantenimiento.tecnico_responsable LIKE :tecnico', {
        tecnico: `%${filterDto.tecnico_responsable}%`,
      });
    }

    if (filterDto.fechaDesde) {
      query.andWhere('mantenimiento.fecha_mantenimiento >= :fechaDesde', {
        fechaDesde: filterDto.fechaDesde,
      });
    }

    if (filterDto.fechaHasta) {
      query.andWhere('mantenimiento.fecha_mantenimiento <= :fechaHasta', {
        fechaHasta: filterDto.fechaHasta,
      });
    }

    return await query.getMany();
  }

  async getMantenimientosStats(baño_id: number): Promise<any> {
    const mantenimientos = await this.mantenimientoRepository.find({
      where: { baño: { baño_id } },
      relations: ['baño'],
    });

    if (mantenimientos.length === 0) {
      throw new NotFoundException(
        `No se encontraron mantenimientos para el baño con ID ${baño_id}`,
      );
    }

    // Calcular estadísticas
    const totalMantenimientos = mantenimientos.length;
    const costoTotal = mantenimientos.reduce((sum, m) => sum + m.costo, 0);
    const costoPromedio = costoTotal / totalMantenimientos;

    // Agrupar por tipo de mantenimiento
    const tiposMantenimiento = mantenimientos.reduce<Record<string, number>>(
      (acc, m) => {
        acc[m.tipo_mantenimiento] = (acc[m.tipo_mantenimiento] || 0) + 1;
        return acc;
      },
      {},
    );

    return {
      totalMantenimientos,
      costoTotal,
      costoPromedio,
      tiposMantenimiento,
      ultimoMantenimiento: mantenimientos.sort(
        (a, b) =>
          new Date(b.fecha_mantenimiento).getTime() -
          new Date(a.fecha_mantenimiento).getTime(),
      )[0],
    };
  }
}

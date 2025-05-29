import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateRopaTallesDto } from './dto/CreateRopaTalles.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { RopaTalles } from './entities/clothing.entity';
import { Repository } from 'typeorm';
import { Empleado } from 'src/employees/entities/employee.entity';
import { UpdateRopaTallesDto } from './dto/updateRopaTalles.dto';
import { Response } from 'express';
import * as ExcelJS from 'exceljs';

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

  async getAllClothingSpecs(
    page: number = 1,
    limit: number = 10,
    search: string = '',
  ): Promise<{
    data: RopaTalles[];
    totalItems: number;
    currentPage: number;
    totalPages: number;
  }> {
    try {
      const queryBuilder = this.tallesRepository
        .createQueryBuilder('ropaTalles')
        .leftJoinAndSelect('ropaTalles.empleado', 'empleado');

      if (search) {
        const searchTerms = search.toLowerCase().split(' ');

        queryBuilder.where(
          `LOWER(empleado.nombre) ILIKE :term0
  OR LOWER(empleado.apellido) ILIKE :term0
  OR LOWER(empleado.documento) ILIKE :term0
  OR LOWER(CAST(ropaTalles.calzado_talle AS TEXT)) ILIKE :term0
  OR LOWER(CAST(ropaTalles.pantalon_talle AS TEXT)) ILIKE :term0
  OR LOWER(CAST(ropaTalles.camisa_talle AS TEXT)) ILIKE :term0`,
          { term0: `%${searchTerms[0]}%` },
        );

        // Términos adicionales con AND
        for (let i = 1; i < searchTerms.length; i++) {
          queryBuilder.andWhere(
            `LOWER(UNACCENT(empleado.nombre)) LIKE :term${i}
          OR LOWER(UNACCENT(empleado.apellido)) LIKE :term${i}
          OR LOWER(UNACCENT(empleado.documento)) LIKE :term${i}
          OR LOWER(UNACCENT(CAST(ropaTalles.calzado_talle AS TEXT))) LIKE :term${i}
          OR LOWER(UNACCENT(CAST(ropaTalles.pantalon_talle AS TEXT))) LIKE :term${i}
          OR LOWER(UNACCENT(CAST(ropaTalles.camisa_talle AS TEXT))) LIKE :term${i}`,
            { [`term${i}`]: `%${searchTerms[i]}%` },
          );
        }
      }

      queryBuilder.skip((page - 1) * limit).take(limit);

      const [data, totalItems] = await queryBuilder.getManyAndCount();

      return {
        data,
        totalItems,
        currentPage: page,
        totalPages: Math.ceil(totalItems / limit),
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      throw new BadRequestException('Error al obtener talles: ' + errorMessage);
    }
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

    await this.tallesRepository.remove(ropaTalles);

    return { message: 'Talles eliminados correctamente' };
  }
  async exportToExcel(res: Response): Promise<void> {
    // 1. Obtener todos los registros con empleado
    const specs = await this.tallesRepository.find({
      relations: ['empleado'],
    });

    // 2. Crear un workbook y hoja
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Talles Ropa');

    // 3. Definir columnas (modificalo según campos que tengas)
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Empleado', key: 'empleado', width: 30 },
      { header: 'Calzado', key: 'calzado_talle', width: 10 },
      { header: 'Pantalón', key: 'pantalon_talle', width: 10 },
      { header: 'Camisa', key: 'camisa_talle', width: 10 },
      { header: 'Campera BigNort', key: 'campera_bigNort_talle', width: 15 },
      { header: 'Piel BigNort', key: 'pielBigNort_talle', width: 15 },
      { header: 'Medias', key: 'medias_talle', width: 10 },
      {
        header: 'Pantalón Térmico BigNort',
        key: 'pantalon_termico_bigNort_talle',
        width: 20,
      },
      {
        header: 'Campera Polar BigNort',
        key: 'campera_polar_bigNort_talle',
        width: 20,
      },
      { header: 'Mameluco', key: 'mameluco_talle', width: 10 },
      { header: 'Fecha Creación', key: 'createdAt', width: 20 },
      { header: 'Fecha Actualización', key: 'updatedAt', width: 20 },
    ];

    // 4. Agregar filas
    specs.forEach((spec) => {
      worksheet.addRow({
        id: spec.id,
        empleado: spec.empleado
          ? `${spec.empleado.nombre} ${spec.empleado.apellido}`
          : 'Sin empleado',
        calzado_talle: spec.calzado_talle,
        pantalon_talle: spec.pantalon_talle,
        camisa_talle: spec.camisa_talle,
        campera_bigNort_talle: spec.campera_bigNort_talle,
        pielBigNort_talle: spec.pielBigNort_talle,
        medias_talle: spec.medias_talle,
        pantalon_termico_bigNort_talle: spec.pantalon_termico_bigNort_talle,
        campera_polar_bigNort_talle: spec.campera_polar_bigNort_talle,
        mameluco_talle: spec.mameluco_talle,
        createdAt: spec.createdAt
          ? spec.createdAt.toISOString().slice(0, 19).replace('T', ' ')
          : '',
        updatedAt: spec.updatedAt
          ? spec.updatedAt.toISOString().slice(0, 19).replace('T', ' ')
          : '',
      });
    });

    // 5. Preparar respuesta para descarga
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=talles_ropa.xlsx',
    );

    // 6. Escribir el archivo en la respuesta
    await workbook.xlsx.write(res);

    // 7. Finalizar la respuesta
    res.end();
  }
}

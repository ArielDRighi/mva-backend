import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateRopaTallesDto } from './dto/CreateRopaTalles.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { RopaTalles } from './entities/clothing.entity';
import { Repository } from 'typeorm';
import { Empleado } from 'src/employees/entities/employee.entity';
import { UpdateRopaTallesDto } from './dto/updateRopaTalles.dto';
import { Workbook } from 'exceljs';
import { Response } from 'express';


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
  async exportToExcel(res: Response): Promise<void> {
    const specs = await this.tallesRepository.find({
      relations: ['empleado'],
    });

    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Talles');

    // Encabezados
    worksheet.columns = [
      { header: 'Empleado ID', key: 'empleadoId', width: 15 },
      { header: 'Nombre Empleado', key: 'nombreEmpleado', width: 25 },
      { header: 'Calzado', key: 'calzado_talle', width: 10 },
      { header: 'Pantalón', key: 'pantalon_talle', width: 10 },
      { header: 'Camisa', key: 'camisa_talle', width: 10 },
      { header: 'Campera BigNort', key: 'campera_bigNort_talle', width: 18 },
      { header: 'Piel BigNort', key: 'pielBigNort_talle', width: 15 },
      { header: 'Medias', key: 'medias_talle', width: 10 },
      { header: 'Pantalón térmico BigNort', key: 'pantalon_termico_bigNort_talle', width: 25 },
      { header: 'Campera polar BigNort', key: 'campera_polar_bigNort_talle', width: 25 },
      { header: 'Mameluco', key: 'mameluco_talle', width: 15 },
    ];

    // Agregar filas
    specs.forEach((item) => {
      worksheet.addRow({
        empleadoId: item.empleado?.id,
        nombreEmpleado: item.empleado?.nombre || '',
        calzado_talle: item.calzado_talle,
        pantalon_talle: item.pantalon_talle,
        camisa_talle: item.camisa_talle,
        campera_bigNort_talle: item.campera_bigNort_talle,
        pielBigNort_talle: item.pielBigNort_talle,
        medias_talle: item.medias_talle,
        pantalon_termico_bigNort_talle: item.pantalon_termico_bigNort_talle,
        campera_polar_bigNort_talle: item.campera_polar_bigNort_talle,
        mameluco_talle: item.mameluco_talle,
      });
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', 'attachment; filename=talles.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  }
}

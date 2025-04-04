import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateToiletMaintenanceDto } from './dto/update_toilet_maintenance.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ToiletMaintenance } from './entities/toilet_maintenance.entity';
import { ChemicalToilet } from '../chemical_toilets/entities/chemical_toilet.entity';
import { Repository } from 'typeorm';
import { CreateToiletMaintenanceDto } from './dto/create_toilet_maintenance.dto';
import { FilterToiletMaintenanceDto } from './dto/filter_toilet_maintenance.dto';
import { ContractualConditionsService } from 'src/contractual_conditions/contractual_conditions.service';
import { Periodicidad } from 'src/contractual_conditions/entities/contractual_conditions.entity';

@Injectable()
export class ToiletMaintenanceService {
  constructor(
    @InjectRepository(ToiletMaintenance)
    private maintenanceRepository: Repository<ToiletMaintenance>,
    @InjectRepository(ChemicalToilet)
    private toiletsRepository: Repository<ChemicalToilet>,
    private contractualConditionsService: ContractualConditionsService,
  ) {}

  // Método para crear un nuevo mantenimiento de baño
  async create(
    createMaintenanceDto: CreateToiletMaintenanceDto,
  ): Promise<ToiletMaintenance> {
    // Verificamos si el baño existe
    const toilet = await this.toiletsRepository.findOne({
      where: { baño_id: createMaintenanceDto.baño_id },
    });

    if (!toilet) {
      throw new NotFoundException(
        `Baño con ID ${createMaintenanceDto.baño_id} no encontrado`,
      );
    }

    // Creamos el nuevo objeto de mantenimiento
    const maintenance = this.maintenanceRepository.create({
      ...createMaintenanceDto,
      toilet, // Relacionamos el baño con el mantenimiento
    });

    return await this.maintenanceRepository.save(maintenance);
  }

  async findAll(): Promise<ToiletMaintenance[]> {
    return await this.maintenanceRepository.find({
      relations: ['toilet'], // Aseguramos que se incluya la relación con la entidad ChemicalToilet
    });
  }

  async findById(mantenimiento_id: number): Promise<ToiletMaintenance> {
    const maintenance = await this.maintenanceRepository.findOne({
      where: { mantenimiento_id },
      relations: ['toilet'], // Incluimos la relación con ChemicalToilet
    });

    if (!maintenance) {
      throw new NotFoundException(
        `Mantenimiento con ID ${mantenimiento_id} no encontrado`,
      );
    }

    return maintenance;
  }

  async update(
    mantenimiento_id: number,
    updateMaintenanceDto: UpdateToiletMaintenanceDto,
  ): Promise<ToiletMaintenance> {
    // Verificamos si el mantenimiento existe
    const maintenance = await this.maintenanceRepository.findOne({
      where: { mantenimiento_id },
      relations: ['toilet'], // Incluimos la relación con ChemicalToilet
    });

    if (!maintenance) {
      throw new NotFoundException(
        `Mantenimiento con ID ${mantenimiento_id} no encontrado`,
      );
    }

    // Verificamos si el baño existe (si se está actualizando)
    if (updateMaintenanceDto.baño_id) {
      const toilet = await this.toiletsRepository.findOne({
        where: { baño_id: updateMaintenanceDto.baño_id },
      });

      if (!toilet) {
        throw new NotFoundException(
          `Baño con ID ${updateMaintenanceDto.baño_id} no encontrado`,
        );
      }

      maintenance.toilet = toilet;
    }

    // Usamos Object.assign para actualizar el mantenimiento con los nuevos datos
    Object.assign(maintenance, updateMaintenanceDto);

    // Guardamos el mantenimiento actualizado en la base de datos
    return await this.maintenanceRepository.save(maintenance);
  }
  // Función para calcular el próximo mantenimiento basado en la periodicidad
  calculateNextMaintenance(fechaInicio: Date, periodicidad: Periodicidad): Date {
    const nextMaintenance = new Date(fechaInicio);

    switch (periodicidad) {
      case Periodicidad.DIARIA:
        nextMaintenance.setDate(nextMaintenance.getDate() + 1);
        break;
      case Periodicidad.SEMANAL:
        nextMaintenance.setDate(nextMaintenance.getDate() + 7);
        break;
      case Periodicidad.MENSUAL:
        nextMaintenance.setMonth(nextMaintenance.getMonth() + 1);
        break;
      case Periodicidad.ANUAL:
        nextMaintenance.setFullYear(nextMaintenance.getFullYear() + 1);
        break;
    }

    return nextMaintenance;
  }

  // Método para programar el mantenimiento según las condiciones contractuales
  async createOrScheduleMaintenance(createMaintenanceDto: CreateToiletMaintenanceDto, contractId?: number): Promise<ToiletMaintenance | ToiletMaintenance[]> {
    // Si contractId es proporcionado, es un caso de mantenimiento programado según contrato
    if (contractId) {
      // Obtenemos las condiciones contractuales del cliente
      const contractualConditions = await this.contractualConditionsService.getContractualConditionById(contractId);
      
      if (!contractualConditions) {
        throw new NotFoundException(`No se encontraron condiciones contractuales para el contrato ID ${contractId}`);
      }
  
      // Calculamos la próxima fecha de mantenimiento según la periodicidad
      const nextMaintenanceDate = this.calculateNextMaintenance(
        contractualConditions.fecha_inicio,
        contractualConditions.periodicidad,
      );
  
      // Obtenemos todos los baños relacionados con el cliente
      const toilets = await this.toiletsRepository.find({
        where: { cliente: contractualConditions.cliente },
      });
  
      const maintenances: ToiletMaintenance[] = [];
  
      // Creamos el mantenimiento para cada baño
      for (const toilet of toilets) {
        const maintenance = this.maintenanceRepository.create({
          tipo_mantenimiento: createMaintenanceDto.tipo_mantenimiento || 'Preventivo', // Usamos el valor del DTO o el valor por defecto
          descripcion: createMaintenanceDto.descripcion || 'Mantenimiento programado según contrato', // Usamos el valor del DTO o el valor por defecto
          tecnico_responsable: createMaintenanceDto.tecnico_responsable || 'Técnico asignado', // Usamos el valor del DTO o el valor por defecto
          costo: createMaintenanceDto.costo || 50, // Usamos el valor del DTO o el valor por defecto
          fecha_mantenimiento: nextMaintenanceDate,
          toilet,
        });
  
        // Guardamos el mantenimiento programado en la base de datos
        const savedMaintenance = await this.maintenanceRepository.save(maintenance);
        maintenances.push(savedMaintenance);
      }
  
      return maintenances; // Retorna un array de mantenimientos
    } else {
      // Si no se proporciona contractId, es un caso de crear un mantenimiento individual
      // Verificamos si el baño existe
      const toilet = await this.toiletsRepository.findOne({
        where: { baño_id: createMaintenanceDto.baño_id },
      });
  
      if (!toilet) {
        throw new NotFoundException(
          `Baño con ID ${createMaintenanceDto.baño_id} no encontrado`,
        );
      }
  
      // Creamos el nuevo objeto de mantenimiento
      const maintenance = this.maintenanceRepository.create({
        ...createMaintenanceDto,
        toilet, // Relacionamos el baño con el mantenimiento
      });
  
      // Guardamos el mantenimiento en la base de datos
      return await this.maintenanceRepository.save(maintenance); // Retorna un único mantenimiento
    }
  }
  

  async delete(mantenimiento_id: number): Promise<void> {
    // Verificamos si el mantenimiento existe
    const maintenance = await this.maintenanceRepository.findOne({
      where: { mantenimiento_id },
    });

    if (!maintenance) {
      throw new NotFoundException(
        `Mantenimiento con ID ${mantenimiento_id} no encontrado`,
      );
    }

    // Procedemos a eliminar el mantenimiento
    await this.maintenanceRepository.delete(mantenimiento_id);
  }

  async findAllWithFilters(
    filterDto: FilterToiletMaintenanceDto,
  ): Promise<ToiletMaintenance[]> {
    const query = this.maintenanceRepository
      .createQueryBuilder('maintenance')
      .leftJoinAndSelect('maintenance.toilet', 'toilet');

    if (filterDto.baño_id) {
      const toiletId = parseInt(String(filterDto.baño_id), 10);
      if (!isNaN(toiletId)) {
        query.andWhere('toilet.baño_id = :toiletId', { toiletId });
      }
    }

    if (filterDto.tipo_mantenimiento) {
      query.andWhere('maintenance.tipo_mantenimiento LIKE :tipo', {
        tipo: `%${filterDto.tipo_mantenimiento}%`,
      });
    }

    if (filterDto.tecnico_responsable) {
      query.andWhere('maintenance.tecnico_responsable LIKE :tecnico', {
        tecnico: `%${filterDto.tecnico_responsable}%`,
      });
    }

    if (filterDto.fechaDesde) {
      query.andWhere('maintenance.fecha_mantenimiento >= :fechaDesde', {
        fechaDesde: filterDto.fechaDesde,
      });
    }

    if (filterDto.fechaHasta) {
      query.andWhere('maintenance.fecha_mantenimiento <= :fechaHasta', {
        fechaHasta: filterDto.fechaHasta,
      });
    }

    return await query.getMany();
  }

  async getMantenimientosStats(baño_id: number): Promise<any> {
    const maintenances = await this.maintenanceRepository.find({
      where: { toilet: { baño_id } },
      relations: ['toilet'],
    });

    if (maintenances.length === 0) {
      throw new NotFoundException(
        `No se encontraron mantenimientos para el baño con ID ${baño_id}`,
      );
    }

    const totalMantenimientos = maintenances.length;
    const costoTotal = maintenances.reduce(
      (sum, m) => sum + Number(m.costo),
      0,
    );
    const costoPromedio = costoTotal / totalMantenimientos;

    // Agrupar por tipo de mantenimiento
    const tiposMantenimiento = maintenances.reduce<Record<string, number>>(
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
      ultimoMantenimiento: maintenances.sort(
        (a, b) =>
          new Date(b.fecha_mantenimiento).getTime() -
          new Date(a.fecha_mantenimiento).getTime(),
      )[0],
    };
  }
}

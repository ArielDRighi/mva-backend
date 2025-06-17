import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from '../services/entities/service.entity';
import { Cliente } from '../clients/entities/client.entity';
import { ChemicalToilet } from '../chemical_toilets/entities/chemical_toilet.entity';
import { ToiletMaintenance } from '../toilet_maintenance/entities/toilet_maintenance.entity';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { ServiceState } from '../common/enums/resource-states.enum';

@Injectable()
export class RecentActivityService {
  private readonly logger = new Logger(RecentActivityService.name);

  constructor(
    @InjectRepository(Service)
    private servicesRepository: Repository<Service>,

    @InjectRepository(Cliente)
    private clientsRepository: Repository<Cliente>,

    @InjectRepository(ChemicalToilet)
    private toiletsRepository: Repository<ChemicalToilet>,

    @InjectRepository(ToiletMaintenance)
    private maintenanceRepository: Repository<ToiletMaintenance>,

    @InjectRepository(Vehicle)
    private vehiclesRepository: Repository<Vehicle>,
  ) {}

  async getRecentActivity() {
    this.logger.log('Obteniendo actividad reciente');

    const [
      latestCompletedService,
      latestScheduledService,
      latestClient,
      latestToilet,
      latestMaintenance,
      latestVehicle,
    ] = await Promise.all([
      this.getLatestCompletedService(),
      this.getLatestScheduledService(),
      this.getLatestClient(),
      this.getLatestToilet(),
      this.getLatestMaintenance(),
      this.getLatestVehicle(),
    ]);

    return {
      latestCompletedService,
      latestScheduledService,
      latestClient,
      latestToilet,
      latestMaintenance,
      latestVehicle,
      timestamp: new Date(),
    };
  }

  private async getLatestCompletedService() {
    return this.servicesRepository.findOne({
      where: { estado: ServiceState.COMPLETADO },
      relations: ['cliente'],
      order: { fechaFin: 'DESC' },
    });
  }

  private async getLatestScheduledService() {
    return this.servicesRepository.findOne({
      where: { estado: ServiceState.PROGRAMADO },
      relations: ['cliente'],
      order: { fechaProgramada: 'ASC' },
    });
  }

  private async getLatestClient() {
    // Usamos createQueryBuilder para obtener el cliente más reciente
    return this.clientsRepository
      .createQueryBuilder('cliente')
      .orderBy('cliente.clienteId', 'DESC')
      .getOne();
  }

  private async getLatestToilet() {
    // Usamos createQueryBuilder para obtener el baño más reciente
    return this.toiletsRepository
      .createQueryBuilder('bano')
      .orderBy('bano.baño_id', 'DESC')
      .getOne();
  }

  private async getLatestMaintenance() {
    // Usamos createQueryBuilder para obtener el mantenimiento más reciente
    return this.maintenanceRepository
      .createQueryBuilder('mantenimiento')
      .leftJoinAndSelect('mantenimiento.toilet', 'toilet')
      .orderBy('mantenimiento.createdAt', 'DESC')
      .getOne();
  }

  private async getLatestVehicle() {
    // Usamos createQueryBuilder para obtener el vehículo más reciente
    return this.vehiclesRepository
      .createQueryBuilder('vehiculo')
      .orderBy('vehiculo.vehiculo_id', 'DESC')
      .getOne();
  }
}

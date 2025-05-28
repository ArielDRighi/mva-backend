import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { Service } from '../../services/entities/service.entity';
import { ChemicalToilet } from '../../chemical_toilets/entities/chemical_toilet.entity';
import { ResourceState } from '../../common/enums/resource-states.enum';
import { ServiceType } from '../../common/enums/resource-states.enum';

@Injectable()
export class ContractExpirationService {
  private readonly logger = new Logger(ContractExpirationService.name);

  constructor(
    @InjectRepository(Service)
    private serviceRepository: Repository<Service>,
    @InjectRepository(ChemicalToilet)
    private toiletsRepository: Repository<ChemicalToilet>,
  ) {}

  // Este método se ejecutará diariamente a las 00:01
  @Cron('1 0 * * *')
  async checkExpiredContracts() {
    this.logger.log('Ejecutando verificación de contratos expirados');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      // Buscar servicios con fecha de fin de asignación anterior a hoy
      const expiredAssignments = await this.serviceRepository.find({
        where: {
          fechaFinAsignacion: LessThan(today),
          tipoServicio: ServiceType.INSTALACION,
        },
        relations: ['asignaciones', 'asignaciones.bano'],
      });

      this.logger.log(
        `Encontrados ${expiredAssignments.length} servicios con contratos expirados`,
      );

      // Liberar los baños de contratos expirados
      for (const service of expiredAssignments) {
        if (service.asignaciones && service.asignaciones.length > 0) {
          for (const asignacion of service.asignaciones) {
            if (asignacion.bano) {
              // Cambiar el estado del baño a DISPONIBLE
              this.logger.log(
                `Liberando baño ${asignacion.bano.baño_id} por fin de contrato`,
              );
              await this.toiletsRepository.update(asignacion.bano.baño_id, {
                estado: ResourceState.DISPONIBLE,
              });
            }
          }
        }

        // Reemplaza todas las apariciones de service.servicio_id por service.id
        await this.serviceRepository.update(service.id, {
          fechaFinAsignacion: undefined, // Usar undefined en lugar de null
        });

        this.logger.log(`Servicio ${service.id} procesado exitosamente`);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Error al verificar contratos expirados: ${errorMessage}`,
        errorStack,
      );
    }
  }
}

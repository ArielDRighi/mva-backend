import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from './entities/service.entity';
import { ResourceAssignment } from './entities/resource-assignment.entity';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { ClientsModule } from '../clients/clients.module';
import { EmployeesModule } from '../employees/employees.module';
import { VehiclesModule } from '../vehicles/vehicles.module'; // Importar VehiclesModule
import { ChemicalToiletsModule } from '../chemical_toilets/chemical_toilets.module';
import { Vehicle } from '../vehicles/entities/vehicle.entity'; // Importar la entidad Vehicle
import { ChemicalToilet } from '../chemical_toilets/entities/chemical_toilet.entity'; // Importar la entidad ChemicalToilet
import { VehicleMaintenanceModule } from '../vehicle_maintenance/vehicle_maintenance.module'; // Importar VehicleMaintenanceModule
import { ToiletMaintenanceModule } from '../toilet_maintenance/toilet_maintenance.module'; // Importar ToiletMaintenanceModule

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Service,
      ResourceAssignment,
      Vehicle,
      ChemicalToilet,
    ]),
    ClientsModule,
    EmployeesModule,
    VehiclesModule,
    ChemicalToiletsModule,
    VehicleMaintenanceModule,
    ToiletMaintenanceModule,
  ],
  controllers: [ServicesController],
  providers: [ServicesService],
  exports: [ServicesService],
})
export class ServicesModule {}

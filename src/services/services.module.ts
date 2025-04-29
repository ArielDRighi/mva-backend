import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from './entities/service.entity';
import { ResourceAssignment } from './entities/resource-assignment.entity';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { ClientsModule } from '../clients/clients.module';
import { EmployeesModule } from '../employees/employees.module';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { ChemicalToiletsModule } from '../chemical_toilets/chemical_toilets.module';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { ChemicalToilet } from '../chemical_toilets/entities/chemical_toilet.entity';
import { VehicleMaintenanceModule } from '../vehicle_maintenance/vehicle_maintenance.module';
import { ToiletMaintenanceModule } from '../toilet_maintenance/toilet_maintenance.module';
import { Empleado } from '../employees/entities/employee.entity';
import { CondicionesContractuales } from '../contractual_conditions/entities/contractual_conditions.entity';
import { EmployeeLeavesModule } from '../employee_leaves/employee-leaves.module';
import { FuturasLimpiezas } from 'src/future_cleanings/entities/futureCleanings.entity';
import { FutureCleaningsService } from 'src/future_cleanings/futureCleanings.service';
import { Cliente } from 'src/clients/entities/client.entity';
import { MailerModule } from 'src/mailer/mailer.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Service,
      ResourceAssignment,
      Empleado,
      Vehicle,
      ChemicalToilet,
      CondicionesContractuales,
      FuturasLimpiezas,
      Cliente,
    ]),
    forwardRef(() => ClientsModule),
    forwardRef(() => EmployeesModule),
    forwardRef(() => VehiclesModule),
    forwardRef(() => ChemicalToiletsModule),
    forwardRef(() => VehicleMaintenanceModule),
    forwardRef(() => ToiletMaintenanceModule),
    EmployeeLeavesModule,
    MailerModule,
  ],
  controllers: [ServicesController],
  providers: [ServicesService, FutureCleaningsService],
  exports: [ServicesService],
})
export class ServicesModule {}

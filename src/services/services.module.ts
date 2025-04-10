import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from './entities/service.entity';
import { ResourceAssignment } from './entities/resource-assignment.entity';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { ClientsModule } from '../clients/clients.module';
import { EmployeesModule } from '../employees/employees.module';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { ChemicalToiletsModule } from '../chemical_toilets/chemical_toilets.module';
import { RolesModule } from '../roles/roles.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Service, ResourceAssignment]),
    ClientsModule,
    EmployeesModule,
    VehiclesModule,
    ChemicalToiletsModule,
    RolesModule,
  ],
  controllers: [ServicesController],
  providers: [ServicesService],
  exports: [ServicesService],
})
export class ServicesModule {}

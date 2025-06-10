import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  ToiletMaintenanceService,
  ToiletMaintenanceSchedulerService,
} from './toilet_maintenance.service';
import { ToiletMaintenanceController } from './toilet_maintenance.controller';
import { ToiletMaintenance } from './entities/toilet_maintenance.entity';
import { ChemicalToilet } from '../chemical_toilets/entities/chemical_toilet.entity';
import { Empleado } from '../employees/entities/employee.entity';
import { ChemicalToiletsModule } from '../chemical_toilets/chemical_toilets.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ToiletMaintenance, ChemicalToilet, Empleado]),
    forwardRef(() => ChemicalToiletsModule),
  ],
  controllers: [ToiletMaintenanceController],
  providers: [ToiletMaintenanceService, ToiletMaintenanceSchedulerService],
  exports: [ToiletMaintenanceService],
})
export class ToiletMaintenanceModule {}

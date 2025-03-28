import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vehicle } from './entities/vehicle.entity';
import { VehicleMaintenanceRecord } from './entities/vehicle-maintenance-record.entity';
import { VehiclesService } from './vehicles.service';
import { VehiclesController } from './vehicles.controller';
import { VehicleMaintenanceService } from './vehicle-maintenance.service';
import { VehicleMaintenanceController } from './vehicle-maintenance.controller';
import { RolesModule } from '../roles/roles.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Vehicle, VehicleMaintenanceRecord]),
    RolesModule,
  ],
  controllers: [VehiclesController, VehicleMaintenanceController],
  providers: [VehiclesService, VehicleMaintenanceService],
  exports: [VehiclesService, VehicleMaintenanceService],
})
export class VehiclesModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VehicleMaintenanceRecord } from './entities/vehicle-maintenance-record.entity';
import { VehicleMaintenanceService } from './vehicle-maintenance.service';
import { VehicleMaintenanceController } from './vehicle-maintenance.controller';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { RolesModule } from '../roles/roles.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([VehicleMaintenanceRecord]),
    VehiclesModule,
    RolesModule,
  ],
  controllers: [VehicleMaintenanceController],
  providers: [VehicleMaintenanceService],
  exports: [VehicleMaintenanceService],
})
export class VehicleMaintenanceModule {}

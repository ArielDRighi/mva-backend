import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VehicleMaintenanceRecord } from './entities/vehicle_maintenance_record.entity';
import { VehicleMaintenanceService } from './vehicle_maintenance.service';
import { VehicleMaintenanceController } from './vehicle_maintenance.controller';
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

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ToiletMaintenanceService } from './toilet_maintenance.service';
import { ToiletMaintenanceController } from './toilet_maintenance.controller';
import { ToiletMaintenance } from './entities/toilet_maintenance.entity';
import { ChemicalToilet } from '../chemical_toilets/entities/chemical-toilet.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ToiletMaintenance, ChemicalToilet])],
  controllers: [ToiletMaintenanceController],
  providers: [ToiletMaintenanceService],
  exports: [ToiletMaintenanceService],
})
export class ToiletMaintenanceModule {}

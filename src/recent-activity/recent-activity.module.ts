import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecentActivityService } from './recent-activity.service';
import { RecentActivityController } from './recent-activity.controller';
import { Service } from '../services/entities/service.entity';
import { Cliente } from '../clients/entities/client.entity';
import { ChemicalToilet } from '../chemical_toilets/entities/chemical_toilet.entity';
import { ToiletMaintenance } from '../toilet_maintenance/entities/toilet_maintenance.entity';
import { Vehicle } from '../vehicles/entities/vehicle.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Service,
      Cliente,
      ChemicalToilet,
      ToiletMaintenance,
      Vehicle,
    ]),
  ],
  controllers: [RecentActivityController],
  providers: [RecentActivityService],
})
export class RecentActivityModule {}

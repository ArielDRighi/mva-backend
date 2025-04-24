import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChemicalToilet } from './entities/chemical_toilet.entity';
import { ChemicalToiletsService } from './chemical_toilets.service';
import { ChemicalToiletsController } from './chemical_toilets.controller';
import { ToiletMaintenanceModule } from '../toilet_maintenance/toilet_maintenance.module';
import { Service } from '../services/entities/service.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChemicalToilet, Service]),
    forwardRef(() => ToiletMaintenanceModule),
  ],
  controllers: [ChemicalToiletsController],
  providers: [ChemicalToiletsService],
  exports: [ChemicalToiletsService],
})
export class ChemicalToiletsModule {}

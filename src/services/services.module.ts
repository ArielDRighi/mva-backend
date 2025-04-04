import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from './entities/service.entity';
import { ResourceAssignment } from './entities/resource_assignment.entity';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { ChemicalToilet } from '../chemical_toilets/entities/chemical_toilet.entity';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { RolesModule } from '../roles/roles.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Service,
      ResourceAssignment,
      ChemicalToilet,
      Vehicle,
    ]),
    RolesModule,
  ],
  controllers: [ServicesController],
  providers: [ServicesService],
  exports: [ServicesService],
})
export class ServicesModule {}

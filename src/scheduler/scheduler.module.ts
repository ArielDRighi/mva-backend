import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from '../services/entities/service.entity';
import { ChemicalToilet } from '../chemical_toilets/entities/chemical_toilet.entity';
import { ContractExpirationService } from './services/contract-expiration.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([Service, ChemicalToilet]),
  ],
  providers: [ContractExpirationService],
  exports: [ContractExpirationService],
})
export class SchedulerModule {}

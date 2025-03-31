import { ContractualConditionsService } from './contractual_conditions.service';
import { Module } from '@nestjs/common';
import { ContractualConditionsController } from './contractual_conditions.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CondicionesContractuales } from './entities/contractual_conditions.entity';
import { Cliente } from 'src/clients/entities/client.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CondicionesContractuales, Cliente])],
  controllers: [ContractualConditionsController],
  providers: [ContractualConditionsService],
  exports: [ContractualConditionsService],
})
export class ContractualConditionsModule {}

import { ContractualConditionsService } from './contractualConditions.service';
import { Module } from '@nestjs/common';
import { ContractualConditionsController } from './contractualConditions.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CondicionesContractuales } from './entities/contractualConditions.entity';
import { Cliente } from 'src/clientes/entities/client.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CondicionesContractuales, Cliente])],
  controllers: [ContractualConditionsController],
  providers: [ContractualConditionsService],
  exports: [ContractualConditionsService],
})
export class ContractualConditionsModule {}

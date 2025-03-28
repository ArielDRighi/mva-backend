import { ContractualConditionsService } from './contractualConditions.service';
import { Module } from '@nestjs/common';
import { ContractualConditionsController } from './contractualConditions.controller';

@Module({
  imports: [],
  controllers: [ContractualConditionsController],
  providers: [ContractualConditionsService],
  exports: [ContractualConditionsService],
})
export class ontractualConditionsModule {}

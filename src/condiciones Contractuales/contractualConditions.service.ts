import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CondicionesContractuales } from './entities/contractualConditions.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ContractualConditionsService {
  constructor(
    @InjectRepository(CondicionesContractuales)
    private contractualConditionsRepository: Repository<CondicionesContractuales>,
  ) {}

  getAllContractualConditions() {
    throw new Error('Method not implemented.');
  }

  getContractualConditionById(contractualConditionId: number) {
    throw new Error('Method not implemented.');
  }
}

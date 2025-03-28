import { ContractualConditionsService } from './contractualConditions.service';
import {
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('CondicionesContractuales')
@UseGuards(JwtAuthGuard)
export class ContractualConditionsController {
  constructor(
    private readonly contractualConditionsService: ContractualConditionsService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  getAllContractualConditions() {
    try {
      return this.contractualConditionsService.getAllContractualConditions();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  getContractualConditionById(@Param('id') contractualConditionId: number) {
    try {
      return this.contractualConditionsService.getContractualConditionById(
        contractualConditionId,
      );
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}

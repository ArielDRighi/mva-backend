import { ModifyCondicionContractualDto } from './dto/modify-contractual_conditions.dto';
import { CreateContractualConditionDto } from './dto/create-contractual_conditions.dto';
import { ContractualConditionsService } from './contractual_conditions.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('condiciones_contractuales')
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

  @Get('id/:id')
  @HttpCode(HttpStatus.OK)
  getContractualConditionById(
    @Param('id', ParseIntPipe) contractualConditionId: number,
  ) {
    try {
      return this.contractualConditionsService.getContractualConditionById(
        contractualConditionId,
      );
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('client-name/:clientName')
  @HttpCode(HttpStatus.OK)
  getContractualConditionsByClient(
    @Param('clientName', ParseIntPipe) clientId: number,
  ) {
    try {
      return this.contractualConditionsService.getContractualConditionsByClient(
        clientId,
      );
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('create')
  @HttpCode(HttpStatus.OK)
  createContractualCondition(
    @Body() createContractualConditionDto: CreateContractualConditionDto,
  ) {
    try {
      return this.contractualConditionsService.createContractualCondition(
        createContractualConditionDto,
      );
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Put('modify/:id')
  @HttpCode(HttpStatus.OK)
  modifyContractualCondition(
    @Body() modifyContractualConditionDto: ModifyCondicionContractualDto,
    @Param('id', ParseIntPipe) id: number,
  ) {
    try {
      return this.contractualConditionsService.modifyContractualCondition(
        modifyContractualConditionDto,
        id,
      );
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.CREATED);
    }
  }

  @Delete('delete/:id')
  @HttpCode(HttpStatus.OK)
  deleteContractualCondition(@Param('id', ParseIntPipe) id: number) {
    try {
      return this.contractualConditionsService.deleteContractualCondition(id);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.NO_CONTENT);
    }
  }
}

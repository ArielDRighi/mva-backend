import { ModifyCondicionContractualDto } from './dto/modify_contractual_conditions.dto';
import { CreateContractualConditionDto } from './dto/create_contractual_conditions.dto';
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
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Pagination } from 'src/common/interfaces/paginations.interface';
import { CondicionesContractuales } from './entities/contractual_conditions.entity';

@Controller('contractual_conditions')
@UseGuards(JwtAuthGuard)
export class ContractualConditionsController {
  constructor(
    private readonly contractualConditionsService: ContractualConditionsService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getAllContractualConditions(
    @Query('page') page: number = 1, // Recibe el número de página desde la URL
    @Query('limit') limit: number = 10, // Recibe el límite de registros por página desde la URL
  ): Promise<Pagination<CondicionesContractuales>> {
    try {
      // Llamamos al servicio pasando los parámetros de paginación
      return await this.contractualConditionsService.getAllContractualConditions(
        page,
        limit,
      );
    } catch (error: unknown) {
      // Si ocurre un error, lo lanzamos con un mensaje adecuado
      const message =
        error instanceof Error ? error.message : 'Unknown error occurred';
      throw new HttpException(message, HttpStatus.BAD_REQUEST);
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
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown error occurred';
      throw new HttpException(message, HttpStatus.BAD_REQUEST);
    }
  }
  @Get('client-id/:clientId')
  @HttpCode(HttpStatus.OK)
  getContractualConditionsByClient(
    @Param('clientId', ParseIntPipe) clientId: number,
  ) {
    try {
      return this.contractualConditionsService.getContractualConditionsByClient(
        clientId,
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown error occurred';
      throw new HttpException(message, HttpStatus.BAD_REQUEST);
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
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown error occurred';
      throw new HttpException(message, HttpStatus.BAD_REQUEST);
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
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown error occurred';
      throw new HttpException(message, HttpStatus.CREATED);
    }
  }
  @Delete('delete/:id')
  @HttpCode(HttpStatus.OK)
  deleteContractualCondition(@Param('id', ParseIntPipe) id: number) {
    try {
      return this.contractualConditionsService.deleteContractualCondition(id);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown error occurred';
      throw new HttpException(message, HttpStatus.NO_CONTENT);
    }
  }
}

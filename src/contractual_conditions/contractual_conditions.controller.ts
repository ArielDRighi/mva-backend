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
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ToiletMaintenanceService } from 'src/toilet_maintenance/toilet_maintenance.service';
import { CreateToiletMaintenanceDto } from 'src/toilet_maintenance/dto/create_toilet_maintenance.dto';

@Controller('contractual_conditions')
@UseGuards(JwtAuthGuard)
export class ContractualConditionsController {
  constructor(
    private readonly contractualConditionsService: ContractualConditionsService,
    private readonly toiletMaintenanceService: ToiletMaintenanceService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  getAllContractualConditions() {
    try {
      return this.contractualConditionsService.getAllContractualConditions();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown error occurred';
      throw new HttpException(message, HttpStatus.BAD_REQUEST);
    }
  }
  @Post('schedule-maintenance/:contractId')
  @HttpCode(HttpStatus.OK)
  async scheduleMaintenanceForContract(
    @Param('contractId', ParseIntPipe) contractId: number,
    @Body() createMaintenanceDto: CreateToiletMaintenanceDto,  // Añadir el DTO de mantenimiento aquí
  ) {
    try {
      // Pasamos el DTO de mantenimiento y el contractId
      const maintenances = await this.toiletMaintenanceService.createOrScheduleMaintenance(createMaintenanceDto, contractId);
      return { message: 'Mantenimientos programados correctamente', maintenances };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
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
  @Get('client-name/:clientName')
  @HttpCode(HttpStatus.OK)
  getContractualConditionsByClient(
    @Param('clientName', ParseIntPipe) clientId: number,
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

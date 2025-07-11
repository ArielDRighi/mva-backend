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
import { Roles } from 'src/roles/decorators/roles.decorator';
import { Role } from 'src/roles/enums/role.enum';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Controller('contractual_conditions')
@UseGuards(JwtAuthGuard)
export class ContractualConditionsController {
  constructor(
    private readonly contractualConditionsService: ContractualConditionsService,
  ) {}
  @Roles(Role.ADMIN)
  @Get()
  @HttpCode(HttpStatus.OK)
  async getAllContractualConditions(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
  ): Promise<Pagination<CondicionesContractuales>> {
    try {
      // Llamamos al servicio pasando los parámetros de paginación
      return await this.contractualConditionsService.getAllContractualConditions(
        page,
        limit,
        search,
      );
    } catch (error: unknown) {
      // Si ocurre un error, lo lanzamos con un mensaje adecuado
      const message =
        error instanceof Error ? error.message : 'Error desconocido ocurrido';
      throw new HttpException(message, HttpStatus.BAD_REQUEST);
    }
  }
  @Roles(Role.ADMIN)
  @Get('id/:id')
  @HttpCode(HttpStatus.OK)
  async getContractualConditionById(
    @Param('id', ParseIntPipe) contractualConditionId: number,
  ) {
    try {
      return await this.contractualConditionsService.getContractualConditionById(
        contractualConditionId,
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido ocurrido';
      throw new HttpException(message, HttpStatus.BAD_REQUEST);
    }
  }

  @Roles(Role.ADMIN)
  @Get('client-id/:clientId')
  @HttpCode(HttpStatus.OK)
  async getContractualConditionsByClient(
    @Param('clientId', ParseIntPipe) clientId: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
  ) {
    try {
      return await this.contractualConditionsService.getContractualConditionsByClient(
        clientId,
        page,
        limit,
        search,
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido ocurrido';
      throw new HttpException(message, HttpStatus.BAD_REQUEST);
    }
  }
  @Roles(Role.ADMIN)
  @Post('create')
  @HttpCode(HttpStatus.OK)
  async createContractualCondition(
    @Body() createContractualConditionDto: CreateContractualConditionDto,
  ) {
    try {
      return await this.contractualConditionsService.createContractualCondition(
        createContractualConditionDto,
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido ocurrido';
      throw new HttpException(message, HttpStatus.BAD_REQUEST);
    }
  }
  @Roles(Role.ADMIN)
  @Put('modify/:id')
  @HttpCode(HttpStatus.OK)
  async modifyContractualCondition(
    @Body() modifyContractualConditionDto: ModifyCondicionContractualDto,
    @Param('id', ParseIntPipe) id: number,
  ) {
    try {
      return await this.contractualConditionsService.modifyContractualCondition(
        modifyContractualConditionDto,
        id,
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido ocurrido';
      throw new HttpException(message, HttpStatus.BAD_REQUEST);
    }
  }
  @Roles(Role.ADMIN)
  @Delete('delete/:id')
  @HttpCode(HttpStatus.OK)
  async deleteContractualCondition(@Param('id', ParseIntPipe) id: number) {
    try {
      return await this.contractualConditionsService.deleteContractualCondition(
        id,
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido ocurrido';
      throw new HttpException(message, HttpStatus.BAD_REQUEST);
    }
  }
}

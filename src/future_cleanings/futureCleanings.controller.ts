import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { FutureCleaningsService } from './futureCleanings.service';
import { ModifyFutureCleaningDto } from './dto/modifyFutureCleanings.dto';
import { CreateFutureCleaningDto } from './dto/createFutureCleanings.dto';
import { Roles } from 'src/roles/decorators/roles.decorator';
import { Role } from 'src/roles/enums/role.enum';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Controller('future_cleanings')
@UseGuards(JwtAuthGuard)
export class FutureCleaningsController {
  constructor(
    private readonly futureCleaningsService: FutureCleaningsService,
  ) {}
  @Get()
  @HttpCode(HttpStatus.OK)
  async getAllFutureCleanings(
    @Query('page') page = '1',
    @Query('limit') limit = '5',
  ) {
    try {
      const paginationDto: PaginationDto = {
        page: Number(page),
        limit: Number(limit),
      };
      return await this.futureCleaningsService.getAll(paginationDto);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Error desconocido ocurrido',
      );
    }
  }
  @Roles(Role.ADMIN)
  @Delete('delete/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteFutureCleaning(@Param('id') id: number) {
    try {
      return await this.futureCleaningsService.deleteFutureCleaning(id);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Error desconocido ocurrido',
      );
    }
  }
  @Get('/by-date-range')
  @HttpCode(HttpStatus.OK)
  async getFutureCleaningsByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    try {
      const paginationDto: PaginationDto = {
        page: Number(page),
        limit: Number(limit),
      };
      return await this.futureCleaningsService.getByDateRange(
        new Date(startDate),
        new Date(endDate),
        paginationDto,
      );
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Error desconocido ocurrido',
      );
    }
  }

  @Get('/upcoming')
  @HttpCode(HttpStatus.OK)
  async getUpcomingCleanings(
    @Query('days') days = '7',
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    try {
      const paginationDto: PaginationDto = {
        page: Number(page),
        limit: Number(limit),
      };
      return await this.futureCleaningsService.getUpcomingCleanings(
        Number(days),
        paginationDto,
      );
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Error desconocido ocurrido',
      );
    }
  }

  @Get('/:id')
  @HttpCode(HttpStatus.OK)
  async getFutureCleaningById(@Param('id') id: number) {
    try {
      return await this.futureCleaningsService.getById(id);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Error desconocido ocurrido',
      );
    }
  }
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createFutureCleaning(@Body() data: CreateFutureCleaningDto) {
    try {
      return await this.futureCleaningsService.createFutureCleaning(data);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Error desconocido ocurrido',
      );
    }
  }  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @Put('modify/:id')
  @HttpCode(HttpStatus.OK)
  async updateFutureCleaning(
    @Param('id') id: number,
    @Body() data: ModifyFutureCleaningDto,
  ) {
    try {
      return await this.futureCleaningsService.updateFutureCleaning(id, data);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Error desconocido ocurrido',
      );
    }
  }
}

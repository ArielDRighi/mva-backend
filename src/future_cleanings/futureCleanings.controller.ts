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
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { FutureCleaningsService } from './futureCleanings.service';
import { ModifyFutureCleaningDto } from './dto/modifyFutureCleanings.dto';
import { CreateFutureCleaningDto } from './dto/createFutureCleanings.dto';

@Controller('future_cleanings')
@UseGuards(JwtAuthGuard)
export class FutureCleaningsController {
  constructor(
    private readonly futureCleaningsService: FutureCleaningsService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getAllFutureClenaings() {
    try {
      return await this.futureCleaningsService.getAll();
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Unknown error occurred',
      );
    }
  }
  @Delete('delete/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteFutureCleaning(@Param('id') id: number) {
    try {
      return await this.futureCleaningsService.deleteFutureCleaning(id);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Unknown error occurred',
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
        error instanceof Error ? error.message : 'Unknown error occurred',
      );
    }
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createFutureCleaning(@Body() data: CreateFutureCleaningDto) {
    try {
      return await this.futureCleaningsService.createFutureCleaning(data);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Unknown error occurred',
      );
    }
  }

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
        error instanceof Error ? error.message : 'Unknown error occurred',
      );
    }
  }
}

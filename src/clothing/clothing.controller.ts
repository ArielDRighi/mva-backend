import {
  BadRequestException,
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ClothingService } from './clothing.service';
import { RolesGuard } from 'src/roles/guards/roles.guard';
import { Role } from 'src/roles/enums/role.enum';
import { CreateRopaTallesDto } from './dto/CreateRopaTalles.dto';
import { Roles } from 'src/roles/decorators/roles.decorator';
import { UpdateRopaTallesDto } from './dto/updateRopaTalles.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Response } from 'express';
import { RopaTalles } from './entities/clothing.entity';

@Controller('clothing')
@UseGuards(JwtAuthGuard)
export class ClothingController {
  constructor(private readonly clothingService: ClothingService) {}

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @Get()
  async getAllClothingSpecs(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
  ): Promise<{
    data: RopaTalles[];
    totalItems: number;
    currentPage: number;
    totalPages: number;
  }> {
    return this.clothingService.getAllClothingSpecs(page, limit, search);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @HttpCode(HttpStatus.OK)
  @Get('export')
  async exportExcel(@Res() res: Response) {
    return this.clothingService.exportToExcel(res);
  }

  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.OPERARIO)
  @HttpCode(HttpStatus.OK)
  @Get(':empleadoId')
  async getClothingSpecs(
    @Param('empleadoId', ParseIntPipe) empleadoId: number,
  ) {
    try {
      return await this.clothingService.getClothingSpecs(empleadoId);
    } catch (error) {
      // Aquí podés agregar más lógica para manejar errores específicos si querés
      throw new BadRequestException(
        error instanceof Error ? error.message : 'An error occurred',
      );
    }
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.OPERARIO)
  @HttpCode(HttpStatus.CREATED)
  @Post('create/:empleadoId')
  async create(
    @Body() talles: CreateRopaTallesDto,
    @Param('empleadoId') empleadoId: number,
  ) {
    return this.clothingService.createClothingSpecs(talles, empleadoId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.OPERARIO)
  @HttpCode(HttpStatus.OK)
  @Put('modify/:empleadoId')
  async update(
    @Body() talles: UpdateRopaTallesDto,
    @Param('empleadoId') empleadoId: number,
  ) {
    return this.clothingService.updateClothingSpecs(talles, empleadoId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @HttpCode(HttpStatus.OK)
  @Delete('delete/:empleadoId')
  async delete(@Param('empleadoId') empleadoId: number) {
    return this.clothingService.deleteClothingSpecs(empleadoId);
  }
}

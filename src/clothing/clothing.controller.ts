import {
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
import { ClothingService } from './clothing.service';
import { RolesGuard } from 'src/roles/guards/roles.guard';
import { Role } from 'src/roles/enums/role.enum';
import { CreateRopaTallesDto } from './dto/CreateRopaTalles.dto';
import { Roles } from 'src/roles/decorators/roles.decorator';
import { UpdateRopaTallesDto } from './dto/updateRopaTalles.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('clothing')
@UseGuards(JwtAuthGuard)
export class ClothingController {
  constructor(private readonly clothingService: ClothingService) {}

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @Get()
  async getAllClothingSpecs() {
    return this.clothingService.getAllClothingSpecs();
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.OPERARIO)
  @HttpCode(HttpStatus.OK)
  @Get(':empleadoId')
  async getClothingSpecs(@Param('empleadoId') empleadoId: number) {
    return this.clothingService.getClothingSpecs(empleadoId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @HttpCode(HttpStatus.CREATED)
  @Post('create/:empleadoId')
  async create(
    @Body() talles: CreateRopaTallesDto,
    @Param('empleadoId') empleadoId: number,
  ) {
    return this.clothingService.createClothingSpecs(talles, empleadoId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR)
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

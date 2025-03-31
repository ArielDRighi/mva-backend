import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
} from '@nestjs/common';
import { MantenimientoBañoService } from './mantenimiento_baños.service';
import { CreateMantenimientoBañoDto } from './dto/create-mantenimiento_baño.dto';
import { UpdateMantenimientoBañoDto } from './dto/update-mantenimiento_baño.dto';
import { FilterMantenimientoBañoDto } from './dto/filter-mantenimiento_baño.dto';
import { MantenimientoBaño } from './entities/mantenimiento_baño.entity';

@Controller('mantenimiento-baños')
export class MantenimientoBañoController {
  constructor(
    private readonly mantenimientoService: MantenimientoBañoService,
  ) {}

  // Endpoint para crear un nuevo mantenimiento de baño
  @Post()
  async create(
    @Body() createMantenimientoBañoDto: CreateMantenimientoBañoDto,
  ): Promise<MantenimientoBaño> {
    return this.mantenimientoService.create(createMantenimientoBañoDto);
  }

  @Get()
  async findAll(): Promise<MantenimientoBaño[]> {
    return this.mantenimientoService.findAll();
  }

  @Get(':id')
  async findById(
    @Param('id') mantenimiento_id: number,
  ): Promise<MantenimientoBaño> {
    return this.mantenimientoService.findById(mantenimiento_id);
  }

  @Get('search')
  async search(
    @Query() filterDto: FilterMantenimientoBañoDto,
  ): Promise<MantenimientoBaño[]> {
    return this.mantenimientoService.findAllWithFilters(filterDto);
  }

  @Get('stats/:bañoId')
  async getMantenimientosStats(@Param('bañoId') bañoId: number): Promise<any> {
    return this.mantenimientoService.getMantenimientosStats(bañoId);
  }

  @Put(':id')
  async update(
    @Param('id') mantenimiento_id: number,
    @Body() updateMantenimientoBañoDto: UpdateMantenimientoBañoDto,
  ): Promise<MantenimientoBaño> {
    return this.mantenimientoService.update(
      mantenimiento_id,
      updateMantenimientoBañoDto,
    );
  }

  @Delete(':id')
  async delete(@Param('id') mantenimiento_id: number): Promise<void> {
    return this.mantenimientoService.delete(mantenimiento_id);
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ChemicalToiletsService } from './chemical_toilets.service';
import { CreateChemicalToiletDto } from './dto/create_chemical_toilet.dto';
import { UpdateChemicalToiletDto } from './dto/update_chemical.toilet.dto';
import { FilterChemicalToiletDto } from './dto/filter_chemical_toilet.dto';
import { ChemicalToilet } from './entities/chemical_toilet.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../roles/guards/roles.guard';
import { Roles } from '../roles/decorators/roles.decorator';
import { Role } from '../roles/enums/role.enum';
import { Pagination } from 'src/common/interfaces/paginations.interface';

@Controller('chemical_toilets')
@UseGuards(JwtAuthGuard)
export class ChemicalToiletsController {
  constructor(
    private readonly chemicalToiletsService: ChemicalToiletsService,
  ) {}

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @Post()
  async create(
    @Body() createChemicalToiletDto: CreateChemicalToiletDto,
  ): Promise<ChemicalToilet> {
    return this.chemicalToiletsService.create(createChemicalToiletDto);
  }

  @Get()
  async findAll(
    @Query('page') page = 1,   // Página por defecto 1
    @Query('limit') limit = 10, // Límite por defecto 10
  ): Promise<Pagination<ChemicalToilet>> {  // Asegúrate de que el tipo de retorno sea el adecuado
    const paginationDto = { page, limit };
    return this.chemicalToiletsService.findAll(paginationDto); // Llamada al servicio con paginación
  }
  

  @Get('search')
async search(
  @Query() filterDto: FilterChemicalToiletDto, // Recibe todos los filtros de la query
): Promise<Pagination<ChemicalToilet>> {         // Devolver un objeto Pagination
  return this.chemicalToiletsService.findAllWithFilters(filterDto);
}


  @Get(':id')
  async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ChemicalToilet> {
    return this.chemicalToiletsService.findById(id);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateChemicalToiletDto: UpdateChemicalToiletDto,
  ): Promise<ChemicalToilet> {
    return this.chemicalToiletsService.update(id, updateChemicalToiletDto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.chemicalToiletsService.remove(id);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @Get('stats/:id')
  async getStats(@Param('id', ParseIntPipe) id: number): Promise<any> {
    return this.chemicalToiletsService.getMaintenanceStats(id);
  }

  @Get('/by-client/:clientId')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  async findToiletsByClient(
    @Param('clientId', ParseIntPipe) clientId: number,
  ): Promise<ChemicalToilet[]> {
    return this.chemicalToiletsService.findByClientId(clientId);
  }
}

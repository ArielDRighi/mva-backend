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

  @Get(':id/services')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  async findServicesByToilet(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<any[]> {
    return this.chemicalToiletsService.findServicesByToiletId(id);
  }

  @Get('total_chemical_toilets')
  async getTotalChemicalToilets(): Promise<{
    total: number;
    totalDisponibles: number;
    totalMantenimiento: number;
    totalAsignado: number;
  }> {
    return this.chemicalToiletsService.getTotalChemicalToilets();
  }
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
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('search') search?: string,
  ): Promise<Pagination<ChemicalToilet>> {
    const paginationDto = {
      page: Number(page),
      limit: Number(limit),
    };

    return this.chemicalToiletsService.findAll(paginationDto, search);
  }

  // @Get('search')
  // async search(
  //   @Query() filterDto: FilterChemicalToiletDto,
  // ): Promise<Pagination<ChemicalToilet>> {
  //   // Convertimos page y limit si vienen como strings
  //   const page = filterDto.page ? Number(filterDto.page) : 1;
  //   const limit = filterDto.limit ? Number(filterDto.limit) : 10;

  //   return this.chemicalToiletsService.findAllWithFilters({
  //     ...filterDto,
  //     page,
  //     limit,
  //   });
  // }

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

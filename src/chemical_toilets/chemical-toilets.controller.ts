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
import { ChemicalToiletsService } from './chemical-toilets.service';
import { CreateChemicalToiletDto } from './dto/create-chemical_toilet.dto';
import { UpdateChemicalToiletDto } from './dto/update-chemical.toilet.dto';
import { FilterChemicalToiletDto } from './dto/filter-chemical_toilet.dto';
import { ChemicalToilet } from './entities/chemical-toilet.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../roles/guards/roles.guard';
import { Roles } from '../roles/decorators/roles.decorator';
import { Role } from '../roles/enums/role.enum';

@Controller('chemical-toilets')
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
  async findAll(): Promise<ChemicalToilet[]> {
    return this.chemicalToiletsService.findAll();
  }

  @Get('search')
  async search(
    @Query() filterDto: FilterChemicalToiletDto,
  ): Promise<ChemicalToilet[]> {
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
}

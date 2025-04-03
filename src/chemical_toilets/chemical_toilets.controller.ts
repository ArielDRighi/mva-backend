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
  HttpStatus,
  HttpCode,
  DefaultValuePipe,
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
import { PaginationPipe } from 'src/pipes';
import { PaginatedResponse } from './interfaces/response_chemical_toilet.interface';

@Controller('chemical_toilets')
@UseGuards(JwtAuthGuard)
export class ChemicalToiletsController {
  constructor(
    private readonly chemicalToiletsService: ChemicalToiletsService,
  ) {}

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createChemicalToiletDto: CreateChemicalToiletDto,
  ): Promise<ChemicalToilet> {
    return this.chemicalToiletsService.create(createChemicalToiletDto);
  }

  @Get()
  async findAll(
    @Query('page', new PaginationPipe(1, 1), ParseIntPipe) page: number,
    @Query('limit', new PaginationPipe(10, 1, 100))
    limit: number,
  ): Promise<PaginatedResponse<ChemicalToilet>> {
    return this.chemicalToiletsService.findAll(page, limit);
  }

  @Get('search')
  async search(
    @Query() filterDto: FilterChemicalToiletDto,
    @Query('page', new PaginationPipe(1, 1), ParseIntPipe) page: number = 1,
    @Query('limit', new PaginationPipe(10, 1, 100), ParseIntPipe)
    limit: number,
  ): Promise<PaginatedResponse<ChemicalToilet>> {
    return this.chemicalToiletsService.findAllWithFilters(
      filterDto,
      page,
      limit,
    );
  }
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @Get('stats/:id')
  async getStats(@Param('id', ParseIntPipe) id: number): Promise<any> {
    return this.chemicalToiletsService.getMaintenanceStats(id);
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
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.chemicalToiletsService.remove(id);
  }
}

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
import { BañosQuimicosService } from './baños_quimicos.service';
import { CreateBañosQuimicoDto } from './dto/create-baños_quimico.dto';
import { UpdateBañosQuimicoDto } from './dto/update-baños_quimico.dto';
import { FilterBañosQuimicoDto } from './dto/filter-baños_quimico.dto';
import { BañosQuimico } from './entities/baños_quimico.entity';

@Controller('banos-quimicos')
export class BañosQuimicosController {
  constructor(private readonly bañosQuimicosService: BañosQuimicosService) {}

  @Post()
  async create(
    @Body() createBañosQuimicoDto: CreateBañosQuimicoDto,
  ): Promise<BañosQuimico> {
    return this.bañosQuimicosService.create(createBañosQuimicoDto);
  }

  @Get()
  async findAll(): Promise<BañosQuimico[]> {
    return this.bañosQuimicosService.findAll();
  }

  @Get('search')
  async search(
    @Query() filterDto: FilterBañosQuimicoDto,
  ): Promise<BañosQuimico[]> {
    return this.bañosQuimicosService.findAllWithFilters(filterDto);
  }

  @Get(':id')
  async findById(@Param('id') id: number): Promise<BañosQuimico> {
    return this.bañosQuimicosService.findById(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: number,
    @Body() updateBañosQuimicoDto: UpdateBañosQuimicoDto,
  ): Promise<BañosQuimico> {
    return this.bañosQuimicosService.update(id, updateBañosQuimicoDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: number): Promise<void> {
    return this.bañosQuimicosService.remove(id);
  }
}

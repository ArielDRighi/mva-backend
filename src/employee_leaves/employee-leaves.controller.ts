import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../roles/guards/roles.guard';
import { Roles } from '../roles/decorators/roles.decorator';
import { Role } from '../roles/enums/role.enum';
import { EmployeeLeavesService } from './employee-leaves.service';
import { CreateEmployeeLeaveDto } from './dto/create-employee-leave.dto';
import { UpdateEmployeeLeaveDto } from './dto/update-employee-leave.dto';

@Controller('employee-leaves')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmployeeLeavesController {
  constructor(private readonly leavesService: EmployeeLeavesService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  create(@Body() createLeaveDto: CreateEmployeeLeaveDto) {
    return this.leavesService.create(createLeaveDto);
  }

  @Get()
  findAll(@Query('page') page = 1, @Query('limit') limit = 10) {
    return this.leavesService.findAll({
      page: +page,
      limit: +limit,
    });
  }
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.leavesService.findOne(+id);
  }

  @Get('employee/:id')
  findByEmployee(@Param('id') id: string) {
    return this.leavesService.findByEmployee(+id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  update(
    @Param('id') id: string,
    @Body() updateLeaveDto: UpdateEmployeeLeaveDto,
  ) {
    return this.leavesService.update(+id, updateLeaveDto);
  }

  @Patch(':id/approve')
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  approve(@Param('id') id: string) {
    return this.leavesService.update(+id, { aprobado: true });
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  remove(@Param('id') id: string) {
    return this.leavesService.remove(+id);
  }
}

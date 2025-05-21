import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
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
  create(@Body() createLeaveDto: CreateEmployeeLeaveDto) {
    return this.leavesService.create(createLeaveDto);
  }

  @Get()
  findAll() {
    return this.leavesService.findAll();
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
  approve(@Param('id') id: number) {
    return this.leavesService.approve(id);
  }

  @Patch(':id/reject')
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  reject(@Param('id') id: number) {
    return this.leavesService.reject(id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.leavesService.remove(+id);
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Request,
  UseGuards,
  UseInterceptors,
  Patch,
  Req,
  UnauthorizedException,
  Query,
} from '@nestjs/common';
import { SalaryAdvanceService } from './salary_advance.service';
import { CreateAdvanceDto } from './dto/create-salary_advance.dto';
import { AuthGuard } from '@nestjs/passport';
import { MailerInterceptor } from 'src/mailer/interceptor/mailer.interceptor';
import { ApproveAdvanceDto } from './dto/approve-advance.dto';
import { Roles } from 'src/roles/decorators/roles.decorator';
import { Role } from 'src/roles/enums/role.enum';
import { RolesGuard } from 'src/roles/guards/roles.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
@UseInterceptors(MailerInterceptor)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('salary-advances')
export class SalaryAdvanceController {
  constructor(private readonly advanceService: SalaryAdvanceService) {}

  @Post()
  @UseGuards(AuthGuard('jwt')) // Asegúrate de usar el guard de JWT
  create(@Body() dto: CreateAdvanceDto, @Request() req: { user?: any }) {
    // Pasa tanto el dto como el user (req.user) al servicio
    return this.advanceService.createAdvance(dto, req?.user);
  }

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.advanceService.getAll(status, page, limit);
  }

  @Roles(Role.ADMIN)
  @Patch('update/:id')
  approveOrRejectAdvance(
    @Param('id') id: string,
    @Body() dto: ApproveAdvanceDto,
    @Req() req: { user?: { userId: string } },
  ) {
    // Cambiar sub a userId
    const adminId: string | undefined = req.user?.userId; // Ahora accedemos a userId en lugar de sub
    if (!adminId) {
      throw new UnauthorizedException();
    }

    if (dto.status === 'approved') {
      console.log('Approving advance');
      return this.advanceService.approve(id, adminId);
    } else {
      console.log('Rejecting advance');
      return this.advanceService.reject(id);
    }
  }

  @Get('employee')
  getEmployeeAdvances(@Request() req: { user?: any }) {
    // Asegúrate de que el usuario esté autenticado
    if (!req.user) {
      throw new UnauthorizedException('Usuario no autenticado');
    }
    // Pasa el user al servicio
    return this.advanceService.getEmployeeAdvances(req.user);
  }
}

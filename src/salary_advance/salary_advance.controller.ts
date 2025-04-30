import { Controller, Get, Post, Body, Param, Request, UseGuards, UseInterceptors, Patch, Req, UnauthorizedException } from '@nestjs/common';
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
  @UseGuards(AuthGuard('jwt'))  // Asegúrate de usar el guard de JWT
  create(@Body() dto: CreateAdvanceDto, @Request() req) {
    // Pasa tanto el dto como el user (req.user) al servicio
    return this.advanceService.createAdvance(dto, req.user);
  }


  @Get()
  findAll() {
    return this.advanceService.getAll();
  }
 
  @Roles(Role.ADMIN)
  @Patch(':id')
  approveOrRejectAdvance(
    @Param('id') id: string,
    @Body() dto: ApproveAdvanceDto,
    @Req() req: any
  ) {
      
    // Cambiar sub a userId
    const adminId = req.user?.userId;  // Ahora accedemos a userId en lugar de sub
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
    
}

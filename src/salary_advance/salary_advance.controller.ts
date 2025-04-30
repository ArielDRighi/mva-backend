import { Controller, Get, Post, Body, Param, Request, UseGuards, UseInterceptors } from '@nestjs/common';
import { SalaryAdvanceService } from './salary_advance.service';
import { CreateAdvanceDto } from './dto/create-salary_advance.dto';
import { AuthGuard } from '@nestjs/passport';
import { MailerInterceptor } from 'src/mailer/interceptor/mailer.interceptor';
@UseInterceptors(MailerInterceptor)
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

  @Post(':id/approve')
  approve(@Param('id') id: string, @Body() dto: any) {
    return this.advanceService.approve(id, dto.adminId);
  }

  @Post(':id/reject')
  reject(@Param('id') id: string) {
    return this.advanceService.reject(id);
  }
}

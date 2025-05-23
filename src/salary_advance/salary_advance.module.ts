import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalaryAdvanceController } from './salary_advance.controller';
import { SalaryAdvanceService } from './salary_advance.service';
import { Empleado } from 'src/employees/entities/employee.entity';
import { SalaryAdvance } from './entities/salary_advance.entity';
import { MailerModule } from 'src/mailer/mailer.module';

@Module({
  imports: [TypeOrmModule.forFeature([SalaryAdvance, Empleado]), MailerModule],
  controllers: [SalaryAdvanceController],
  providers: [SalaryAdvanceService],
})
export class SalaryAdvanceModule {}

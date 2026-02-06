import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeeLeave } from './entities/employee-leave.entity';
import { EmployeeLeavesService } from './employee-leaves.service';
import { EmployeeLeavesController } from './employee-leaves.controller';
import { EmployeesModule } from '../employees/employees.module';
import { MailerModule } from '../mailer/mailer.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmployeeLeave]),
    EmployeesModule, // Para acceder a EmployeesService
    MailerModule, // Necesario para MailerInterceptor
  ],
  controllers: [EmployeeLeavesController],
  providers: [EmployeeLeavesService],
  exports: [EmployeeLeavesService], // Exportamos el servicio para usarlo en otros módulos
})
export class EmployeeLeavesModule {}

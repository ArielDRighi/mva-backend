import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Empleado } from './entities/employee.entity';
import { EmployeesService } from './employees.service';
import { EmployeesController } from './employees.controller';
import { RolesModule } from '../roles/roles.module';
import { Licencias } from './entities/license.entity';
import { ContactosEmergencia } from './entities/emergencyContacts.entity';
import { LicenseAlertService } from './LicenseAlert.service';
import { MailerModule } from 'src/mailer/mailer.module';
import { ExamenPreocupacional } from './entities/examenPreocupacional.entity';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Empleado,
      Licencias,
      ContactosEmergencia,
      Licencias,
      ExamenPreocupacional,
    ]),
    RolesModule,
    MailerModule,
    UsersModule,
  ],
  controllers: [EmployeesController],
  providers: [EmployeesService, LicenseAlertService],
  exports: [EmployeesService],
})
export class EmployeesModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Empleado } from './entities/employee.entity';
import { EmployeesService } from './employees.service';
import { EmployeesController } from './employees.controller';
import { RolesModule } from '../roles/roles.module';
import { Licencias } from './entities/license.entity';
import { ContactosEmergencia } from './entities/emergencyContacts.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Empleado, Licencias, ContactosEmergencia]),
    RolesModule,
  ],
  controllers: [EmployeesController],
  providers: [EmployeesService],
  exports: [EmployeesService],
})
export class EmployeesModule {}

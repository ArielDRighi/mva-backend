import { Module, forwardRef } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from '../services/entities/service.entity';
import { ChemicalToilet } from '../chemical_toilets/entities/chemical_toilet.entity';
import { ContractExpirationService } from './services/contract-expiration.service';
import { EmployeeLeaveSchedulerService } from './services/employee-leave-scheduler.service';
import { EmployeeLeave } from '../employee_leaves/entities/employee-leave.entity';
import { EmployeesService } from '../employees/employees.service';
import { Empleado } from '../employees/entities/employee.entity';
import { Licencias } from '../employees/entities/license.entity';
import { ContactosEmergencia } from '../employees/entities/emergencyContacts.entity';
import { ExamenPreocupacional } from '../employees/entities/examenPreocupacional.entity';
import { RolesModule } from '../roles/roles.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([
      Service, 
      ChemicalToilet, 
      EmployeeLeave, 
      Empleado,
      Licencias,
      ContactosEmergencia,
      ExamenPreocupacional
    ]),
    RolesModule,
    forwardRef(() => UsersModule),
  ],
  providers: [
    ContractExpirationService, 
    EmployeeLeaveSchedulerService,
    EmployeesService, // Solo EmployeesService, NO LicenseAlertService
  ],
  exports: [ContractExpirationService, EmployeeLeaveSchedulerService],
})
export class SchedulerModule {}

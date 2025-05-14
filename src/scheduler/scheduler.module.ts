import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from '../services/entities/service.entity';
import { ChemicalToilet } from '../chemical_toilets/entities/chemical_toilet.entity';
import { ContractExpirationService } from './services/contract-expiration.service';
import { EmployeeLeaveSchedulerService } from './services/employee-leave-scheduler.service';
import { EmployeeLeave } from '../employee_leaves/entities/employee-leave.entity';
import { EmployeesModule } from '../employees/employees.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([Service, ChemicalToilet, EmployeeLeave]),
    EmployeesModule,
  ],
  providers: [ContractExpirationService, EmployeeLeaveSchedulerService],
  exports: [ContractExpirationService, EmployeeLeaveSchedulerService],
})
export class SchedulerModule {}

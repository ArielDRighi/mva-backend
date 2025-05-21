import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from './config/config.module';
import { ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { ClientsModule } from './clients/clients.module';
import { ChemicalToiletsModule } from './chemical_toilets/chemical_toilets.module';
import { ToiletMaintenanceModule } from './toilet_maintenance/toilet_maintenance.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { VehicleMaintenanceModule } from './vehicle_maintenance/vehicle_maintenance.module';
import { ContractualConditionsModule } from './contractual_conditions/contractual_conditions.module';
import { EmployeesModule } from './employees/employees.module';
import { ServicesModule } from './services/services.module';
import { ScheduleModule } from '@nestjs/schedule';
import { FutureCleaningsModule } from './future_cleanings/futureCleanings.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { ClientsPortalModule } from './clients_portal/clientsPortal.module';
import { EmployeeLeavesModule } from './employee_leaves/employee-leaves.module';
import { MailerModule } from './mailer/mailer.module';
import { SalaryAdvanceModule } from './salary_advance/salary_advance.module';
import { ClothingModule } from './clothing/clothing.module';
import { RecentActivityModule } from './recent-activity/recent-activity.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        ...(await configService.get('database')),
      }),
    }),
    AuthModule,
    UsersModule,
    RolesModule,
    ClientsModule,
    ChemicalToiletsModule,
    ToiletMaintenanceModule,
    VehiclesModule,
    VehicleMaintenanceModule,
    ContractualConditionsModule,
    EmployeesModule,
    ServicesModule,
    ScheduleModule.forRoot(),
    FutureCleaningsModule,
    SchedulerModule,
    ClientsPortalModule,
    EmployeeLeavesModule,
    MailerModule,
    SalaryAdvanceModule,
    ClothingModule,
    RecentActivityModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

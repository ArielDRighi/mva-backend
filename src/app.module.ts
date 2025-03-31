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
import { VehicleMaintenanceModule } from './vehicle_maintenance/vehicle-maintenance.module';

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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

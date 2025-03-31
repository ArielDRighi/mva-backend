import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from './config/config.module';
import { ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { ClientModule } from './clientes/client.module';
import { BañosQuimicosModule } from './baños_quimicos/baños_quimicos.module';
import { MantenimientoBañosModule } from './mantenimiento_baños/mantenimiento_baños.module';

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
    ClientModule,
    BañosQuimicosModule,
    MantenimientoBañosModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

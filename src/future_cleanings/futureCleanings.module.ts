import { Module } from '@nestjs/common';
import { FutureCleaningsController } from './futureCleanings.controller';
import { FutureCleaningsService } from './futureCleanings.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FuturasLimpiezas } from './entities/futureCleanings.entity';
import { Cliente } from 'src/clients/entities/client.entity';
import { Service } from 'src/services/entities/service.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FuturasLimpiezas, Cliente, Service])],
  controllers: [FutureCleaningsController],
  providers: [FutureCleaningsService],
  exports: [FutureCleaningsService],
})
export class FutureCleaningsModule {}

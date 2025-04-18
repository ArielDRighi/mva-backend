import { Module } from '@nestjs/common';
import { FutureCleaningsController } from './futureCleanings.controller';
import { FutureCleaningsService } from './futureCleanings.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FuturasLimpiezas } from './entities/futureCleanings.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FuturasLimpiezas])],
  controllers: [FutureCleaningsController],
  providers: [FutureCleaningsService],
  exports: [FutureCleaningsService],
})
export class FutureCleaningsModule {}

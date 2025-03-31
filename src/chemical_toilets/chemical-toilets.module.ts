import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChemicalToilet } from './entities/chemical-toilet.entity';
import { ChemicalToiletsService } from './chemical-toilets.service';
import { ChemicalToiletsController } from './chemical-toilets.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ChemicalToilet])],
  controllers: [ChemicalToiletsController],
  providers: [ChemicalToiletsService],
  exports: [ChemicalToiletsService],
})
export class ChemicalToiletsModule {}

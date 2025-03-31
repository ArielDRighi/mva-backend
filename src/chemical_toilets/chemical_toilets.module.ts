import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChemicalToilet } from './entities/chemical_toilet.entity';
import { ChemicalToiletsService } from './chemical_toilets.service';
import { ChemicalToiletsController } from './chemical_toilets.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ChemicalToilet])],
  controllers: [ChemicalToiletsController],
  providers: [ChemicalToiletsService],
  exports: [ChemicalToiletsService],
})
export class ChemicalToiletsModule {}

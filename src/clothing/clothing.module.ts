import { Module } from '@nestjs/common';
import { ClothingService } from './clothing.service';
import { ClothingController } from './clothing.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RopaTalles } from './entities/clothing.entity';
import { Empleado } from 'src/employees/entities/employee.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RopaTalles, Empleado])],
  controllers: [ClothingController],
  providers: [ClothingService],
})
export class ClothingModule {}

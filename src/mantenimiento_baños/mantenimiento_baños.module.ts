import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MantenimientoBañoService } from './mantenimiento_baños.service';
import { MantenimientoBañoController } from './mantenimiento_baños.controller';
import { MantenimientoBaño } from './entities/mantenimiento_baño.entity';
import { BañosQuimico } from 'src/baños_quimicos/entities/baños_quimico.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MantenimientoBaño, BañosQuimico])],
  controllers: [MantenimientoBañoController],
  providers: [MantenimientoBañoService],
  exports: [MantenimientoBañoService],
})
export class MantenimientoBañosModule {}

import { Module } from '@nestjs/common';
import { MantenimientoBañosService } from './mantenimiento_baños.service';
import { MantenimientoBañosController } from './mantenimiento_baños.controller';

@Module({
  controllers: [MantenimientoBañosController],
  providers: [MantenimientoBañosService],
})
export class MantenimientoBañosModule {}

import { Module } from '@nestjs/common';
import { BañosQuimicosService } from './baños_quimicos.service';
import { BañosQuimicosController } from './baños_quimicos.controller';

@Module({
  controllers: [BañosQuimicosController],
  providers: [BañosQuimicosService],
})
export class BañosQuimicosModule {}

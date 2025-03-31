import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BañosQuimico } from './entities/baños_quimico.entity';
import { BañosQuimicosService } from './baños_quimicos.service';
import { BañosQuimicosController } from './baños_quimicos.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BañosQuimico])],
  controllers: [BañosQuimicosController],
  providers: [BañosQuimicosService],
  exports: [BañosQuimicosService],
})
export class BañosQuimicosModule {}

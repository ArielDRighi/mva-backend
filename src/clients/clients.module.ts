import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientController } from './clients.controller';
import { ClientService } from './clients.service';
import { Cliente } from './entities/client.entity';
import { ChemicalToiletsModule } from '../chemical_toilets/chemical_toilets.module';
import { CondicionesContractuales } from '../contractual_conditions/entities/contractual_conditions.entity';
import { RolesModule } from '../roles/roles.module';
import { FuturasLimpiezas } from 'src/future_cleanings/entities/futureCleanings.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Cliente,
      CondicionesContractuales,
      FuturasLimpiezas,
    ]),
    forwardRef(() => ChemicalToiletsModule),
    RolesModule,
  ],
  controllers: [ClientController],
  providers: [ClientService],
  exports: [ClientService],
})
export class ClientsModule {}

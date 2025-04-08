import { Module } from '@nestjs/common';
import { ClientsPortalController } from './clientsPortal.controller';
import { ClientsPortalService } from './clientsPortal.service';

@Module({
  imports: [],
  controllers: [ClientsPortalController],
  providers: [ClientsPortalService],
  exports: [ClientsPortalService],
})
export class ClientsPortalModule {}

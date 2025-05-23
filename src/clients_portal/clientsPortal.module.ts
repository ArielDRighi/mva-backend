import { Module } from '@nestjs/common';
import { ClientsPortalController } from './clientsPortal.controller';
import { ClientsPortalService } from './clientsPortal.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SatisfactionSurvey } from './entities/satisfactionSurvey.entity';
import { Claim } from './entities/claim.entity';
import { MailerModule } from 'src/mailer/mailer.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SatisfactionSurvey, Claim]),
    MailerModule,
  ],
  controllers: [ClientsPortalController],
  providers: [ClientsPortalService],
  exports: [ClientsPortalService],
})
export class ClientsPortalModule {}

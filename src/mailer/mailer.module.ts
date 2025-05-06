// src/mailer/mailer.module.ts
import { Module } from '@nestjs/common';
import { MailerService } from './mailer.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Licencias } from 'src/employees/entities/license.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Licencias])],
  providers: [MailerService],
  exports: [MailerService],
})
export class MailerModule {}

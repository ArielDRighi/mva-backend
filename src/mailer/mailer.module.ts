// src/mailer/mailer.module.ts
import { Module } from '@nestjs/common';
import { MailerService } from './mailer.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Licencias } from 'src/employees/entities/license.entity';
import { ChemicalToilet } from 'src/chemical_toilets/entities/chemical_toilet.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Licencias, ChemicalToilet])],
  providers: [MailerService],
  exports: [MailerService],
})
export class MailerModule {}

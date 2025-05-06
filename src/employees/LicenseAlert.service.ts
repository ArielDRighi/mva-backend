import { MailerService } from 'src/mailer/mailer.service';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Licencias } from './entities/license.entity';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class LicenseAlertService {
  private readonly logger = new Logger(LicenseAlertService.name);

  constructor(
    @InjectRepository(Licencias)
    private readonly licenciasRepository: Repository<Licencias>,
    private readonly mailerService: MailerService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_8AM) // Ejecutar diariamente a las 8am
  async checkExpiringLicenses() {
    this.logger.log('Verificando licencias próximas a vencer...');

    // Calcular fechas para alertas (30 días antes del vencimiento)
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    // Buscar licencias que vencen en los próximos 30 días
    const expiringLicenses = await this.licenciasRepository.find({
      where: {
        fecha_vencimiento: Between(today, thirtyDaysFromNow),
      },
      relations: ['empleado'],
    });

    if (expiringLicenses.length > 0) {
      this.logger.log(
        `Se encontraron ${expiringLicenses.length} licencias próximas a vencer`,
      );
      await this.sendExpiringLicenseNotifications(expiringLicenses);
    } else {
      this.logger.log('No hay licencias próximas a vencer');
    }
  }

  private async sendExpiringLicenseNotifications(licenses: Licencias[]) {
    // Obtener emails de administradores y supervisores
    const adminEmails = await this.mailerService.getAdminEmails();
    const supervisorEmails = await this.mailerService.getSupervisorEmails();

    await this.mailerService.sendExpiringLicenseAlert(
      adminEmails,
      supervisorEmails,
      licenses,
    );
  }
}

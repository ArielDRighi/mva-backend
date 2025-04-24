//mailer.service.ts
import * as nodemailer from 'nodemailer';
import { Injectable } from '@nestjs/common';
import { Role } from 'src/roles/enums/role.enum';
import { User } from 'src/users/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ArrayContains, Repository } from 'typeorm';
import { generateEmailContent } from './utils/mailer.utils';

@Injectable()
export class MailerService {
  private transporter;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  // Función para enviar el correo
  async sendMail(mailOptions: any): Promise<void> {
    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Correo enviado a ${mailOptions.to}`);
    } catch (error) {
      console.error(`Error al enviar el correo a ${mailOptions.to}`, error);
    }
  }

  // Función para generar contenido del correo
  generateEmailContent(title: string, body: string): string {
    return generateEmailContent(title, body);
  }

  // Función para enviar el correo de asignación de ruta
  async sendRoute(
    email: string,
    name: string,
    vehicle: string,
    toilets: string[],
    clients: string[],
    serviceType: string,
    taskDate: string
  ): Promise<void> {
    const subject = '🚚 ¡Nueva ruta de trabajo asignada!';

    // Crear contenido del cuerpo del correo
    const body = `
      <p style="font-size: 16px;">¡Hola ${name}!</p>
      <p style="font-size: 16px;">Se te ha asignado una nueva ruta de trabajo para el día <strong>${taskDate}</strong>.</p>
      <p style="font-size: 16px;">Detalles de la ruta:</p>
      <ul>
        <li><strong>Vehículo a utilizar:</strong> ${vehicle}</li>
        <li><strong>Tipo de servicio:</strong> ${serviceType}</li>
        <li><strong>Baños a trasladar o mantener:</strong></li>
        <ul>
          ${toilets.map((toilet) => `<li>${toilet}</li>`).join('')}
        </ul>
        <li><strong>Clientes a visitar:</strong></li>
        <ul>
          ${clients.map((client) => `<li>${client}</li>`).join('')}
        </ul>
      </ul>
      <p style="font-size: 16px;">¡Gracias por tu compromiso y buen trabajo!</p>
    `;

    // Generar contenido HTML para el correo
    const htmlContent = this.generateEmailContent('¡Nueva ruta de trabajo asignada!', body);

    // Opciones del correo
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject,
      html: htmlContent,
    };

    // Enviar el correo
    try {
      await this.sendMail(mailOptions);
    } catch (error) {
      console.error(`Error al enviar el correo a ${email}`, error);
    }
  }

  // Función para enviar correo de modificaciones de ruta
  async sendRouteModified(
    email: string,
    name: string,
    vehicle: string,
    toilets: string[],
    clients: string[],
    serviceType: string,
    taskDate: string
  ): Promise<void> {
    const subject = '🔔 ¡Tu ruta asignada sufrió modificaciones!';

    let body = `
      <p style="font-size: 16px;">¡Hola ${name}!</p>
      <p style="font-size: 16px;">Queremos informarte que tu ruta asignada ha sido actualizada para el día <strong>${taskDate}</strong>.</p>
      <p style="font-size: 16px;">Aquí están los detalles de la nueva ruta asignada:</p>
      <ul>
        <li><strong>Vehículo asignado:</strong> ${vehicle}</li>
        <li><strong>Tipo de servicio:</strong> ${serviceType}</li>
        <li><strong>Baños a trasladar o mantener:</strong></li>
        <ul>
          ${toilets.map((toilet) => `<li>${toilet}</li>`).join('')}
        </ul>
        <li><strong>Clientes a visitar:</strong></li>
        <ul>
          ${clients.map((client) => `<li>${client}</li>`).join('')}
        </ul>
      </ul>
      <p style="font-size: 16px;">Asegúrate de revisar los cambios y estar preparado para la nueva ruta. ¡Gracias por tu trabajo!</p>
    `;

    const htmlContent = this.generateEmailContent('¡Tu ruta asignada sufrió modificaciones!', body);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject,
      html: htmlContent,
    };

    try {
      await this.sendMail(mailOptions);
    } catch (error) {
      console.error(`Error al enviar el correo de modificaciones a ${email}`, error);
    }
  }

  // Función para enviar correo de tarea en curso
  async sendInProgressNotification(
    adminsEmails: string[],
    supervisorsEmails: string[],
    employeeName: string,
    taskDetails: {
      client: string;
      vehicle: string;
      serviceType: string;
      toilets: string[];
      taskDate: string;
    }
  ): Promise<void> {
    const subject = '🚚 ¡El trabajo asignado ha comenzado!';

    const body = `
      <p style="font-size: 16px;">¡Hola!</p>
      <p style="font-size: 16px;">El trabajo asignado a <strong>${employeeName}</strong> ha <strong>comenzado</strong> según lo programado.</p>
      <p style="font-size: 16px;">Aquí están los detalles de la tarea en curso:</p>
      <ul>
        <li><strong>Cliente:</strong> ${taskDetails.client}</li>
        <li><strong>Vehículo utilizado:</strong> ${taskDetails.vehicle}</li>
        <li><strong>Tipo de servicio:</strong> ${taskDetails.serviceType}</li>
        <li><strong>Baños asignados:</strong> ${taskDetails.toilets.join(', ')}</li>
        <li><strong>Fecha de inicio:</strong> ${taskDetails.taskDate}</li>
      </ul>
      <p style="font-size: 16px;">Este mensaje es solo informativo. Gracias por tu atención.</p>
    `;

    const htmlContent = this.generateEmailContent('¡Tarea en curso!', body);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: [...adminsEmails, ...supervisorsEmails],
      subject,
      html: htmlContent,
    };

    try {
      await this.sendMail(mailOptions);
    } catch (error) {
      console.error('❌ Error al enviar el correo de tarea en progreso', error);
    }
  }

  async sendCompletionNotification(
    adminsEmails: string[], // Lista de correos de administradores
    supervisorsEmails: string[], // Lista de correos de supervisores
    employeeName: string, // Nombre del empleado
    taskDetails: any, // Detalles de la tarea realizada
  ): Promise<void> {
    const subject = '✔️ ¡El trabajo asignado fue completado con éxito!';

    // Cuerpo del correo con la información de la tarea completada
    const body = `
      <p style="font-size: 16px;">¡Hola!</p>
      <p style="font-size: 16px;">El trabajo asignado a <strong>${employeeName}</strong> ha sido completado con éxito.</p>
      <p style="font-size: 16px;">Detalles de la tarea completada:</p>
      <ul>
        <li><strong>Cliente visitado:</strong> ${taskDetails.client}</li>
        <li><strong>Vehículo utilizado:</strong> ${taskDetails.vehicle}</li>
        <li><strong>Servicio realizado:</strong> ${taskDetails.serviceType}</li>
        <li><strong>Baños atendidos:</strong> ${taskDetails.toilets.join(', ')}</li>
        <li><strong>Fecha de ejecución:</strong> ${taskDetails.taskDate}</li>
      </ul>
      <p style="font-size: 16px;">Gracias por tu atención.</p>
    `;

    const htmlContent = this.generateEmailContent('¡Trabajo completado con éxito!', body);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: [...adminsEmails, ...supervisorsEmails],// Correo para todos los admins y supervisores
      subject,
      html: htmlContent,
    };

    try {
      await this.sendMail(mailOptions);
    } catch (error) {
      console.error('Error al enviar el correo de notificación de tarea completada', error);
    }
  }

  // Notificación de reclamo recibido
  async sendClaimNotification(
    adminsEmails: string[],
    supervisorsEmails: string[],
    clientName: string,
    claimTitle: string,
    claimDescription: string,
    claimType: string,
    claimDate: string,
  ): Promise<void> {
    const subject = '📝 ¡Nuevo reclamo recibido!';

    const body = `
      <p style="font-size: 16px;">¡Hola!</p>
      <p style="font-size: 16px;">Se ha recibido un nuevo reclamo de <strong>${clientName}</strong>.</p>
      <p style="font-size: 16px;">Detalles del reclamo:</p>
      <ul>
        <li><strong>Titulo:</strong> ${claimTitle}</li>
        <li><strong>Tipo de reclamo:</strong> ${claimType}</li>
        <li><strong>Descripción:</strong> ${claimDescription}</li>
        <li><strong>Fecha del reclamo:</strong> ${claimDate}</li>
      </ul>
      <p style="font-size: 16px;">Gracias por tu atención.</p>
    `;

    const htmlContent = this.generateEmailContent('¡Nuevo reclamo recibido!', body);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: [...adminsEmails, ...supervisorsEmails].join(','),
      subject,
      html: htmlContent,
    };

    try {
      await this.sendMail(mailOptions);
    } catch (error) {
      console.error('❌ Error al enviar el correo de reclamo', error);
    }
  }

  async getAdminEmails(): Promise<string[]> {
    const admins = await this.userRepository.find({
      where: {
        roles: ArrayContains([Role.ADMIN]),
      },
      select: ['email'],
    });
    return admins.map((admin) => admin.email);
  }
  
  async getSupervisorEmails(): Promise<string[]> {
    const supervisors = await this.userRepository.find({
      where: {
        roles: ArrayContains([Role.SUPERVISOR]),
      },
      select: ['email'],
    });
    return supervisors.map((supervisor) => supervisor.email);
  }
  // Notificación de encuesta recibida
  async sendSurveyNotification(
    adminsEmails: string[],
    supervisorsEmails: string[],
    clientName: string,
    maintenanceDate: Date,
    surveyRating: number,
    surveyComments: string,
    surveyAsunto: string,
    evaluatedAspects: string,
  ): Promise<void> {
    const subject = '⭐ ¡Nueva encuesta de satisfacción recibida!';

    const body = `
      <p style="font-size: 16px;">¡Hola!</p>
      <p style="font-size: 16px;">Se ha recibido una nueva encuesta de satisfacción de <strong>${clientName}</strong>.</p>
      <p style="font-size: 16px;">Detalles de la encuesta:</p>
      <ul>
        <li><strong>Nombre del cliente:</strong> ${clientName}</li>
        <li><strong>Fecha de Mantenimiento:</strong> ${maintenanceDate}</li>
        <li><strong>Calificación general:</strong> ${surveyRating}</li>
        <li><strong>Comentarios:</strong> ${surveyComments}</li>
        <li><strong>Asunto:</strong> ${surveyAsunto}</li>
        <li><strong>Aspecto Evaluado:</strong> ${evaluatedAspects}</li>
      </ul>
      <p style="font-size: 16px;">Gracias por tu atención.</p>
    `;

    const htmlContent = this.generateEmailContent('¡Nueva encuesta de satisfacción recibida!', body);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: [...adminsEmails, ...supervisorsEmails].join(','),
      subject,
      html: htmlContent,
    };

    try {
      await this.sendMail(mailOptions);
    } catch (error) {
      console.error('❌ Error al enviar el correo de encuesta de satisfacción', error);
    }
  }

  // Notificación de nueva solicitud de servicio
async sendServiceNotification(
    adminsEmails: string[],
    supervisorsEmails: string[],
    nombrePersona: string,
    rolPersona: string,
    email: string,
    telefono: string,
    nombreEmpresa: string,
    cuit: string,
    rubroEmpresa: string,
    zonaDireccion: string,
    cantidadBaños: string,
    tipoEvento: string,
    duracionAlquiler: string,
    comentarios: string,
  ): Promise<void> {
    const subject = '🛠️ ¡Nueva solicitud de servicio recibida!';

    const body = `
      <p style="font-size: 16px;">¡Hola!</p>
      <p style="font-size: 16px;">Se ha recibido una nueva solicitud de servicio.</p>
      <p style="font-size: 16px;">Detalles del cliente:</p>
      <ul>
        <li><strong>Nombre de la persona:</strong> ${nombrePersona}</li>
        <li><strong>Rol de la persona:</strong> ${rolPersona}</li>
        <li><strong>Email:</strong> ${email}</li>
        <li><strong>Teléfono:</strong> ${telefono}</li>
      </ul>
      <p style="font-size: 16px;">Detalles de la empresa:</p>
      <ul>
        <li><strong>Nombre de la empresa:</strong> ${nombreEmpresa}</li>
        <li><strong>CUIT:</strong> ${cuit}</li>
        <li><strong>Rubro de la empresa:</strong> ${rubroEmpresa}</li>
        <li><strong>Zona de dirección:</strong> ${zonaDireccion}</li>
      </ul>
      <p style="font-size: 16px;">Detalles del servicio:</p>
      <ul>
        <li><strong>Cantidad de baños:</strong> ${cantidadBaños}</li>
        <li><strong>Tipo de evento:</strong> ${tipoEvento}</li>
        <li><strong>Duración del alquiler:</strong> ${duracionAlquiler}</li>
        <li><strong>Comentarios:</strong> ${comentarios}</li>
      </ul>
      <p style="font-size: 16px;">Gracias por tu atención.</p>
    `;

    const htmlContent = this.generateEmailContent('¡Nueva solicitud de servicio recibida!', body);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: [...adminsEmails, ...supervisorsEmails].join(','),
      subject,
      html: htmlContent,
    };

    try {
      await this.sendMail(mailOptions);
    } catch (error) {
      console.error('❌ Error al enviar el correo de solicitud de servicio', error);
    }
  }
}



import * as dotenv from 'dotenv';
import * as nodemailer from 'nodemailer';
import { PrioridadReclamo } from 'src/clients_portal/entities/claim.entity';
// Usamos import ya que es mejor para TypeScript
dotenv.config({
  path: '.env', // Cargar las variables de entorno desde el archivo .env
});

export function addSignature(content: string): string {
  return `${content}<p>Saludos,<br>El equipo de MVA</p>`;
}

// Verifica si la variable de entorno está correctamente cargada
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.error('Faltan las variables de entorno EMAIL_USER o EMAIL_PASS');
  process.exit(1); // Termina el proceso si faltan las credenciales
}

// Configuración del transporte de Nodemailer
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587, // O usa 465 para SSL
  secure: false, // Cambia a true si usas el puerto 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

function generateEmailContent(title: string, body: string): string {
  return addSignature(`
    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #7E3AF2; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">${title}</h1>
      </div>
      <div style="padding: 20px;">
        ${body}
      </div>
      <div style="background-color: #f4f4f4; color: #777; padding: 10px; text-align: center; font-size: 14px;">
        <p style="margin: 0;">© 2025 MVA SRL. Todos los derechos reservados.</p>
      </div>
    </div>
  `);
}

// Función para generar el correo de asignación de ruta
export const sendRoute = async (
  email: string,
  name: string,
  vehicle: string,
  toilets: string[],
  clients: string[],
  serviceType: string,
  taskDate: string,
): Promise<void> => {
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
  const htmlContent = generateEmailContent(
    '¡Nueva ruta de trabajo asignada!',
    body,
  );

  // Opciones del correo
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject,
    html: htmlContent,
  };

  // Enviar el correo
  try {
    await transporter.sendMail(mailOptions);
    console.log(`Correo enviado a ${email}`);
  } catch (error) {
    console.error(`Error al enviar el correo a ${email}`, error);
  }
};

export const sendRouteModified = async (
  email: string,
  name: string,
  vehicle: string,
  toilets: string[],
  clients: string[],
  serviceType: string,
  taskDate: string,
): Promise<void> => {
  const subject = '🔔 ¡Tu ruta asignada sufrió modificaciones!';

  // Cuerpo del correo con la información de la nueva ruta
  const body = `
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

  // Generar contenido HTML para el correo
  const htmlContent = generateEmailContent(
    '¡Tu ruta asignada sufrió modificaciones!',
    body,
  );

  // Opciones del correo
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject,
    html: htmlContent,
  };

  // Enviar el correo
  try {
    await transporter.sendMail(mailOptions);
    console.log(`Correo de modificaciones enviado a ${email}`);
  } catch (error) {
    console.error(
      `Error al enviar el correo de modificaciones a ${email}`,
      error,
    );
  }
};
export const sendInProgressNotification = async (
  adminsEmails: string[],
  supervisorsEmails: string[],
  employeeName: string,
  taskDetails: {
    client: string;
    vehicle: string;
    serviceType: string;
    toilets: string[];
    taskDate: string;
  },
): Promise<void> => {
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

  const htmlContent = generateEmailContent('¡Tarea en curso!', body);

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: [...adminsEmails, ...supervisorsEmails],
    subject,
    html: htmlContent,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('📨 Correo de tarea en progreso enviado');
  } catch (error) {
    console.error('❌ Error al enviar el correo de tarea en progreso', error);
  }
};

// En tu archivo de configuración de nodemailer

export const sendCompletionNotification = async (
  adminsEmails: string[], // Lista de correos de administradores
  supervisorsEmails: string[], // Lista de correos de supervisores
  employeeName: string, // Nombre del empleado
  taskDetails: any, // Detalles de la tarea realizada
): Promise<void> => {
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

  // Generar contenido HTML para el correo
  const htmlContent = generateEmailContent(
    '¡Trabajo completado con éxito!',
    body,
  );

  // Opciones del correo
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: [...adminsEmails, ...supervisorsEmails], // Correo para todos los admins y supervisores
    subject,
    html: htmlContent,
  };

  // Enviar el correo
  try {
    await transporter.sendMail(mailOptions);
    console.log('Correo de notificación de tarea completada enviado');
  } catch (error) {
    console.error(
      'Error al enviar el correo de notificación de tarea completada',
      error,
    );
  }
};

export const sendClaimNotification = async (
  adminsEmails: string[],
  supervisorsEmails: string[],
  clientName: string,
  claimTitle: string,
  claimDescription: string,
  claimType: string,
  claimDate: string,
): Promise<void> => {
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

  const htmlContent = generateEmailContent('¡Nuevo reclamo recibido!', body);

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: [...adminsEmails, ...supervisorsEmails],
    subject,
    html: htmlContent,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('📨 Correo de reclamo enviado');
  } catch (error) {
    console.error('❌ Error al enviar el correo de reclamo', error);
  }
};

export const sendSurveyNotification = async (
  adminsEmails: string[],
  supervisorsEmails: string[],
  clientName: string,
  maintenanceDate: Date,
  surveyRating: number,
  surveyComments: string,
  surveyAsunto: string,
  evaluatedAspects: string,
): Promise<void> => {
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

  const htmlContent = generateEmailContent(
    '¡Nueva encuesta de satisfacción recibida!',
    body,
  );

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: [...adminsEmails, supervisorsEmails],
    subject,
    html: htmlContent,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('📨 Correo de encuesta de satisfacción enviado');
  } catch (error) {
    console.error(
      '❌ Error al enviar el correo de encuesta de satisfacción',
      error,
    );
  }
};

export const sendServiceNotification = async (
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
): Promise<void> => {
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

  const htmlContent = generateEmailContent(
    '¡Nueva solicitud de servicio recibida!',
    body,
  );

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: [...adminsEmails, supervisorsEmails],
    subject,
    html: htmlContent,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('📨 Correo de solicitud de servicio enviado');
  } catch (error) {
    console.error(
      '❌ Error al enviar el correo de solicitud de servicio',
      error,
    );
  }
};

import * as dotenv from 'dotenv';
import nodemailer from 'nodemailer'; // Usamos import ya que es mejor para TypeScript
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
        <p style="margin: 0;">© 2024 Eventop. Todos los derechos reservados.</p>
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
  taskDate: string
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
        ${toilets.map(toilet => `<li>${toilet}</li>`).join('')}
      </ul>
      <li><strong>Clientes a visitar:</strong></li>
      <ul>
        ${clients.map(client => `<li>${client}</li>`).join('')}
      </ul>
    </ul>
    <p style="font-size: 16px;">¡Gracias por tu compromiso y buen trabajo!</p>
  `;

  // Generar contenido HTML para el correo
  const htmlContent = generateEmailContent('¡Nueva ruta de trabajo asignada!', body);

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
  taskDate: string
): Promise<void> => {
  const subject = '🔔 ¡Tu ruta asignada sufrió modificaciones!';

  // Cuerpo del correo con la información de la nueva ruta
  let body = `
    <p style="font-size: 16px;">¡Hola ${name}!</p>
    <p style="font-size: 16px;">Queremos informarte que tu ruta asignada ha sido actualizada para el día <strong>${taskDate}</strong>.</p>
    <p style="font-size: 16px;">Aquí están los detalles de la nueva ruta asignada:</p>
    <ul>
      <li><strong>Vehículo asignado:</strong> ${vehicle}</li>
      <li><strong>Tipo de servicio:</strong> ${serviceType}</li>
      <li><strong>Baños a trasladar o mantener:</strong></li>
      <ul>
        ${toilets.map(toilet => `<li>${toilet}</li>`).join('')}
      </ul>
      <li><strong>Clientes a visitar:</strong></li>
      <ul>
        ${clients.map(client => `<li>${client}</li>`).join('')}
      </ul>
    </ul>
    <p style="font-size: 16px;">Asegúrate de revisar los cambios y estar preparado para la nueva ruta. ¡Gracias por tu trabajo!</p>
  `;

  // Generar contenido HTML para el correo
  const htmlContent = generateEmailContent('¡Tu ruta asignada sufrió modificaciones!', body);

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
    console.error(`Error al enviar el correo de modificaciones a ${email}`, error);
  }
};

// En tu archivo de configuración de nodemailer

export const sendCompletionNotification = async (
  adminsEmails: string[],  // Lista de correos de administradores
  supervisorsEmails: string[],  // Lista de correos de supervisores
  employeeName: string,  // Nombre del empleado
  taskDetails: any  // Detalles de la tarea realizada
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
  const htmlContent = generateEmailContent('¡Trabajo completado con éxito!', body);

  // Opciones del correo
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: [...adminsEmails, ...supervisorsEmails],  // Correo para todos los admins y supervisores
    subject,
    html: htmlContent,
  };

  // Enviar el correo
  try {
    await transporter.sendMail(mailOptions);
    console.log('Correo de notificación de tarea completada enviado');
  } catch (error) {
    console.error('Error al enviar el correo de notificación de tarea completada', error);
  }
};
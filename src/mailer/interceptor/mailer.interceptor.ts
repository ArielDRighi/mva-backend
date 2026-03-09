import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { groupBy } from 'lodash';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { MailerService } from '../mailer.service';
import { Service } from 'src/services/entities/service.entity';
import { ServiceState } from 'src/common/enums/resource-states.enum';

/**
 * Tipo para los datos del formulario de solicitud de servicio
 */
interface ServiceRequestForm {
  nombrePersona?: string;
  rolPersona?: string;
  email?: string;
  telefono?: string;
  nombreEmpresa?: string;
  cuit?: string;
  rubroEmpresa?: string;
  zonaDireccion?: string;
  cantidadBaños?: string;
  tipoEvento?: string;
  duracionAlquiler?: string;
  comentarios?: string;
}

/**
 * Interceptor para envío automático de correos electrónicos en diferentes acciones
 */
@Injectable()
export class MailerInterceptor implements NestInterceptor {
  constructor(
    private readonly mailerService: MailerService,
    private readonly reflector: Reflector,
    private readonly dataSource: DataSource,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      tap(async (data: any) => {
        const req = context.switchToHttp().getRequest();
        const method = req.method;
        const path = req.url;

        console.log('[MailerInterceptor] Método:', method);
        console.log('[MailerInterceptor] Path:', path);

        // Verificar que data sea un objeto válido
        if (!data || typeof data !== 'object') {
          console.warn('[MailerInterceptor] Datos no válidos:', data);
          return;
        }

        // -- Servicios con asignaciones (usado en varios bloques) --
        const servicio: Service = data;
        const asignaciones = servicio?.asignaciones || [];

        // Verificar si estamos manejando un servicio válido con asignaciones
        if (!servicio || !Array.isArray(asignaciones)) {
          console.warn(
            '[MailerInterceptor] Servicio o asignaciones no válidos',
          );
          return;
        }

        // 1. Creación → POST /services
        await this.handleServiceCreation(method, path, servicio, asignaciones);

        // 2. Modificación → PUT /services/:id
        await this.handleServiceModification(
          method,
          path,
          servicio,
          asignaciones,
        );

        // 3. Estado → PATCH /services/:id/estado
        await this.handleServiceStatusChange(
          method,
          path,
          servicio,
          asignaciones,
        );

        // 4. Reclamo → POST /clients_portal/claims
        await this.handleClaimNotification(method, path, data);

        // 5. Encuesta → POST /clients_portal/satisfaction_surveys
        await this.handleSurveyNotification(method, path, data);

        // 6. Servicio → POST /clients_portal/ask_for_service
        await this.handleServiceRequest(method, path, req);

        // 7. Reseteo de contraseña → POST /auth/forgot-password
        await this.handlePasswordReset(method, path, data);

        // 8. Adelanto salarial → POST /salary-advances
        if (method === 'POST' && path.includes('/salary-advances')) {
          await this.handleSalaryAdvanceRequest(data);
        }

        if (method === 'PATCH' && path.includes('/salary-advances')) {
          await this.handleSalaryAdvanceResponse(data);
        }

        // 9. Solicitud de licencia/vacaciones → POST /employee-leaves
        if (method === 'POST' && path.includes('/employee-leaves')) {
          await this.handleEmployeeLeaveRequest(data);
        }
      }),
    );
  }

  /**
   * Maneja las notificaciones para creación de servicios
   */
  private async handleServiceCreation(
    method: string,
    path: string,
    servicio: Service,
    asignaciones: any[],
  ): Promise<void> {
    console.log('=== DEBUG INTERCEPTOR - handleServiceCreation INICIO ===');
    console.log('method:', method);
    console.log('path:', path);
    console.log('servicio.banosInstalados:', servicio.banosInstalados);
    console.log('asignaciones:', asignaciones);
    
    if (method !== 'POST' || !path.includes('/services')) {
      console.log('No es POST o no incluye /services, saliendo...');
      return;
    }

    // Obtener todos los empleados asignados al servicio
    const listaEmpleados =
      asignaciones
        .filter((a) => a?.empleado)
        .map((a) => {
          const emp = a.empleado;
          return {
            name: `${emp.nombre} ${emp.apellido}`,
            rol: a.rolEmpleado ?? null, // si querés incluir el rol (A o B)
          };
        }) ?? [];

    // ID del servicio
    const servicioId = servicio.id;

    // Obtener todos los vehículos asignados al servicio
    const vehiculos = asignaciones
      .filter((a) => a?.vehiculo !== null && a?.vehiculo !== undefined)
      .map((a) => {
        const vehiculo = a.vehiculo!;
        return `${vehiculo.marca || 'Sin marca'} ${vehiculo.modelo || 'Sin modelo'} (${vehiculo.placa || 'Sin placa'})`;
      })
      .filter((v, i, self) => self.indexOf(v) === i); // Eliminar duplicados

    const vehicleInfo =
      vehiculos.length > 0
        ? vehiculos.join(', ')
        : 'No hay vehículos asignados';

    // Obtener todos los baños asignados al servicio
    let banos: string[] = [];
    
    // Primero intentar obtener baños desde las asignaciones (para instalaciones, retiros, etc.)
    const banosDesdeAsignaciones = asignaciones
      .filter((a) => a?.bano !== null && a?.bano !== undefined)
      .map((a) => {
        const bano = a.bano!;
        return (
          bano.codigo_interno || `Baño ID: ${bano.baño_id || 'desconocido'}`
        );
      })
      .filter((b, i, self) => self.indexOf(b) === i); // Eliminar duplicados

    // Si no hay baños en asignaciones, usar banosInstalados del servicio (para limpiezas)
    if (banosDesdeAsignaciones.length === 0 && servicio.banosInstalados?.length) {
      console.log('DEBUG CREATION: Consultando baños con repository, IDs:', servicio.banosInstalados);
      // Obtener la información completa de los baños desde la base de datos usando TypeORM
      try {
        const toiletEntities = await this.dataSource.query(
          `SELECT baño_id, codigo_interno FROM chemical_toilets WHERE baño_id = ANY($1)`,
          [servicio.banosInstalados]
        );
        
        console.log('DEBUG CREATION: toiletEntities encontradas:', toiletEntities);
        
        banos = toiletEntities.map((toilet: any) => 
          toilet.codigo_interno || `Baño ID: ${toilet.baño_id}`
        );
        
        console.log('DEBUG CREATION: banos mapeados:', banos);
      } catch (error) {
        console.error('Error al obtener información de baños:', error);
        banos = servicio.banosInstalados.map(id => `Baño ID: ${id}`);
      }
    } else {
      banos = banosDesdeAsignaciones;
    }

    console.log('DEBUG CREATION: Baños finales para email:', banos);
    const toilets = banos.length > 0 ? banos : ['No hay baños asignados'];

    // Información del cliente
    const clients = [servicio.cliente?.nombre ?? 'Cliente desconocido'];

    // Formato seguro para la fecha
    const taskDate = servicio.fechaProgramada
      ? new Date(servicio.fechaProgramada).toLocaleDateString('es-CL')
      : 'Fecha no especificada';

    // Obtener dirección y fecha de inicio
    // Hay que acceder de manera segura ya que servicio.condicionContractual podría no estar cargado
    let clientAddress = '';
    let serviceStartDate = '';

    // Si la condición contractual está cargada como relación y disponible como objeto
    if (
      servicio['condicionContractual'] &&
      typeof servicio['condicionContractual'] === 'object'
    ) {
      clientAddress = servicio['condicionContractual'].direccion || '';

      if (servicio['condicionContractual'].fecha_inicio) {
        serviceStartDate = new Date(
          servicio['condicionContractual'].fecha_inicio,
        ).toLocaleDateString('es-CL');
      }
    } else if (servicio.ubicacion) {
      // Como alternativa, usar la ubicación del servicio
      clientAddress = servicio.ubicacion || '';
    }

    // Enviar correo a cada empleado con TODA la información del servicio
    for (const asignacion of asignaciones) {
      const empleado = asignacion?.empleado;

      if (!empleado?.email) continue;
      console.log(
        `[Interceptor] Enviando correo automático para servicio ID: ${servicio.id}`,
      );

      await this.mailerService.sendRoute(
        empleado.email,
        empleado.nombre || 'Empleado',
        vehicleInfo,
        toilets,
        clients,
        servicio.tipoServicio ?? 'No definido',
        taskDate,
        servicioId, // Nuevo: ID del servicio
        listaEmpleados, // Nuevo: Lista de todos los empleados
        clientAddress, // Nuevo: Dirección del cliente
        serviceStartDate, // Nuevo: Fecha de inicio del servicio
      );
    }
  }

  /**
   * Maneja las notificaciones para modificación de servicios
   */
  private async handleServiceModification(
    method: string,
    path: string,
    servicio: Service,
    asignaciones: any[],
  ): Promise<void> {
    if (method !== 'PUT' || !path.includes('/services')) {
      return;
    }

    // Obtener todos los vehículos asignados al servicio
    const vehiculos = asignaciones
      .filter((a) => a?.vehiculo !== null && a?.vehiculo !== undefined)
      .map((a) => {
        const vehiculo = a.vehiculo!;
        return `${vehiculo.marca || 'Sin marca'} ${vehiculo.modelo || 'Sin modelo'} (${vehiculo.placa || 'Sin placa'})`;
      })
      .filter((v, i, self) => self.indexOf(v) === i); // Eliminar duplicados

    const vehicleInfo =
      vehiculos.length > 0
        ? vehiculos.join(', ')
        : 'No hay vehículos asignados';

    // Obtener todos los baños asignados al servicio
    let banos: string[] = [];
    
    // Primero intentar obtener baños desde las asignaciones (para instalaciones, retiros, etc.)
    const banosDesdeAsignaciones = asignaciones
      .filter((a) => a?.bano !== null && a?.bano !== undefined)
      .map((a) => {
        const bano = a.bano!;
        return (
          bano.codigo_interno || `Baño ID: ${bano.baño_id || 'desconocido'}`
        );
      })
      .filter((b, i, self) => self.indexOf(b) === i); // Eliminar duplicados

    // Si no hay baños en asignaciones, usar banosInstalados del servicio (para limpiezas)
    if (banosDesdeAsignaciones.length === 0 && servicio.banosInstalados?.length) {
      // Obtener la información completa de los baños desde la base de datos
      try {
        const toiletEntities = await this.dataSource.query(
          `SELECT bano_id, codigo_interno FROM chemical_toilets WHERE bano_id = ANY($1)`,
          [servicio.banosInstalados]
        );
        
        banos = toiletEntities.map((toilet: any) => 
          toilet.codigo_interno || `Baño ID: ${toilet.bano_id}`
        );
      } catch (error) {
        console.error('Error al obtener información de baños:', error);
        banos = servicio.banosInstalados.map(id => `Baño ID: ${id}`);
      }
    } else {
      banos = banosDesdeAsignaciones;
    }

    const toilets = banos.length > 0 ? banos : ['No hay baños asignados'];

    // Información del cliente
    const clients = [servicio.cliente?.nombre ?? 'Cliente desconocido'];

    // Formato seguro para la fecha
    const taskDate = servicio.fechaProgramada
      ? new Date(servicio.fechaProgramada).toLocaleDateString('es-CL')
      : 'Fecha no especificada';

    // Obtener dirección y fecha de inicio
    // Hay que acceder de manera segura ya que servicio.condicionContractual podría no estar cargado
    let clientAddress = '';
    let serviceStartDate = '';

    // Si la condición contractual está cargada como relación y disponible como objeto
    if (
      servicio['condicionContractual'] &&
      typeof servicio['condicionContractual'] === 'object'
    ) {
      clientAddress = servicio['condicionContractual'].direccion || '';

      if (servicio['condicionContractual'].fecha_inicio) {
        serviceStartDate = new Date(
          servicio['condicionContractual'].fecha_inicio,
        ).toLocaleDateString('es-CL');
      }
    } else if (servicio.ubicacion) {
      // Como alternativa, usar la ubicación del servicio
      clientAddress = servicio.ubicacion || '';
    }

    // Enviar correo a cada empleado
    for (const asignacion of asignaciones) {
      const empleado = asignacion?.empleado;

      if (!empleado?.email) continue;

      await this.mailerService.sendRouteModified(
        empleado.email,
        empleado.nombre || 'Empleado',
        vehicleInfo,
        toilets,
        clients,
        servicio.tipoServicio ?? 'No definido',
        taskDate,
        clientAddress, // Nuevo: Dirección del cliente
        serviceStartDate, // Nuevo: Fecha de inicio del servicio
      );
    }
  }

  /**
   * Maneja las notificaciones para cambios de estado de servicios
   */
  private async handleServiceStatusChange(
    method: string,
    path: string,
    servicio: Service,
    asignaciones: any[],
  ): Promise<void> {
    if (
      method !== 'PATCH' ||
      !path.includes('/estado') ||
      (servicio.estado !== ServiceState.EN_PROGRESO &&
        servicio.estado !== ServiceState.COMPLETADO &&
        servicio.estado !== ServiceState.CANCELADO)
    ) {
      return;
    }

    const adminsEmails = await this.mailerService.getAdminEmails();
    const supervisorsEmails = await this.mailerService.getSupervisorEmails();

    // ID del servicio
    const servicioId = servicio.id;

    // Obtener todos los empleados asignados al servicio
    const empleadosAsignados = asignaciones
      .filter((a) => a?.empleado)
      .map((a) => a.empleado)
      .filter(Boolean)
      .map((e) => `${e.nombre} ${e.apellido}`);

    // Texto con la lista de empleados para el correo
    const nombresEmpleados =
      empleadosAsignados.length > 0
        ? empleadosAsignados.join(', ')
        : 'Sin empleados asignados';

    // Obtener todos los vehículos del servicio
    const vehiculos = asignaciones
      .filter((a) => a?.vehiculo !== null && a?.vehiculo !== undefined)
      .map((a) => {
        const vehiculo = a.vehiculo!;
        return `${vehiculo.marca || 'Sin marca'} ${vehiculo.modelo || 'Sin modelo'} (${vehiculo.placa || 'Sin placa'})`;
      })
      .filter((v, i, self) => self.indexOf(v) === i); // Eliminar duplicados

    const vehicleInfo =
      vehiculos.length > 0
        ? vehiculos.join(', ')
        : 'No hay vehículos asignados';

    // Obtener todos los baños del servicio
    let banos: string[] = [];
    
    // Primero intentar obtener baños desde las asignaciones (para instalaciones, retiros, etc.)
    const banosDesdeAsignaciones = asignaciones
      .filter((a) => a?.bano !== null && a?.bano !== undefined)
      .map((a) => {
        const bano = a.bano!;
        return (
          bano.codigo_interno || `Baño ID: ${bano.baño_id || 'desconocido'}`
        );
      })
      .filter((b, i, self) => self.indexOf(b) === i); // Eliminar duplicados

    // Si no hay baños en asignaciones, usar banosInstalados del servicio (para limpiezas)
    if (banosDesdeAsignaciones.length === 0 && servicio.banosInstalados?.length) {
      // Obtener la información completa de los baños desde la base de datos
      try {
        const toiletEntities = await this.dataSource.query(
          `SELECT bano_id, codigo_interno FROM chemical_toilets WHERE bano_id = ANY($1)`,
          [servicio.banosInstalados]
        );
        
        banos = toiletEntities.map((toilet: any) => 
          toilet.codigo_interno || `Baño ID: ${toilet.bano_id}`
        );
      } catch (error) {
        console.error('Error al obtener información de baños:', error);
        banos = servicio.banosInstalados.map(id => `Baño ID: ${id}`);
      }
    } else {
      banos = banosDesdeAsignaciones;
    }

    const toilets = banos.length > 0 ? banos : ['No hay baños asignados'];

    // Formato seguro para la fecha
    const taskDate = servicio.fechaProgramada
      ? new Date(servicio.fechaProgramada).toLocaleDateString('es-CL')
      : 'Fecha no especificada';

    // Datos comunes para ambos tipos de notificación
    const taskDetails = {
      client: servicio.cliente?.nombre ?? 'Cliente desconocido',
      vehicle: vehicleInfo,
      serviceType: servicio.tipoServicio ?? 'No definido',
      toilets,
      taskDate,
      employees: nombresEmpleados,
      serviceId: servicioId, // Agregamos el ID del servicio
    };
    if (servicio.estado === ServiceState.EN_PROGRESO) {
      await this.mailerService.sendInProgressNotification(
        adminsEmails,
        supervisorsEmails,
        nombresEmpleados,
        taskDetails,
      );
    } else if (servicio.estado === ServiceState.CANCELADO) {
      // Obtener emails de empleados asignados
      const empleadoEmails = asignaciones
        .filter((a) => a?.empleado?.email)
        .map((a) => a.empleado.email);

      // Enviar notificación de cancelación
      if (empleadoEmails.length > 0) {
        await this.mailerService.sendMail({
          from: 'noreply@mva.com',
          to: empleadoEmails,
          subject: 'Servicio cancelado',
          html: `<p>El servicio #${servicioId} ha sido cancelado.</p>`,
        });
      }
    } else {
      // COMPLETADO
      await this.mailerService.sendCompletionNotification(
        adminsEmails,
        supervisorsEmails,
        nombresEmpleados,
        taskDetails,
      );
    }
  }

  /**
   * Maneja las notificaciones para reclamos
   */
  private async handleClaimNotification(
    method: string,
    path: string,
    data: any,
  ): Promise<void> {
    if (method !== 'POST' || !path.includes('/clients_portal/claims')) {
      return;
    }

    console.log(
      '[MailerInterceptor] Reclamo detectado. Preparando notificación...',
    );

    try {
      const claimData = data;

      if (!claimData || !claimData.cliente || !claimData.titulo) {
        console.warn(
          '[MailerInterceptor] Datos de reclamo incompletos:',
          claimData,
        );
        return;
      }

      // Enviar únicamente a info@mvasrl.com
      const targetEmail = ['info@mvasrl.com'];

      console.log('[MailerInterceptor] Enviando reclamo a:', targetEmail);

      await this.mailerService.sendClaimNotification(
        targetEmail,
        [], // No enviar a supervisors
        claimData.cliente || 'Cliente desconocido',
        claimData.titulo || 'Sin título',
        claimData.descripcion || 'Sin descripción',
        claimData.tipoReclamo || 'No especificado',
        claimData.fechaIncidente || 'Fecha no especificada',
      );

      console.log('[MailerInterceptor] Notificación de reclamo enviada.');

      // Enviar confirmación al cliente si tenemos su email
      if (claimData.emailContacto && claimData.nombreContacto) {
        console.log('[MailerInterceptor] Enviando confirmación al cliente...');
        
        await this.mailerService.sendClaimConfirmationToClient(
          claimData.emailContacto,
          claimData.nombreContacto,
          claimData.titulo,
          claimData.reclamo_id || 0, // ID del reclamo recién creado
        );
        
        console.log('[MailerInterceptor] Confirmación enviada al cliente.');
      } else {
        console.log('[MailerInterceptor] No se envió confirmación al cliente: faltan datos de contacto');
      }
    } catch (err) {
      console.error(
        '[MailerInterceptor] Error enviando notificación de reclamo:',
        err,
      );
    }
  }

  /**
   * Maneja las notificaciones para encuestas de satisfacción
   */
  private async handleSurveyNotification(
    method: string,
    path: string,
    data: any,
  ): Promise<void> {
    if (
      method !== 'POST' ||
      !path.includes('/clients_portal/satisfaction_surveys')
    ) {
      return;
    }

    try {
      const surveyData = data;

      if (!surveyData) {
        console.warn('[MailerInterceptor] Datos de encuesta no válidos');
        return;
      }

      console.log('[MailerInterceptor] Datos de encuesta recibidos:', surveyData);

      // Enviar únicamente a info@mvasrl.com
      const targetEmail = ['info@mvasrl.com'];

      console.log('[MailerInterceptor] Enviando encuesta a:', targetEmail);

      // Mapear correctamente los campos del formulario frontend
      const detallesCompletos = `
        Contacto: ${surveyData.contacto || 'No especificado'}
        Medio de contacto: ${surveyData.medio_contacto || 'No especificado'}
        Tiempo de respuesta: ${surveyData.tiempo_respuesta || 'No especificado'}
        Accesibilidad comercial: ${surveyData.accesibilidad_comercial || 'No especificado'}
        Relación precio-valor: ${surveyData.relacion_precio_valor || 'No especificado'}
        ¿Nos recomendaría?: ${surveyData.recomendaria || 'No especificado'}
      `.trim();

      await this.mailerService.sendSurveyNotification(
        targetEmail,
        [], // No enviar a supervisors
        surveyData.nombre_empresa || 'Cliente desconocido',        // Correcto: nombre_empresa del frontend
        null,                                                      // No hay fecha de mantenimiento en este formulario
        surveyData.calificacion_atencion || 0,                     // Correcto: calificacion_atencion del frontend
        surveyData.comentario_adicional || 'Sin comentarios',     // Correcto: comentario_adicional del frontend
        surveyData.lugar_proyecto || 'Sin proyecto especificado', // Usar lugar_proyecto como asunto
        detallesCompletos, // Todos los detalles de la evaluación
      );
    } catch (err) {
      console.error(
        '[MailerInterceptor] Error enviando notificación de encuesta:',
        err,
      );
    }
  }

  /**
   * Maneja las notificaciones para solicitudes de servicio
   */
  private async handleServiceRequest(
    method: string,
    path: string,
    req: any,
  ): Promise<void> {
    if (
      method !== 'POST' ||
      !path.includes('/clients_portal/ask_for_service')
    ) {
      return;
    }

    try {
      const formData = req.body as ServiceRequestForm;

      if (!formData) {
        console.warn('[MailerInterceptor] Datos de solicitud no válidos');
        return;
      }

      console.log(
        '[MailerInterceptor] Datos del formulario recibidos:',
        formData,
      );

      // Enviar únicamente a info@mvasrl.com
      const targetEmail = ['info@mvasrl.com'];

      console.log('[MailerInterceptor] Enviando solicitud de servicio a:', targetEmail);

      // Solo pasar los campos que realmente vienen del formulario
      await this.mailerService.sendServiceNotification(
        targetEmail,
        [], // No enviar a supervisors
        formData.nombrePersona || 'No especificado',
        formData.rolPersona || 'Contacto', // Valor por defecto del frontend
        formData.email || 'No especificado',
        formData.telefono || 'No especificado',
        formData.nombreEmpresa || 'No especificada',
        formData.cuit || '', // Solo si existe, sino cadena vacía
        '', // rubroEmpresa - no usado en el nuevo template
        formData.zonaDireccion || 'No especificada',
        '', // cantidadBaños - no usado en el nuevo template
        '', // tipoEvento - no usado en el nuevo template
        '', // duracionAlquiler - no usado en el nuevo template
        formData.comentarios || '',
      );
    } catch (err) {
      console.error(
        '[MailerInterceptor] Error enviando notificación de solicitud:',
        err,
      );
    }
  }
  /**
   * Maneja las notificaciones para reseteo de contraseñas
   */
  private async handlePasswordReset(
    method: string,
    path: string,
    data: any,
  ): Promise<void> {
    if (
      !['PUT', 'POST'].includes(method) ||
      !(
        path.includes('/auth/forgot_password') ||
        path.includes('/auth/change_password')
      )
    ) {
      return;
    }

    try {
      if (!data || !data.user || !data.user.newPassword) {
        console.warn(
          '[MailerInterceptor] Datos incompletos para envío de mail:',
          data,
        );
        return;
      }

      const { email, nombre, newPassword } = data.user;

      if (path.includes('/auth/forgot_password')) {
        // 📧 Correo de recuperación
        await this.mailerService.sendPasswordResetEmail(
          email,
          nombre || 'Usuario',
          newPassword,
        );
      } else if (path.includes('/auth/change_password')) {
        // 📧 Correo de confirmación de cambio de contraseña
        await this.mailerService.sendPasswordChangeConfirmationEmail(
          email,
          nombre || 'Usuario',
          newPassword,
        );
      }

      console.log('[MailerInterceptor] Correo de contraseña enviado.');
    } catch (err) {
      console.error('[MailerInterceptor] Error al enviar correo:', err);
    }
  }
  /**
   * Maneja el envío de correos al recibir una solicitud de adelanto salarial
   */
  //Maneja el envío de correos al recibir una solicitud de adelanto salarial
  //
  private async handleSalaryAdvanceRequest(data: any): Promise<void> {
    console.log(
      '[MailerInterceptor] Datos recibidos en handleSalaryAdvanceRequest:',
      data,
    );

    if (!data || !data.id || !data.amount || !data.employee) return;

    const admins = await this.mailerService.getAdminEmails();

    if (!admins || admins.length === 0) {
      console.warn(
        '[MailerInterceptor] No se encontraron correos de administradores',
      );
      return;
    }

    try {
      console.log(
        '[MailerInterceptor] Llamando a sendSalaryAdvanceRequestToAdmins...',
      );
      await this.mailerService.sendSalaryAdvanceRequestToAdmins(data);
      console.log(
        '[MailerInterceptor] Correo enviado a administradores por solicitud de adelanto',
      );
    } catch (error) {
      console.error(
        '[MailerInterceptor] Error al enviar correo de solicitud de adelanto:',
        error,
      );
    }
  }

  /**
   * Maneja el envío de correos al empleado tras la respuesta a su solicitud de adelanto salarial
   */
  private async handleSalaryAdvanceResponse(data: any): Promise<void> {
    console.log(
      '[MailerInterceptor] Datos recibidos en handleSalaryAdvanceResponse:',
      data,
    );
    if (!data || !data.status || !data.employee?.email) {
      console.warn(
        '[MailerInterceptor] Datos incompletos para notificación al empleado',
      );
      return;
    }

    try {
      await this.mailerService.sendSalaryAdvanceResponseToEmployee(data);
      console.log(
        '[MailerInterceptor] Correo enviado al empleado por respuesta de adelanto',
      );
    } catch (error) {
      console.error(
        '[MailerInterceptor] Error al enviar correo de respuesta de adelanto:',
        error,
      );
    }
  }

  /**
   * Maneja el envío de correos a administradores al recibir una solicitud de licencia/vacaciones
   */
  private async handleEmployeeLeaveRequest(data: any): Promise<void> {
    console.log(
      '[MailerInterceptor] Datos recibidos en handleEmployeeLeaveRequest:',
      data,
    );

    if (!data || !data.id || !data.fechaInicio || !data.fechaFin || !data.employeeId) {
      console.warn(
        '[MailerInterceptor] Datos incompletos para solicitud de licencia',
      );
      return;
    }

    try {
      console.log(
        '[MailerInterceptor] Llamando a sendEmployeeLeaveRequestToAdmins...',
      );
      await this.mailerService.sendEmployeeLeaveRequestToAdmins(data);
      console.log(
        '[MailerInterceptor] Correo enviado a administradores por solicitud de licencia',
      );
    } catch (error) {
      console.error(
        '[MailerInterceptor] Error al enviar correo de solicitud de licencia:',
        error,
      );
    }
  }
}

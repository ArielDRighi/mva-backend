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
    if (method !== 'POST' || !path.includes('/services')) {
      return;
    }

    // Obtener todos los empleados asignados al servicio
    const empleadosAsignados = asignaciones
      .filter((a) => a?.empleado)
      .map((a) => a.empleado)
      .filter(Boolean)
      .map((e) => `${e.nombre} ${e.apellido} (${e.cargo})`);

    // Texto con la lista de empleados para el correo
    const listaEmpleados =
      empleadosAsignados.length > 0
        ? empleadosAsignados
        : ['No hay empleados asignados'];

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
    const banos = asignaciones
      .filter((a) => a?.bano !== null && a?.bano !== undefined)
      .map((a) => {
        const bano = a.bano!;
        return (
          bano.codigo_interno || `Baño ID: ${bano.baño_id || 'desconocido'}`
        );
      })
      .filter((b, i, self) => self.indexOf(b) === i); // Eliminar duplicados

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
    const banos = asignaciones
      .filter((a) => a?.bano !== null && a?.bano !== undefined)
      .map((a) => {
        const bano = a.bano!;
        return (
          bano.codigo_interno || `Baño ID: ${bano.baño_id || 'desconocido'}`
        );
      })
      .filter((b, i, self) => self.indexOf(b) === i); // Eliminar duplicados

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
        servicio.estado !== ServiceState.COMPLETADO)
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
    const banos = asignaciones
      .filter((a) => a?.bano !== null && a?.bano !== undefined)
      .map((a) => {
        const bano = a.bano!;
        return (
          bano.codigo_interno || `Baño ID: ${bano.baño_id || 'desconocido'}`
        );
      })
      .filter((b, i, self) => self.indexOf(b) === i); // Eliminar duplicados

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

      const adminsEmails = await this.mailerService.getAdminEmails();
      const supervisorsEmails = await this.mailerService.getSupervisorEmails();

      console.log('[MailerInterceptor] Correos obtenidos:', {
        adminsEmails,
        supervisorsEmails,
      });

      await this.mailerService.sendClaimNotification(
        adminsEmails,
        supervisorsEmails,
        claimData.cliente || 'Cliente desconocido',
        claimData.titulo || 'Sin título',
        claimData.descripcion || 'Sin descripción',
        claimData.tipoReclamo || 'No especificado',
        claimData.fechaIncidente || 'Fecha no especificada',
      );

      console.log('[MailerInterceptor] Notificación de reclamo enviada.');
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

      const adminsEmails = await this.mailerService.getAdminEmails();
      const supervisorsEmails = await this.mailerService.getSupervisorEmails();

      await this.mailerService.sendSurveyNotification(
        adminsEmails,
        supervisorsEmails,
        surveyData.cliente || 'Cliente desconocido',
        surveyData.fecha_mantenimiento || null,
        surveyData.calificacion || 0,
        surveyData.comentario || 'Sin comentarios',
        surveyData.asunto || 'Sin asunto',
        surveyData.aspecto_evaluado || 'No especificado',
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

      const adminsEmails = await this.mailerService.getAdminEmails();
      const supervisorsEmails = await this.mailerService.getSupervisorEmails();

      await this.mailerService.sendServiceNotification(
        adminsEmails,
        supervisorsEmails,
        formData.nombrePersona || 'No especificado',
        formData.rolPersona || 'No especificado',
        formData.email || 'No especificado',
        formData.telefono || 'No especificado',
        formData.nombreEmpresa || 'No especificada',
        formData.cuit || 'No especificado',
        formData.rubroEmpresa || 'No especificado',
        formData.zonaDireccion || 'No especificada',
        formData.cantidadBaños || 'No especificada',
        formData.tipoEvento || 'No especificado',
        formData.duracionAlquiler || 'No especificada',
        formData.comentarios || 'Sin comentarios',
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
    if (method !== 'POST' || !path.includes('/auth/forgot-password')) {
      return;
    }

    console.log(
      '[MailerInterceptor] Reseteo de contraseña detectado. Preparando notificación...',
    );

    try {
      // Verificar que data sea un objeto válido con la información necesaria
      if (!data || !data.user) {
        console.warn(
          '[MailerInterceptor] Datos de reseteo de contraseña incompletos:',
          data,
        );
        return;
      }

      const user = data.user;
      const newPassword = user.newPassword;

      // Obtener correos de administradores y supervisores para control interno
      const adminsEmails = await this.mailerService.getAdminEmails();
      const supervisorsEmails = await this.mailerService.getSupervisorEmails();

      // Enviamos email de recuperación de contraseña al usuario
      await this.mailerService.sendPasswordResetEmail(
        adminsEmails,
        supervisorsEmails,
        user.email,
        user.nombre || 'Usuario',
        newPassword,
      );

      console.log(
        '[MailerInterceptor] Notificación de reseteo de contraseña enviada.',
      );
    } catch (err) {
      console.error(
        '[MailerInterceptor] Error enviando notificación de reseteo de contraseña:',
        err,
      );
    }
  }
}

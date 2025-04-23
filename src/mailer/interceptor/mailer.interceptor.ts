import { Injectable } from '@nestjs/common';
import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { groupBy } from 'lodash';
import { Reflector } from '@nestjs/core';
import { MailerService } from '../mailer.service';
import { Service } from 'src/services/entities/service.entity';
import { ServiceState } from 'src/common/enums/resource-states.enum';
import { Role } from 'src/roles/enums/role.enum';

@Injectable()
export class MailerInterceptor implements NestInterceptor {
  constructor(
    private readonly mailerService: MailerService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method = req.method;
    const path = req.url;

    return next.handle().pipe(
      map(async (data: any) => {
        // Solo procesamos los datos si tienen la estructura esperada (servicio con cliente y fechaProgramada)
        if (!data || !data.cliente || !data.fechaProgramada) return data;

        const servicio: Service = data;
        const asignaciones = servicio.asignaciones || [];
        const asignacionesPorEmpleado = groupBy(asignaciones, (a) => a.empleado?.id);

        // 1. Creación → POST /services
        if (method === 'POST' && path.includes('/services')) {
          for (const empleadoId in asignacionesPorEmpleado) {
            const asignacionesEmpleado = asignacionesPorEmpleado[empleadoId];
            const empleado = asignacionesEmpleado[0].empleado;

            if (!empleado?.email) continue;

            const vehicle = asignacionesEmpleado[0].vehiculo?.placa ?? 'No asignado';
            const toilets = asignacionesEmpleado.map((a) => a.bano?.codigo_interno ?? 'Baño sin código');
            const clients = [servicio.cliente?.nombre ?? 'Cliente desconocido'];

            await this.mailerService.sendRoute(
              empleado.email,
              empleado.nombre,
              vehicle,
              toilets,
              clients,
              servicio.tipoServicio ?? 'No definido',
              servicio.fechaProgramada.toLocaleDateString('es-CL'),
            );
          }
        }

        // 2. Modificación → PUT /services/:id
        if (method === 'PUT' && path.includes('/services')) {
          for (const empleadoId in asignacionesPorEmpleado) {
            const asignacionesEmpleado = asignacionesPorEmpleado[empleadoId];
            const empleado = asignacionesEmpleado[0].empleado;

            if (!empleado?.email) continue;

            const vehicle = asignacionesEmpleado[0].vehiculo?.placa ?? 'No asignado';
            const toilets = asignacionesEmpleado.map((a) => a.bano?.codigo_interno ?? 'Baño sin código');
            const clients = [servicio.cliente?.nombre ?? 'Cliente desconocido'];

            await this.mailerService.sendRouteModified(
              empleado.email,
              empleado.nombre,
              vehicle,
              toilets,
              clients,
              servicio.tipoServicio ?? 'No definido',
              servicio.fechaProgramada.toLocaleDateString('es-CL'),
            );
          }
        }

        // 3. Estado → PATCH /services/:id/estado
          if (method === 'PATCH' && path.includes('/estado')) {
            if (servicio.estado === ServiceState.EN_PROGRESO) {
              const adminsEmails = await this.mailerService.getAdminEmails();
              const supervisorsEmails = await this.mailerService.getSupervisorEmails();
          
              await this.mailerService.sendInProgressNotification(
                adminsEmails,
                supervisorsEmails,
                servicio.asignaciones[0]?.empleado?.nombre ?? 'Empleado sin nombre',
                {
                  client: servicio.cliente?.nombre ?? 'Cliente desconocido',
                  vehicle: servicio.asignaciones[0]?.vehiculo?.placa ?? 'No asignado',
                  serviceType: servicio.tipoServicio ?? 'No definido',
                  toilets: servicio.asignaciones.map((a) => a.bano?.codigo_interno ?? 'Baño sin código'),
                  taskDate: servicio.fechaProgramada.toLocaleDateString('es-CL'),
                },
              );
            }
          }

          if (servicio.estado === ServiceState.COMPLETADO) {
            const adminsEmails = await this.mailerService.getAdminEmails();
            const supervisorsEmails = await this.mailerService.getSupervisorEmails();
          
            await this.mailerService.sendCompletionNotification(
              adminsEmails,
              supervisorsEmails,
              servicio.asignaciones[0]?.empleado?.nombre ?? 'Empleado sin nombre',
              {
                client: servicio.cliente?.nombre ?? 'Cliente desconocido',
                vehicle: servicio.asignaciones[0]?.vehiculo?.placa ?? 'No asignado',
                serviceType: servicio.tipoServicio ?? 'No definido',
                toilets: servicio.asignaciones.map((a) => a.bano?.codigo_interno ?? 'Baño sin código'),
                taskDate: servicio.fechaProgramada.toLocaleDateString('es-CL'),
              },
            );
          }
          

        // 4. Reclamo → POST /claims
        if (method === 'POST' && path.includes('/clients_portal/claims')) {
          // Enviar notificación de reclamo
          const claimData = data; // Asegúrate de que los datos de reclamo estén bien definidos
          const adminsEmails = await this.mailerService.getAdminEmails();
            const supervisorsEmails = await this.mailerService.getSupervisorEmails(); // Aquí deberías obtener los emails de los supervisores

          await this.mailerService.sendClaimNotification(
            adminsEmails,
            supervisorsEmails,
            claimData.cliente,
            claimData.titulo,
            claimData.descripcion,
            claimData.tipoReclamo,
            claimData.fechaIncidente,
          );
        }

        // 5. Encuesta → POST /surveys
        if (method === 'POST' && path.includes('/clients_portal/satisfaction_surveys')) {
          // Enviar notificación de encuesta
          const surveyData = data; // Asegúrate de que los datos de la encuesta estén bien definidos
          const adminsEmails = await this.mailerService.getAdminEmails();
            const supervisorsEmails = await this.mailerService.getSupervisorEmails();

          await this.mailerService.sendSurveyNotification(
            adminsEmails,
            supervisorsEmails,
            surveyData.cliente,
            surveyData.fecha_mantenimiento,
            surveyData.calificacion,
            surveyData.comentario,
            surveyData.asunto,
            surveyData.aspecto_evaluado,
          );
        }

        // 6. Servicio → POST /services
        if (method === 'POST' && path.includes('/clients_portal/ask_for_service')) {
          // Enviar notificación de nuevo servicio
          const formData = data; // Asegúrate de que los datos del servicio estén bien definidos
          const adminsEmails = await this.mailerService.getAdminEmails();
            const supervisorsEmails = await this.mailerService.getSupervisorEmails();

          await this.mailerService.sendServiceNotification(
            adminsEmails,
            supervisorsEmails,
            formData.nombrePersona,
            formData.rolPersona,
            formData.email,
            formData.telefono,
            formData.nombreEmpresa,
            formData.cuit,
            formData.rubroEmpresa,
            formData.zonaDireccion,
            formData.cantidadBaños,
            formData.tipoEvento,
            formData.duracionAlquiler,
            formData.comentarios,
          );
        }

        return data;
      }),
    );
  }
}

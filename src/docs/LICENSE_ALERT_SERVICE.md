# LicenseAlert Service - Sistema de Alertas de Licencias de Conducir

## Descripción

El servicio LicenseAlert es un componente automatizado del sistema MVA Backend que monitorea las licencias de conducir de los empleados y envía notificaciones cuando están próximas a vencer. Este servicio es crítico para asegurar que los conductores de la empresa siempre tengan sus licencias vigentes, lo que es un requisito legal para la operación de vehículos.

## Funcionamiento

### Monitoreo Automatizado

El servicio utiliza tareas programadas (cron jobs) para verificar diariamente a las 8:00 AM las licencias de conducir registradas en el sistema. Identifica aquellas que vencerán en los próximos 30 días.

### Notificaciones por Email

Cuando se detectan licencias próximas a vencer, el sistema envía automáticamente alertas por correo electrónico a:

- Administradores del sistema
- Supervisores
- Opcionalmente, puede configurarse para notificar también a los empleados afectados

### Integración con el Módulo de Mailer

El servicio utiliza el módulo de Mailer para el envío de las notificaciones. Este maneja la composición de los mensajes, la lista de destinatarios y el registro de los envíos.

## Implementación Técnica

### Ejecución Programada

```typescript
@Cron(CronExpression.EVERY_DAY_AT_8AM) // Ejecutar diariamente a las 8am
async checkExpiringLicenses() {
  // Lógica para verificar licencias próximas a vencer
}
```

### Proceso de Verificación

1. Calcula la fecha actual y la fecha 30 días en el futuro
2. Consulta en la base de datos todas las licencias con fecha de vencimiento en ese rango
3. Recupera la información de los empleados asociados a esas licencias
4. Envía notificaciones si encuentra licencias próximas a vencer

### Formato de las Notificaciones

Las notificaciones por email contienen:

- Lista de empleados con licencias próximas a vencer
- Información de cada licencia (categoría, fecha de vencimiento)
- Días restantes hasta el vencimiento
- Enlaces directos al sistema para gestionar las renovaciones

## Configuración

### Ajuste del Periodo de Alerta

Por defecto, el sistema alerta sobre licencias que vencerán en los próximos 30 días. Este valor puede ser ajustado modificando la configuración del servicio.

### Frecuencia de Verificación

La verificación está configurada para ejecutarse diariamente a las 8:00 AM. Esta frecuencia puede ajustarse según las necesidades de la empresa.

### Destinatarios de las Alertas

Los destinatarios de las alertas se configuran a través del módulo de Mailer. Por defecto, se notifica a administradores y supervisores.

## Ejemplos de Uso

### Ejemplo de Alerta por Email

```
Asunto: ⚠️ ALERTA: 3 Licencias de Conducir Próximas a Vencer

Estimado/a Administrador/a,

Las siguientes licencias de conducir vencerán próximamente:

1. Juan Pérez (Conductor)
   - Licencia Categoría B
   - Fecha de vencimiento: 15/06/2023 (20 días restantes)

2. María Gómez (Conductor)
   - Licencia Categoría A
   - Fecha de vencimiento: 10/06/2023 (15 días restantes)

3. Carlos López (Técnico)
   - Licencia Categoría C
   - Fecha de vencimiento: 05/06/2023 (10 días restantes)

Por favor, tome las medidas necesarias para asegurar la renovación
oportuna de estas licencias.

Acceda al sistema para gestionar estas renovaciones:
https://mva-sistema.com/licenses/expiring

Este es un mensaje automático. No responda a este correo.
```

## Recomendaciones para Administradores

1. **Monitoreo regular**: Además de las alertas automáticas, se recomienda verificar periódicamente el panel de licencias próximas a vencer en el sistema.

2. **Planificación anticipada**: Iniciar el proceso de renovación al menos 30 días antes del vencimiento.

3. **Verificación de recepción**: Confirmar que las alertas automáticas están llegando correctamente a los destinatarios.

4. **Documentación de seguimiento**: Mantener un registro de las acciones tomadas para cada alerta recibida.

5. **Proceso de escalamiento**: Establecer un protocolo de escalamiento si las renovaciones no se gestionan con suficiente antelación.

## Solución de Problemas

### Las alertas no se envían

- Verificar la configuración del servicio de correo
- Comprobar que el cron job está activo
- Revisar los logs del sistema para errores

### Falsos positivos

Si el sistema envía alertas para licencias ya renovadas, puede deberse a que la información no ha sido actualizada en el sistema.

### Falsos negativos

Si hay licencias próximas a vencer que no generan alertas, verificar:

- Que los datos de fecha de vencimiento sean correctos
- Que el empleado y su licencia estén correctamente vinculados
- Que no existe alguna condición de filtrado no deseada

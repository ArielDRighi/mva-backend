# Guía para Probar los Endpoints de Servicios en Postman con las Nuevas Modificaciones

Ahora que has implementado la capacidad de asignar múltiples empleados y vehículos a un servicio, debes actualizar tus pruebas en Postman. Aquí está una guía completa para probar los endpoints actualizados:

## Configuración Previa

1. **Autenticación**:
   - Obtén un token JWT válido mediante el endpoint de login
   - Guárdalo como variable de colección `{{token}}`

```
POST {{baseUrl}}/auth/login
{
  "username": "admin",
  "password": "admin123"
}
```

## 1. Crear un Servicio (POST /services)

### A. Asignación Automática con Múltiples Recursos

```json
{
  "clienteId": 1,
  "fechaProgramada": "2025-05-15T10:00:00.000Z",
  "tipoServicio": "INSTALACION",
  "cantidadBanos": 2,
  "cantidadEmpleados": 2,
  "cantidadVehiculos": 1,
  "ubicacion": "Av. Corrientes 1234, Buenos Aires",
  "notas": "Entregar antes de las 9am",
  "asignacionAutomatica": true
}
```

**Lo que debes verificar:**

- Respuesta 201 Created
- El servicio tiene 2 empleados asignados (en diferentes registros de asignación)
- El servicio tiene 1 vehículo asignado
- El servicio tiene 2 baños asignados
- El estado de los recursos asignados cambió a "ASIGNADO"
- El estado del servicio es "PROGRAMADO"

### B. Asignación Manual con Múltiples Recursos

```json
{
  "clienteId": 1,
  "fechaProgramada": "2025-05-16T10:00:00.000Z",
  "tipoServicio": "INSTALACION",
  "cantidadBanos": 2,
  "ubicacion": "Av. Santa Fe 5678, Buenos Aires",
  "asignacionAutomatica": false,
  "asignacionesManual": [
    {
      "empleadoId": 1,
      "vehiculoId": 1,
      "banosIds": [1]
    },
    {
      "empleadoId": 2,
      "vehiculoId": 2,
      "banosIds": [2]
    }
  ]
}
```

**Lo que debes verificar:**

- Respuesta 201 Created
- Se crearon dos asignaciones separadas con los recursos especificados
- Cada asignación contiene un empleado, un vehículo y un baño

## 2. Obtener Servicios (GET /services)

### A. Obtener Todos los Servicios

```
GET {{baseUrl}}/services
```

**Lo que debes verificar:**

- Respuesta 200 OK
- Lista de servicios que incluye los recién creados
- Cada servicio contiene sus asignaciones con detalles de recursos

### B. Filtrar Servicios

```
GET {{baseUrl}}/services?estado=PROGRAMADO&clienteId=1
```

**Lo que debes verificar:**

- Solo se muestran servicios con el estado y cliente especificados
- Las asignaciones de recursos aparecen correctamente

## 3. Obtener un Servicio Específico (GET /services/:id)

```
GET {{baseUrl}}/services/1
```

**Lo que debes verificar:**

- Datos completos del servicio
- Todas las asignaciones de recursos (empleados, vehículos, baños)

## 4. Actualizar un Servicio (PUT /services/:id)

### A. Actualizar Información Básica

```json
{
  "notas": "Nota actualizada - llevar herramientas adicionales",
  "ubicacion": "Av. Corrientes 1234, Piso 3, Buenos Aires"
}
```

### B. Actualizar Cantidades y Reasignar Recursos Automáticamente

```json
{
  "cantidadBanos": 3,
  "cantidadEmpleados": 3,
  "cantidadVehiculos": 2,
  "asignacionAutomatica": true
}
```

**Lo que debes verificar:**

- Los recursos anteriores se liberaron (estado DISPONIBLE)
- Se asignaron 3 baños, 3 empleados y 2 vehículos
- Los nuevos recursos asignados cambiaron a estado ASIGNADO

### C. Cambiar a Asignación Manual

```json
{
  "asignacionAutomatica": false,
  "asignacionesManual": [
    {
      "empleadoId": 3,
      "vehiculoId": 3,
      "banosIds": [3, 4, 5]
    }
  ]
}
```

**Lo que debes verificar:**

- Los recursos anteriores se liberaron
- Se asignaron específicamente los nuevos recursos indicados

## 5. Cambiar Estado del Servicio (PATCH /services/:id/estado)

```
PATCH {{baseUrl}}/services/1/estado
{
  "estado": "EN_PROGRESO"
}
```

**Lo que debes verificar:**

- El estado cambia correctamente
- El campo `fechaInicio` se establece automáticamente

```
PATCH {{baseUrl}}/services/1/estado
{
  "estado": "COMPLETADO"
}
```

**Lo que debes verificar:**

- El estado cambia a COMPLETADO
- El campo `fechaFin` se establece automáticamente
- Los recursos asignados se liberan (estado DISPONIBLE)

## 6. Eliminar un Servicio (DELETE /services/:id)

```
DELETE {{baseUrl}}/services/1
```

**Lo que debes verificar:**

- Respuesta exitosa
- Los recursos asignados se liberan
- El servicio ya no existe al intentar obtenerlo

## Pruebas de Errores

1. **Intentar asignar recursos insuficientes:**

```json
{
  "clienteId": 1,
  "fechaProgramada": "2025-05-15T10:00:00.000Z",
  "tipoServicio": "INSTALACION",
  "cantidadBanos": 20,
  "cantidadEmpleados": 10,
  "cantidadVehiculos": 10,
  "ubicacion": "Av. Corrientes 1234, Buenos Aires",
  "asignacionAutomatica": true
}
```

2. **Transición de estado inválida:**

```json
{
  "estado": "COMPLETADO"
}
```

(Enviar directamente de PROGRAMADO a COMPLETADO)

3. **Asignación manual con recursos no disponibles:**
   Primero asigna recursos en un servicio, luego intenta asignar los mismos a otro servicio.

## Consejos para Probar en Postman

1. **Crea una colección organizada:**

   - Agrupa los endpoints por funcionalidad
   - Usa carpetas para separar flujos de prueba

2. **Usa variables de entorno:**

   ```javascript
   // En la pestaña "Tests" de tu primer request
   var jsonData = pm.response.json();
   pm.environment.set('serviceId', jsonData.id);
   ```

3. **Crea pruebas automatizadas:**

   ```javascript
   // En la pestaña "Tests"
   pm.test('Servicio creado correctamente', function () {
     pm.response.to.have.status(201);
     pm.expect(pm.response.json().estado).to.eql('PROGRAMADO');
     pm.expect(pm.response.json().asignaciones.length).to.be.at.least(1);
   });
   ```

4. **Crea un flujo de trabajo completo:**

   - Crea un servicio
   - Obtén sus datos
   - Actualiza sus asignaciones
   - Cambia su estado
   - Elimina el servicio

5. **Valida el estado de los recursos:**
   Después de asignar recursos, verifica que sus estados hayan cambiado:
   ```
   GET {{baseUrl}}/employees/1
   GET {{baseUrl}}/vehicles/1
   GET {{baseUrl}}/chemical_toilets/1
   ```

## Ejemplo de Flujo de Trabajo Completo

1. **Login para obtener token**
2. **Crear servicio con asignación automática**
3. **Verificar los recursos asignados**
4. **Cambiar a estado EN_PROGRESO**
5. **Actualizar el servicio con más recursos**
6. **Cambiar a estado COMPLETADO**
7. **Verificar que los recursos están liberados**

Este enfoque de prueba te permitirá validar la funcionalidad completa de asignación de múltiples recursos y todos los demás aspectos del módulo de servicios.

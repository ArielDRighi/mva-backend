# Guía de Convenciones de Código para MVA Backend

## Idiomas y Nomenclatura

Este documento define las convenciones de nomenclatura e idiomas utilizadas en el proyecto MVA Backend para mantener la consistencia del código.

### Idiomas

#### Inglés

Se utiliza en:

- Nombres de archivos y carpetas: `toilet_maintenance.controller.ts`, `chemical_toilets.service.ts`
- Nombres de tablas en la base de datos: `@Entity({ name: 'chemical_toilets' })`, `@Entity({ name: 'vehicle_maintenance' })`
- Nombres de clases: `ToiletMaintenanceService`, `ChemicalToiletsController`
- Métodos en controladores y servicios: `findAll()`, `create()`, `update()`, `remove()`
- Rutas/endpoints: `@Controller('chemical_toilets')`, `@Controller('toilet_maintenance')`

#### Español

Se utiliza en:

- Nombres de columnas en la base de datos: `@Column() tipo_mantenimiento: string;`, `@Column() fecha_adquisicion: Date;`
- Propiedades de entidades: `tecnico_responsable`, `condiciones_especificas`
- Mensajes de error: `throw new NotFoundException('Baño químico con ID ${id} no encontrado');`

### Convenciones de Nomenclatura

#### snake_case

Se utiliza en:

- Nombres de archivos: `toilet_maintenance.controller.ts`, `create_client.dto.ts`
- Nombres de carpetas: `chemical_toilets`, `toilet_maintenance`
- Nombres de tablas en la base de datos: `@Entity({ name: 'toilet_maintenance' })`
- Nombres de columnas en la base de datos: `@Column() tipo_mantenimiento: string`
- Muchas propiedades de las entidades: `fecha_mantenimiento`, `codigo_interno`

```typescript
// Ejemplo de archivo - snake_case
// toilet_maintenance.controller.ts

// Ejemplo de carpeta - snake_case
// chemical_toilets/

// Ejemplo de tabla - snake_case
@Entity({ name: 'chemical_toilets' })

// Ejemplo de columnas - snake_case
@Column() tipo_mantenimiento: string;
@Column() fecha_adquisicion: Date;
```

#### PascalCase

Se utiliza en:

- Nombres de clases: `ChemicalToiletsController`, `ToiletMaintenanceService`
- Nombres de DTOs: `CreateClientDto`, `UpdateToiletMaintenanceDto`
- Nombres de entidades: `ChemicalToilet`, `ToiletMaintenance`
- Nombres de decoradores personalizados: `Roles`
- Enumeraciones: `Role`, `EstadoContrato`

```typescript
// Ejemplos de clases - PascalCase
export class ChemicalToiletsController {}
export class ToiletMaintenanceService {}

// Ejemplos de DTOs - PascalCase
export class CreateClientDto {}
export class UpdateToiletMaintenanceDto {}

// Ejemplos de entidades - PascalCase
export class ChemicalToilet {}
export class ToiletMaintenance {}
```

#### camelCase

Se utiliza en:

- Métodos de controladores y servicios: `findAll()`, `create()`, `findById()`
- Variables y propiedades en clases: `clienteId`, `capacidadCarga`
- Parámetros de funciones: `createClientDto`, `updateMaintenanceDto`

```typescript
// Ejemplos de métodos - camelCase
async findAll(): Promise<ChemicalToilet[]> {}
async create(createChemicalToiletDto: CreateChemicalToiletDto) {}

// Ejemplos de variables - camelCase
const existingClient = await this.clientRepository.findOne();
let updatedContractualCondition;
```

### Reglas Específicas

**Nombres de archivos y carpetas**: Siempre usar snake_case en inglés

- ✓ `chemical_toilets.controller.ts`
- ✓ `create_client.dto.ts`
- ✗ `chemicalToilets.controller.ts`
- ✗ `chemical-toilets.controller.ts`

**Tablas en la base de datos**: Siempre usar snake_case en inglés

- ✓ `@Entity({ name: 'chemical_toilets' })`
- ✓ `@Entity({ name: 'toilet_maintenance' })`
- ✗ `@Entity({ name: 'chemicalToilets' })`
- ✗ `@Entity({ name: 'chemical-toilets' })`

**Columnas en la base de datos**: Siempre usar snake_case en español

- ✓ `@Column() tipo_mantenimiento: string;`
- ✓ `@Column() fecha_adquisicion: Date;`
- ✗ `@Column() maintenance_type: string;`
- ✗ `@Column() tipoMantenimiento: string;`

**Clases y DTOs**: Siempre usar PascalCase en inglés

- ✓ `export class ChemicalToiletsController {}`
- ✓ `export class CreateClientDto {}`
- ✗ `export class chemical_toilets_controller {}`
- ✗ `export class createClientDto {}`

**Métodos de controladores y servicios**: Siempre usar camelCase en inglés

- ✓ `async findAll(): Promise<ChemicalToilet[]> {}`
- ✓ `async update(id: number, updateDto: UpdateDto): Promise<Entity> {}`
- ✗ `async find_all(): Promise<ChemicalToilet[]> {}`
- ✗ `async BuscarTodos(): Promise<ChemicalToilet[]> {}`

### Excepciones y Casos Especiales

- En algunas entidades hay mezcla de estilos en propiedades:

  - `baño_id: number;` (snake_case en español)
  - `capacidadCarga: number;` (camelCase en español)

- Los DTOs mantienen coherencia con los nombres de las columnas en la base de datos:

```typescript
// Columna en español con snake_case
@Column() tipo_mantenimiento: string;

// Propiedad en DTO también en español con snake_case
@IsString()
tipo_mantenimiento: string;
```

### Correcciones Necesarias

- Verificar que las entidades no usen guiones medios:

```typescript
// Incorrecto
@Entity({ name: 'vehicle-maintenance' })

// Correcto
@Entity({ name: 'vehicle_maintenance' })
```

- Mantener la coherencia en el nombramiento de relaciones entre entidades

Al seguir estas convenciones, se mantendrá la consistencia del código a lo largo del proyecto.

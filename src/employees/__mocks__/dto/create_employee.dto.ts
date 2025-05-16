export class CreateEmployeeDto {
  nombre: string;
  apellido: string;
  documento: string;
  telefono: string;
  email: string;
  direccion?: string;
  fecha_nacimiento?: string;
  fecha_contratacion: string;
  cargo: string;
  estado: string = 'ACTIVO';
  numero_legajo: number;
  cuil: string;
  cbu: string;
  // These fields are used in tests but not in the actual DTO
  diasVacacionesDisponibles?: number;
  diasVacacionesRestantes?: number;
  diasVacacionesTotales?: number;
}

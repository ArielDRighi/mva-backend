// Evitamos la importación circular
// import { EmployeeLeave } from '../../../employee_leaves/entities/__mocks__/employee-leave.entity';

export class User {}
export class SalaryAdvance {}
export class RopaTalles {}
export class ContactosEmergencia {}
export class Licencias {}
export class ExamenPreocupacional {}
export class EmployeeLeave {}

export class Empleado {
  id: number;
  nombre: string;
  apellido: string;
  documento: string;
  telefono: string;
  email: string;
  direccion: string;
  fecha_nacimiento: Date;
  fecha_contratacion: Date;
  cargo: string;
  estado: string;
  numero_legajo: number;
  cuil: string;
  cbu: string;
  emergencyContacts: ContactosEmergencia[];
  licencia: Licencias;
  usuario: User;
  diasVacacionesTotal: number;
  diasVacacionesRestantes: number;
  diasVacacionesUsados: number;
  leaves: EmployeeLeave[];
  advances: SalaryAdvance[];
  talleRopa: RopaTalles;
  examenesPreocupacionales: ExamenPreocupacional[];
}

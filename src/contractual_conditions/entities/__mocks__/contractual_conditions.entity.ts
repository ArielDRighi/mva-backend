import { ServiceType } from 'src/common/enums/resource-states.enum';
import { Cliente } from 'src/clients/entities/client.entity';

export enum Periodicidad {
  DIARIA = 'Diaria',
  SEMANAL = 'Semanal',
  MENSUAL = 'Mensual',
  ANUAL = 'Anual',
}

export enum EstadoContrato {
  ACTIVO = 'Activo',
  INACTIVO = 'Inactivo',
  TERMINADO = 'Terminado',
}

export class CondicionesContractuales {
  condicionContractualId: number;
  cliente: Cliente;
  fecha_inicio: Date;
  fecha_fin: Date;
  condiciones_especificas: string;
  tarifa: number;
  periodicidad: Periodicidad;
  estado: EstadoContrato;
  tipo_servicio: ServiceType;
  cantidad_banos: number;
  tarifa_alquiler: number;
  tarifa_instalacion: number;
  tarifa_limpieza: number;
}

// Export default to satisfy Jest mock requirements
export default {
  CondicionesContractuales,
  Periodicidad,
  EstadoContrato,
};

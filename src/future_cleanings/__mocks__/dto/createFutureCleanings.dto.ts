export class CreateFutureCleaningDto {
  clientId: number;
  fecha_de_limpieza: Date;
  isActive?: boolean;
  servicioId: number;
}

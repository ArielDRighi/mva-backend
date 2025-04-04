// dto/assign_to_client.dto.ts
import { IsInt, IsNotEmpty } from 'class-validator';

export class AssignToClientDto {
  @IsInt()
  @IsNotEmpty()
  clienteId: number; // El ID del cliente al que se le asignará el baño

  @IsInt()
  @IsNotEmpty()
  bañoId: number; // El ID del baño químico que se va a asignar
}

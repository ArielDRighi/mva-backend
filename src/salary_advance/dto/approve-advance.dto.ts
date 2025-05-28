import { IsEnum, IsOptional, IsString } from 'class-validator';

export class ApproveAdvanceDto {
  @IsEnum(['approved', 'rejected'])
  status: 'approved' | 'rejected';

  @IsOptional()
  @IsString()
  comentario?: string;
}

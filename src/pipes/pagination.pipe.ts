import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class PaginationPipe implements PipeTransform {
  constructor(
    private readonly defaultValue: number = 1,
    private readonly min: number = 1,
    private readonly max?: number,
  ) {}
  transform(value: any, metadata: ArgumentMetadata) {
    if (value === undefined) return this.defaultValue;

    const val = typeof value === 'string' ? parseInt(value, 10) : value;

    if (isNaN(val)) return this.defaultValue;
    if (val < this.min) return this.min;
    if (this.max && val > this.max) return this.max;
    return val;
  }
}

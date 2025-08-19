//clients-portal.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SatisfactionSurvey } from './entities/satisfactionSurvey.entity';
import { Repository, QueryFailedError } from 'typeorm';
import { Claim } from './entities/claim.entity';
import { CreateClaimDto } from './dto/createClaim.dto';
import { CreateSatisfactionSurveyDto } from './dto/createSatisfactionSurvey.dto';
import { AskForServiceDto } from './dto/askForService.dto';

// Interfaz para tipificar el driver error de PostgreSQL
interface PostgreSQLDriverError {
  code?: string;
  detail?: string;
  constraint?: string;
}

@Injectable()
export class ClientsPortalService {
  private readonly logger = new Logger(ClientsPortalService.name);

  constructor(
    @InjectRepository(SatisfactionSurvey)
    private readonly satisfactionSurveyRepository: Repository<SatisfactionSurvey>,
    @InjectRepository(Claim)
    private readonly claimRepository: Repository<Claim>,
  ) {}

  /**
   * Función helper para manejar errores de base de datos de forma type-safe
   */
  private getPostgreSQLError(
    error: QueryFailedError<any>,
  ): PostgreSQLDriverError | null {
    if (error && typeof error === 'object' && 'driverError' in error) {
      const driverError = error.driverError as PostgreSQLDriverError;
      return driverError && typeof driverError === 'object'
        ? driverError
        : null;
    }
    return null;
  }

  async getSatisfactionSurveys() {
    this.logger.log('Obteniendo todas las encuestas de satisfacción');
    const surveys = await this.satisfactionSurveyRepository.find();

    // find() siempre retorna un array, así que verificamos si está vacío
    if (surveys.length === 0) {
      this.logger.warn('No se encontraron encuestas de satisfacción');
      // Retornamos array vacío en lugar de lanzar excepción
      // porque no tener datos no es un error
      return surveys;
    }

    this.logger.log(
      `Se encontraron ${surveys.length} encuestas de satisfacción`,
    );
    return surveys;
  }

  async getSatisfactionSurveyById(id: number) {
    this.logger.log(`Buscando encuesta de satisfacción con ID: ${id}`);
    const survey = await this.satisfactionSurveyRepository.findOne({
      where: { encuesta_id: id },
    });

    if (!survey) {
      this.logger.warn(`Encuesta de satisfacción con ID ${id} no encontrada`);
      throw new NotFoundException(`Encuesta con ID ${id} no encontrada`);
    }

    return survey;
  }

  async getClaims() {
    this.logger.log('Obteniendo todos los reclamos');
    const claims = await this.claimRepository.find();

    // find() siempre retorna un array, así que verificamos si está vacío
    if (claims.length === 0) {
      this.logger.warn('No se encontraron reclamos');
      // Retornamos array vacío en lugar de lanzar excepción
      return claims;
    }

    this.logger.log(`Se encontraron ${claims.length} reclamos`);
    return claims;
  }

  async getClaimById(id: number) {
    this.logger.log(`Buscando reclamo con ID: ${id}`);
    const claim = await this.claimRepository.findOne({
      where: { reclamo_id: id },
    });

    if (!claim) {
      this.logger.warn(`Reclamo con ID ${id} no encontrado`);
      throw new NotFoundException(`Reclamo con ID ${id} no encontrado`);
    }

    return claim;
  }

  async createClaim(claimData: CreateClaimDto) {
    this.logger.log('Creando nuevo reclamo');
    const claim = this.claimRepository.create(claimData);

    try {
      const savedClaim = await this.claimRepository.save(claim);
      this.logger.log(
        `Reclamo creado exitosamente con ID: ${savedClaim.reclamo_id}`,
      );
      return savedClaim;
    } catch (error) {
      this.logger.error(
        `Error al crear reclamo: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );

      // Manejar errores específicos de base de datos
      if (error instanceof QueryFailedError) {
        const driverError = this.getPostgreSQLError(error);
        // Verificar si es un error de clave foránea
        if (driverError?.code === '23503') {
          throw new BadRequestException(
            'Datos inválidos: referencia a entidad inexistente',
          );
        }
        // Verificar si es un error de duplicado
        if (driverError?.code === '23505') {
          throw new BadRequestException('El reclamo ya existe');
        }
      }

      // Para otros errores de base de datos o errores inesperados
      throw new InternalServerErrorException(
        'Error interno al crear el reclamo',
      );
    }
  }

  async createSatisfactionSurvey(surveyData: CreateSatisfactionSurveyDto) {
    this.logger.log('Creando nueva encuesta de satisfacción');
    const survey = this.satisfactionSurveyRepository.create(surveyData);

    try {
      const savedSurvey = await this.satisfactionSurveyRepository.save(survey);
      this.logger.log(
        `Encuesta de satisfacción creada exitosamente con ID: ${savedSurvey.encuesta_id}`,
      );
      return savedSurvey;
    } catch (error) {
      this.logger.error(
        `Error al crear encuesta de satisfacción: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );

      // Manejar errores específicos de base de datos
      if (error instanceof QueryFailedError) {
        const driverError = this.getPostgreSQLError(error);
        // Verificar si es un error de clave foránea
        if (driverError?.code === '23503') {
          throw new BadRequestException(
            'Datos inválidos: referencia a entidad inexistente',
          );
        }
        // Verificar si es un error de duplicado
        if (driverError?.code === '23505') {
          throw new BadRequestException('La encuesta ya existe');
        }
      }

      // Para otros errores de base de datos o errores inesperados
      throw new InternalServerErrorException(
        'Error interno al crear la encuesta de satisfacción',
      );
    }
  }

  async updateClaim(id: number, claimData: Partial<CreateClaimDto>) {
    this.logger.log(`Actualizando reclamo con ID: ${id}`);
    const claim = await this.claimRepository.findOne({
      where: { reclamo_id: id },
    });

    if (!claim) {
      this.logger.warn(`Reclamo con ID ${id} no encontrado para actualizar`);
      throw new NotFoundException(`Reclamo con ID ${id} no encontrado`);
    }

    Object.assign(claim, claimData);

    try {
      const updatedClaim = await this.claimRepository.save(claim);
      this.logger.log(`Reclamo con ID ${id} actualizado exitosamente`);
      return updatedClaim;
    } catch (error) {
      this.logger.error(
        `Error al actualizar reclamo con ID ${id}: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );

      // Manejar errores específicos de base de datos
      if (error instanceof QueryFailedError) {
        const driverError = this.getPostgreSQLError(error);
        // Verificar si es un error de clave foránea
        if (driverError?.code === '23503') {
          throw new BadRequestException(
            'Datos inválidos: referencia a entidad inexistente',
          );
        }
        // Verificar si es un error de duplicado
        if (driverError?.code === '23505') {
          throw new BadRequestException('Conflicto: los datos ya existen');
        }
      }

      // Para otros errores de base de datos o errores inesperados
      throw new InternalServerErrorException(
        'Error interno al actualizar el reclamo',
      );
    }
  }

  async updateSatisfactionSurvey(
    id: number,
    surveyData: Partial<CreateSatisfactionSurveyDto>,
  ) {
    this.logger.log(`Actualizando encuesta de satisfacción con ID: ${id}`);
    const survey = await this.satisfactionSurveyRepository.findOne({
      where: { encuesta_id: id },
    });

    if (!survey) {
      this.logger.warn(
        `Encuesta de satisfacción con ID ${id} no encontrada para actualizar`,
      );
      throw new NotFoundException(
        `Encuesta de satisfacción con ID ${id} no encontrada`,
      );
    }

    Object.assign(survey, surveyData);

    try {
      const updatedSurvey =
        await this.satisfactionSurveyRepository.save(survey);
      this.logger.log(
        `Encuesta de satisfacción con ID ${id} actualizada exitosamente`,
      );
      return updatedSurvey;
    } catch (error) {
      this.logger.error(
        `Error al actualizar encuesta de satisfacción con ID ${id}: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );

      // Manejar errores específicos de base de datos
      if (error instanceof QueryFailedError) {
        const driverError = this.getPostgreSQLError(error);
        // Verificar si es un error de clave foránea
        if (driverError?.code === '23503') {
          throw new BadRequestException(
            'Datos inválidos: referencia a entidad inexistente',
          );
        }
        // Verificar si es un error de duplicado
        if (driverError?.code === '23505') {
          throw new BadRequestException('Conflicto: los datos ya existen');
        }
      }

      // Para otros errores de base de datos o errores inesperados
      throw new InternalServerErrorException(
        'Error interno al actualizar la encuesta de satisfacción',
      );
    }
  }

  askForService(formData: AskForServiceDto) {
    return {
      message: 'Solicitud de servicio recibida exitosamente',
      data: formData, // necesario para que el interceptor lo intercepte y dispare el correo
    };
  }

  async getStats() {
    const totalSurveys = await this.satisfactionSurveyRepository.count();
    const totalClaims = await this.claimRepository.count();
    const surveys = await this.satisfactionSurveyRepository.find();
    const claims = await this.claimRepository.find();
    return {
      totalSurveys,
      totalClaims,
      surveys,
      claims,
    };
  }
}

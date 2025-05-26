//clients-portal.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SatisfactionSurvey } from './entities/satisfactionSurvey.entity';
import { Repository } from 'typeorm';
import { Claim } from './entities/claim.entity';
import { CreateClaimDto } from './dto/createClaim.dto';
import { CreateSatisfactionSurveyDto } from './dto/createSatisfactionSurvey.dto';
import { AskForServiceDto } from './dto/askForService.dto';

@Injectable()
export class ClientsPortalService {
  constructor(
    @InjectRepository(SatisfactionSurvey)
    private readonly satisfactionSurveyRepository: Repository<SatisfactionSurvey>,
    @InjectRepository(Claim)
    private readonly claimRepository: Repository<Claim>,
  ) {}
  async getSatisfactionSurveys() {
    const surveys = await this.satisfactionSurveyRepository.find();
    if (!surveys) {
      throw new BadRequestException('No se encontraron encuestas');
    }
    return surveys;
  }
  async getSatisfactionSurveyById(id: number) {
    const survey = await this.satisfactionSurveyRepository.findOne({
      where: { encuesta_id: id },
    });
    if (!survey) {
      throw new BadRequestException('Encuesta no encontrada');
    }
    return survey;
  }
  async getClaims() {
    const claims = await this.claimRepository.find();
    if (!claims) {
      throw new BadRequestException('No se encontraron reclamos');
    }
    return claims;
  }
  async getClaimById(id: number) {
    const claim = await this.claimRepository.findOne({
      where: { reclamo_id: id },
    });
    if (!claim) {
      throw new BadRequestException('Reclamo no encontrado');
    }
    return claim;
  }

  async createClaim(claimData: CreateClaimDto) {
    const claim = this.claimRepository.create(claimData);
    try {
      await this.claimRepository.save(claim);
      return claim;
    } catch (error) {
      throw new BadRequestException(`Error al crear reclamo: ${error}`);
    }
  }

  async createSatisfactionSurvey(surveyData: CreateSatisfactionSurveyDto) {
    const survey = this.satisfactionSurveyRepository.create(surveyData);
    try {
      await this.satisfactionSurveyRepository.save(survey);
      return survey;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new BadRequestException(
        `Error al crear encuesta de satisfacción: ${errorMessage}`,
      );
    }
  }

  async updateClaim(id: number, claimData: Partial<CreateClaimDto>) {
    const claim = await this.claimRepository.findOne({
      where: { reclamo_id: id },
    });
    if (!claim) {
      throw new BadRequestException('Reclamo no encontrado');
    }
    Object.assign(claim, claimData);
    try {
      await this.claimRepository.save(claim);
      return claim;
    } catch (error) {
      throw new BadRequestException(`Error al actualizar reclamo: ${error}`);
    }
  }

  async updateSatisfactionSurvey(
    id: number,
    surveyData: Partial<CreateSatisfactionSurveyDto>,
  ) {
    const survey = await this.satisfactionSurveyRepository.findOne({
      where: { encuesta_id: id },
    });
    if (!survey) {
      throw new BadRequestException('Encuesta no encontrada');
    }
    Object.assign(survey, surveyData);
    try {
      await this.satisfactionSurveyRepository.save(survey);
      return survey;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new BadRequestException(
        `Error al actualizar encuesta de satisfacción: ${errorMessage}`,
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

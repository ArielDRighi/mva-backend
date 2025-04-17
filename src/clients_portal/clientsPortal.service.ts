import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SatisfactionSurvey } from './entities/satisfactionSurvey.entity';
import { Repository } from 'typeorm';
import { Claim } from './entities/claim.entity';
import { CreateClaimDto } from './dto/createClaim.dto';
import { CreateSatisfactionSurveyDto } from './dto/createSatisfactionSurvey.dto';
import { AskForServiceDto } from './dto/askForService.dto';
import {
  sendClaimNotification,
  sendSurveyNotification,
} from 'src/config/nodemailer';

const adminsEmails = [
  'admin1@empresa.com',
  'admin2@empresa.com',
  'federicovanni@hotmail.com',
];

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
      throw new BadRequestException('No surveys found');
    }
    return surveys;
  }

  async getSatisfactionSurveyById(id: number) {
    const survey = await this.satisfactionSurveyRepository.findOne({
      where: { encuesta_id: id },
    });
    if (!survey) {
      throw new BadRequestException('Survey not found');
    }
    return survey;
  }

  async getClaims() {
    const claims = await this.claimRepository.find();
    if (!claims) {
      throw new BadRequestException('No claims found');
    }
    return claims;
  }

  async getClaimById(id: number) {
    const claim = await this.claimRepository.findOne({
      where: { reclamo_id: id },
    });
    if (!claim) {
      throw new BadRequestException('Claim not found');
    }
    return claim;
  }

  async createClaim(claimData: CreateClaimDto) {
    const claim = this.claimRepository.create(claimData);
    try {
      await this.claimRepository.save(claim);
      await sendClaimNotification(
        adminsEmails,
        claimData.cliente,
        claimData.titulo,
        claimData.descripcion,
        claimData.tipoReclamo,
        claimData.fechaIncidente,
      );
      return claim;
    } catch (error) {
      throw new BadRequestException(`Error creating claim ${error}`);
    }
  }

  async createSatisfactionSurvey(surveyData: CreateSatisfactionSurveyDto) {
    const survey = this.satisfactionSurveyRepository.create(surveyData);
    try {
      await this.satisfactionSurveyRepository.save(survey);
      await sendSurveyNotification(
        adminsEmails,
        surveyData.cliente,
        surveyData.fecha_mantenimiento,
        surveyData.calificacion,
        surveyData.comentario,
        surveyData.asunto,
        surveyData.aspecto_evaluado,
      );
      return survey;
    } catch (error) {
      throw new BadRequestException('Error creating satisfaction survey');
    }
  }

  async updateClaim(id: number, claimData: Partial<CreateClaimDto>) {
    const claim = await this.claimRepository.findOne({
      where: { reclamo_id: id },
    });
    if (!claim) {
      throw new BadRequestException('Claim not found');
    }
    Object.assign(claim, claimData);
    try {
      await this.claimRepository.save(claim);
      return claim;
    } catch (error) {
      throw new BadRequestException('Error updating claim');
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
      throw new BadRequestException('Survey not found');
    }
    Object.assign(survey, surveyData);
    try {
      await this.satisfactionSurveyRepository.save(survey);
      return survey;
    } catch (error) {
      throw new BadRequestException('Error updating satisfaction survey');
    }
  }
  async askForService(formData: AskForServiceDto) {
    // Enviar email mediante NodeMailer
  }
}

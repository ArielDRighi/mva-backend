import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ClientsPortalService } from './clientsPortal.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Roles } from 'src/roles/decorators/roles.decorator';
import { RolesGuard } from 'src/roles/guards/roles.guard';
import { Role } from 'src/roles/enums/role.enum';
import { CreateClaimDto } from './dto/createClaim.dto';
import { CreateSatisfactionSurveyDto } from './dto/createSatisfactionSurvey.dto';
import { AskForServiceDto } from './dto/askForService.dto';
import { MailerInterceptor } from 'src/mailer/interceptor/mailer.interceptor';
@UseInterceptors(MailerInterceptor)
@Controller('clients_portal')
export class ClientsPortalController {
  constructor(private readonly clientsPortalService: ClientsPortalService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @Get('satisfaction_surveys')
  @HttpCode(HttpStatus.OK)
  getSatisfactionSurveys() {
    try {
      return this.clientsPortalService.getSatisfactionSurveys();
    } catch (error) {
      console.error('Error al obtener encuestas de satisfacción:', error);
      throw new HttpException(
        'Error al obtener encuestas de satisfacción',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @Get('satisfaction_surveys/:id')
  @HttpCode(HttpStatus.OK)
  getSatisfactionSurveyById(@Param('id') id: number) {
    try {
      return this.clientsPortalService.getSatisfactionSurveyById(id);
    } catch (error) {
      console.error('Error al obtener encuesta de satisfacción:', error);
      throw new HttpException(
        'Error al obtener encuesta de satisfacción',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @Get('claims')
  @HttpCode(HttpStatus.OK)
  getClaims() {
    try {
      return this.clientsPortalService.getClaims();
    } catch (error) {
      console.error('Error al obtener reclamos:', error);
      throw new HttpException(
        'Error al obtener reclamos',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @Get('claims/:id')
  @HttpCode(HttpStatus.OK)
  getClaimById(@Param('id') id: number) {
    try {
      return this.clientsPortalService.getClaimById(id);
    } catch (error) {
      console.error('Error al obtener reclamo:', error);
      throw new HttpException(
        'Error al obtener reclamo',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('claims')
  @HttpCode(HttpStatus.CREATED)
  async createClaim(@Body() claimData: CreateClaimDto) {
    try {
      return await this.clientsPortalService.createClaim(claimData);
    } catch (error) {
      console.error('Error al crear reclamo:', error);
      throw new HttpException(
        'Error al crear reclamo',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('satisfaction_surveys')
  @HttpCode(HttpStatus.CREATED)
  async createSatisfactionSurvey(
    @Body() surveyData: CreateSatisfactionSurveyDto,
  ) {
    try {
      console.log('Creando encuesta de satisfacción:', surveyData);
      return await this.clientsPortalService.createSatisfactionSurvey(
        surveyData,
      );
    } catch (error) {
      console.error('Error al crear encuesta de satisfacción:', error);
      throw new HttpException(
        'Error al crear encuesta de satisfacción',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @Put('claims/:id')
  @HttpCode(HttpStatus.OK)
  async updateClaim(
    @Param('id') id: number,
    @Body() claimData: Partial<CreateClaimDto>,
  ) {
    try {
      return await this.clientsPortalService.updateClaim(id, claimData);
    } catch (error) {
      console.error('Error al actualizar reclamo:', error);
      throw new HttpException(
        'Error al actualizar reclamo',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @Put('satisfaction_surveys/:id')
  @HttpCode(HttpStatus.OK)
  async updateSatisfactionSurvey(
    @Param('id') id: number,
    @Body() surveyData: Partial<CreateSatisfactionSurveyDto>,
  ) {
    try {
      return await this.clientsPortalService.updateSatisfactionSurvey(
        id,
        surveyData,
      );
    } catch (error) {
      console.error('Error al actualizar encuesta de satisfacción:', error);
      throw new HttpException(
        'Error al actualizar encuesta de satisfacción',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('ask_for_service')
  @HttpCode(HttpStatus.OK)
  async askForServiceForm(@Body() formData: AskForServiceDto) {
    try {
      return await this.clientsPortalService.askForService(formData);
    } catch (error: unknown) {
      console.error(
        'Error al crear formulario de solicitud de servicio:',
        error,
      );
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      throw new HttpException(
        `Error al crear formulario de solicitud de servicio: ${message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @Get('stats')
  @HttpCode(HttpStatus.OK)
  async getStats() {
    try {
      return await this.clientsPortalService.getStats();
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      throw new HttpException(
        'Error al obtener estadísticas',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

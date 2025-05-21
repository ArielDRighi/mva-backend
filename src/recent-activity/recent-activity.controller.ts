import { Controller, Get, UseGuards } from '@nestjs/common';
import { RecentActivityService } from './recent-activity.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../roles/guards/roles.guard';
import { Roles } from '../roles/decorators/roles.decorator';
import { Role } from '../roles/enums/role.enum';

@Controller('recent_activity')
@UseGuards(JwtAuthGuard)
export class RecentActivityController {
  constructor(private readonly recentActivityService: RecentActivityService) {}

  /**
   * Obtiene información sobre la actividad reciente global del sistema
   * @returns Objeto con las actividades más recientes en diferentes categorías
   */
  @Get('global')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  async getGlobalRecentActivity() {
    return this.recentActivityService.getRecentActivity();
  }
}

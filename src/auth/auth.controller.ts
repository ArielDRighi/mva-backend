import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  Put,
  UseInterceptors,
  UseGuards,
  Req,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
} from './dto/login.dto';
import { MailerInterceptor } from 'src/mailer/interceptor/mailer.interceptor';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from 'src/roles/guards/roles.guard';
import { Roles } from 'src/roles/decorators/roles.decorator';
import { Role } from 'src/roles/enums/role.enum';

@UseInterceptors(MailerInterceptor)
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    try {
      return this.authService.login(loginDto);
    } catch {
      throw new UnauthorizedException('Credenciales inválidas');
    }
  }

  @Put('forgot_password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() email: ForgotPasswordDto) {
    try {
      return this.authService.forgotPassword(email);
    } catch {
      throw new UnauthorizedException('Error al restablecer la contraseña');
    }
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.CLIENTE, Role.OPERARIO)
  @Put('change_password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body() data: ChangePasswordDto,
    @Req() req: Request & { user: { userId: string } },
  ) {
    try {
      const userId: string = req.user.userId;
      console.log('userId', userId);
      return this.authService.resetPassword(data, parseInt(userId, 10));
    } catch {
      throw new UnauthorizedException('Error al restablecer la contraseña');
    }
  }
}

import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  Put,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from 'src/users/dto/create-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    try {
      return this.authService.login(loginDto);
    } catch (error) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
  }

  @Put('forgot_password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() email: string) {
    try {
      return this.authService.forgotPassword(email);
    } catch (error) {
      throw new UnauthorizedException('Error al restablecer la contraseña');
    }
  }
}

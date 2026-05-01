import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { IsString, IsNotEmpty } from 'class-validator'; // IMPORTANTE

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    // Si llegas aquí y el log muestra {}, es por la falta de @IsString() arriba
    const result = await this.authService.validateUser(loginDto);
    if (!result) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    return result;
  }
}

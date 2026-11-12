import { Body, Controller, Get, Headers, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LoginDto, RegisterDto, UpdateProfileDto } from './auth.dto';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('dossier')
  getDossier(@Headers('authorization') authHeader?: string) {
    return this.authService.getDossierSummary(authHeader);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Patch('profile')
  updateProfile(
    @Headers('authorization') authHeader: string | undefined,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(authHeader, dto);
  }
}


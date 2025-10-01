import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { SignupDto } from './dto/signup.dto';
import { extractSessionMetadata } from './session-metadata';
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post('signup')
  @Throttle(5, 60)
  signup(@Body() dto: SignupDto, @Req() request: Request) {
    return this.authService.register(dto, extractSessionMetadata(request));
  }
  @Post('login')
  @Throttle(5, 60)
  login(@Body() dto: LoginDto, @Req() request: Request) {
    return this.authService.login(dto, extractSessionMetadata(request));
  }
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle(5, 60)
  refresh(@Body() dto: RefreshTokenDto, @Req() request: Request) {
    return this.authService.refresh(
      dto.refreshToken,
      extractSessionMetadata(request),
    );
  }
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle(5, 60)
  logout(@Body() dto: RefreshTokenDto, @Req() request: Request) {
    return this.authService.logout(
      dto.refreshToken,
      extractSessionMetadata(request),
    );
  }
}
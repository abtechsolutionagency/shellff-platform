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
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { PasswordResetRequestDto } from './dto/password-reset-request.dto';
import { PasswordResetConfirmDto } from './dto/password-reset-confirm.dto';
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

  @Post('otp/request')
  @Throttle(3, 60)
  requestOtp(@Body() dto: RequestOtpDto, @Req() request: Request) {
    return this.authService.requestLoginOtp(
      dto.email,
      extractSessionMetadata(request),
    );
  }

  @Post('otp/verify')
  @Throttle(10, 60)
  verifyOtp(@Body() dto: VerifyOtpDto, @Req() request: Request) {
    return this.authService.verifyLoginOtp(
      dto.email,
      dto.code,
      extractSessionMetadata(request),
    );
  }

  @Post('password-reset/request')
  @Throttle(3, 60)
  requestPasswordReset(
    @Body() dto: PasswordResetRequestDto,
    @Req() request: Request,
  ) {
    return this.authService.requestPasswordReset(
      dto.email,
      extractSessionMetadata(request),
    );
  }

  @Post('password-reset/confirm')
  @HttpCode(HttpStatus.OK)
  @Throttle(5, 60)
  async confirmPasswordReset(
    @Body() dto: PasswordResetConfirmDto,
    @Req() request: Request,
  ) {
    await this.authService.confirmPasswordReset(
      dto.email,
      dto.code,
      dto.newPassword,
      extractSessionMetadata(request),
    );

    return { success: true };
  }
}
import { forwardRef, Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AnalyticsModule } from '../analytics/analytics.module';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { OtpService } from './otp.service';
import { RolesGuard } from './roles.guard';
import { TokenService } from './token.service';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => AuditModule),
    forwardRef(() => AnalyticsModule),
  ],
  controllers: [AuthController],
  providers: [AuthService, TokenService, OtpService, JwtAuthGuard, RolesGuard],
  exports: [TokenService, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}

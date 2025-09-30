import { Controller, Get } from '@nestjs/common';

import { TelemetryService } from './telemetry.service';

@Controller()
export class TelemetryController {
  constructor(private readonly telemetryService: TelemetryService) {}

  @Get('health')
  getHealth() {
    return this.telemetryService.getHealth();
  }

  @Get('telemetry/health')
  getTelemetryHealth() {
    return this.telemetryService.getHealth();
  }

  @Get('telemetry/metrics')
  getMetrics() {
    return this.telemetryService.getMetrics();
  }

  @Get('version')
  getVersion() {
    return this.telemetryService.getVersion();
  }

  @Get('status')
  getStatus() {
    return this.telemetryService.getStatus();
  }
}

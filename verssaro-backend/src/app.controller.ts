import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getRoot() {
    return { status: 'ONLINE', service: 'VERSSARO ATELIER API v2.4' };
  }

  @Get('health')
  getHealth() {
    return { ok: true, node: 'CMB-ATELIER-01', latencyMs: 14 };
  }
}

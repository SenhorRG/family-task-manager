import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  constructor() {}

  @Get()
  getHello(): string {
    return 'Family Task Manager API - Clean Architecture + DDD + CQRS';
  }

  @Get('health')
  getHealth() {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}

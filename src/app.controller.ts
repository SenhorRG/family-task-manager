import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  constructor() {}

  @Get()
  getHello(): string {
    return 'Family Task Manager API - Clean Architecture + DDD + CQRS';
  }
}

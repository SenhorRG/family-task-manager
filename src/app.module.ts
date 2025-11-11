import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { UsersModule } from './users';
import { FamiliesModule } from './families';
import { TasksModule } from './tasks';
import { AdminModule } from './admin';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { DatabaseModule, AppLoggerInterceptor, HttpExceptionFilter } from './shared';

@Module({
  imports: [DatabaseModule, UsersModule, FamiliesModule, TasksModule, AdminModule],
  controllers: [AppController],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: AppLoggerInterceptor },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
})
export class AppModule {}

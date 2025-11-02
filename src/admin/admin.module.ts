import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule], // Importa UsersModule para ter acesso ao EventStore
  controllers: [AdminController],
})
export class AdminModule {}


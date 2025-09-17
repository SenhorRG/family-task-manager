import { Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';
import { ConfigService } from '../config/config.service';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forRootAsync({
      connectionName: 'writeConnection',
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.mongodbWriteUri,
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forRootAsync({
      connectionName: 'readConnection',
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.mongodbReadUri,
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forRootAsync({
      connectionName: 'eventsConnection',
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.mongodbEventsUri,
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [MongooseModule, ConfigModule],
})
export class DatabaseModule {}

import { Controller, Post, Get, Param, Body, Query, Logger } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ReplayAllEventsCommand,
  ReplayAggregateEventsCommand,
  ReplayEventsAfterCommand,
  RehydrateAllAggregatesCommand,
  RehydrateAggregateCommand,
} from '../../application/commands';
import { VerifySyncQuery } from '../../application/queries';
import { ReplayEventsAfterDto } from './dto';

@Controller('admin')
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('replay/all')
  async replayAllEvents() {
    this.logger.log('🔄 Replay completo de todos os eventos solicitado via API...');
    return this.commandBus.execute(new ReplayAllEventsCommand());
  }

  @Post('replay/aggregate/:aggregateId')
  async replayAggregateEvents(@Param('aggregateId') aggregateId: string) {
    this.logger.log(`🔄 Replay de eventos para aggregate ${aggregateId} solicitado via API...`);
    return this.commandBus.execute(new ReplayAggregateEventsCommand(aggregateId));
  }

  @Post('replay/incremental')
  async replayEventsAfter(@Body() body: ReplayEventsAfterDto) {
    this.logger.log(
      `🔄 Replay incremental após ${body.timestamp.toISOString()} solicitado via API...`,
    );
    return this.commandBus.execute(new ReplayEventsAfterCommand(body.timestamp));
  }

  @Post('rehydrate/all')
  async rehydrateAllAggregates(@Query('aggregateType') aggregateType?: string) {
    this.logger.log(
      aggregateType
        ? `🔄 Rehydratação de todos os aggregates do tipo ${aggregateType} solicitada via API...`
        : '🔄 Rehydratação completa de todos os aggregates solicitada via API...',
    );
    return this.commandBus.execute(new RehydrateAllAggregatesCommand(aggregateType));
  }

  @Post('rehydrate/:aggregateId')
  async rehydrateAggregate(
    @Param('aggregateId') aggregateId: string,
    @Query('aggregateType') aggregateType: string,
  ) {
    this.logger.log(
      `🔄 Rehydratação do aggregate ${aggregateId} (${aggregateType}) solicitada via API...`,
    );
    return this.commandBus.execute(new RehydrateAggregateCommand(aggregateId, aggregateType));
  }

  @Get('sync/verify')
  async verifySync() {
    this.logger.log('🔍 Verificação de sincronização solicitada via API...');
    return this.queryBus.execute(new VerifySyncQuery());
  }
}

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

  /**
   * Replay completo de todos os eventos
   * POST /admin/replay/all
   */
  @Post('replay/all')
  async replayAllEvents() {
    this.logger.log('🔄 Replay completo de todos os eventos solicitado via API...');
    return this.commandBus.execute(new ReplayAllEventsCommand());
  }

  /**
   * Replay de eventos de um aggregate específico
   * POST /admin/replay/aggregate/:aggregateId
   */
  @Post('replay/aggregate/:aggregateId')
  async replayAggregateEvents(@Param('aggregateId') aggregateId: string) {
    this.logger.log(`🔄 Replay de eventos para aggregate ${aggregateId} solicitado via API...`);
    return this.commandBus.execute(new ReplayAggregateEventsCommand(aggregateId));
  }

  /**
   * Replay incremental (eventos após uma data)
   * POST /admin/replay/incremental
   * Body: { "timestamp": "2025-01-01T00:00:00.000Z" }
   */
  @Post('replay/incremental')
  async replayEventsAfter(@Body() body: ReplayEventsAfterDto) {
    const timestamp = new Date(body.timestamp);
    this.logger.log(`🔄 Replay incremental após ${timestamp.toISOString()} solicitado via API...`);
    return this.commandBus.execute(new ReplayEventsAfterCommand(timestamp));
  }

  /**
   * Informações sobre o replay
   * GET /admin/replay/info
   */
  @Get('replay/info')
  getReplayInfo() {
    return {
      message: 'Event Replay API',
      endpoints: {
        full: 'POST /admin/replay/all',
        aggregate: 'POST /admin/replay/aggregate/:aggregateId',
        incremental: 'POST /admin/replay/incremental (body: { timestamp: "ISO_DATE" })',
      },
    };
  }

  /**
   * Rehydrata todos os aggregates ou um tipo específico
   * POST /admin/rehydrate/all
   * POST /admin/rehydrate/all?aggregateType=USER
   */
  @Post('rehydrate/all')
  async rehydrateAllAggregates(@Query('aggregateType') aggregateType?: string) {
    this.logger.log(
      aggregateType
        ? `🔄 Rehydratação de todos os aggregates do tipo ${aggregateType} solicitada via API...`
        : '🔄 Rehydratação completa de todos os aggregates solicitada via API...',
    );
    return this.commandBus.execute(new RehydrateAllAggregatesCommand(aggregateType));
  }

  /**
   * Rehydrata um aggregate específico
   * POST /admin/rehydrate/:aggregateId
   * Query: ?aggregateType=USER|FAMILY|TASK
   */
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

  /**
   * Verifica sincronização entre write, read e events databases
   * GET /admin/sync/verify
   */
  @Get('sync/verify')
  async verifySync() {
    this.logger.log('🔍 Verificação de sincronização solicitada via API...');
    return this.queryBus.execute(new VerifySyncQuery());
  }
}


import { Controller, Post, Get, Param, Body, Inject, Logger } from '@nestjs/common';
import { EventReplayer, ReplayProgress } from '../shared';
import { EventStore } from '../shared/domain/ports/event-store.port';

@Controller('admin/replay')
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(
    private readonly eventReplayer: EventReplayer,
    // Injeta o EventStore do UsersModule (exportado)
    @Inject('EventStore') private readonly eventStore: EventStore | null,
  ) {}

  /**
   * Replay completo de todos os eventos
   * POST /admin/replay/all
   */
  @Post('all')
  async replayAllEvents(): Promise<{
    success: boolean;
    message: string;
    progress: ReplayProgress;
  }> {
    this.logger.log('🔄 Starting full event replay via API...');

    if (!this.eventStore) {
      throw new Error('EventStore not found. Make sure it is registered in a module.');
    }

    try {
      const progress = await this.eventReplayer.replayAllEvents(this.eventStore);

      return {
        success: progress.failedEvents === 0,
        message: `Replay completed: ${progress.processedEvents}/${progress.totalEvents} events processed, ${progress.failedEvents} failed`,
        progress,
      };
    } catch (error) {
      this.logger.error(`Error during replay: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Replay de eventos de um aggregate específico
   * POST /admin/replay/aggregate/:aggregateId
   */
  @Post('aggregate/:aggregateId')
  async replayAggregateEvents(@Param('aggregateId') aggregateId: string): Promise<{
    success: boolean;
    message: string;
    progress: ReplayProgress;
  }> {
    this.logger.log(`🔄 Starting event replay for aggregate ${aggregateId}...`);

    try {
      if (!this.eventStore) {
        throw new Error('EventStore not found. Make sure it is registered in a module.');
      }

      const progress = await this.eventReplayer.replayAggregateEvents(aggregateId, this.eventStore);

      return {
        success: progress.failedEvents === 0,
        message: `Replay completed for aggregate ${aggregateId}: ${progress.processedEvents}/${progress.totalEvents} events processed`,
        progress,
      };
    } catch (error) {
      this.logger.error(`Error during aggregate replay: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Replay incremental (eventos após uma data)
   * POST /admin/replay/incremental
   * Body: { "timestamp": "2025-01-01T00:00:00.000Z" }
   */
  @Post('incremental')
  async replayEventsAfter(@Body() body: { timestamp: string }): Promise<{
    success: boolean;
    message: string;
    progress: ReplayProgress;
  }> {
    const timestamp = new Date(body.timestamp);
    this.logger.log(`🔄 Starting incremental replay after ${timestamp.toISOString()}...`);

    try {
      if (!this.eventStore) {
        throw new Error('EventStore not found. Make sure it is registered in a module.');
      }

      const progress = await this.eventReplayer.replayEventsAfter(timestamp, this.eventStore);

      return {
        success: progress.failedEvents === 0,
        message: `Incremental replay completed: ${progress.processedEvents}/${progress.totalEvents} events processed`,
        progress,
      };
    } catch (error) {
      this.logger.error(`Error during incremental replay: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Informações sobre o replay
   * GET /admin/replay/info
   */
  @Get('info')
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
}

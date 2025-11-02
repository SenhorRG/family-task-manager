import { Module, Global } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { EventReplayer } from './event-replayer';
import { AggregateRehydrationService } from '../../application/services/aggregate-rehydration.service';

@Global()
@Module({
  imports: [CqrsModule],
  providers: [EventReplayer, AggregateRehydrationService],
  exports: [EventReplayer, AggregateRehydrationService],
})
export class EventStoreModule {}


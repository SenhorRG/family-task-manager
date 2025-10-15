import { MemberRemovedEvent } from '../member-removed.event';
import { randomBytes } from 'crypto';

const makeObjectId = () => randomBytes(12).toString('hex');
describe('MemberRemovedEvent', () => {
  describe('constructor', () => {
    it('it should create event with valid data', () => {
      const aggregateId = makeObjectId();
      const eventData = {
        userId: makeObjectId(),
        removedBy: makeObjectId(),
        removedAt: new Date('2024-01-01T00:00:00.000Z'),
      };
      const version = 1;

      const event = new MemberRemovedEvent(aggregateId, eventData, version);

      expect(event.aggregateId).toBe(aggregateId);
      expect(event.aggregateType).toBe('Family');
      expect(event.eventData).toEqual(eventData);
      expect(event.version).toBe(version);
      expect(event.eventType).toBe('MemberRemovedEvent');
      expect(event.occurredOn).toBeInstanceOf(Date);
    });
  });
});

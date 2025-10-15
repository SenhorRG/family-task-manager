import { randomBytes } from 'crypto';
import { FamilyCreatedEvent } from '../family-created.event';
import { FamilyRole } from '../../value-objects';

const makeObjectId = () => randomBytes(12).toString('hex');

describe('FamilyCreatedEvent', () => {
  describe('constructor', () => {
    it('it should create event with valid data', () => {
      const aggregateId = makeObjectId();
      const eventData = {
        name: 'Silva Family',
        principalResponsibleUserId: makeObjectId(),
        principalRole: FamilyRole.FATHER,
        createdAt: new Date(),
      };
      const version = 1;

      const event = new FamilyCreatedEvent(aggregateId, eventData, version);

      expect(event.aggregateId).toBe(aggregateId);
      expect(event.aggregateType).toBe('Family');
      expect(event.eventData).toEqual(eventData);
      expect(event.version).toBe(version);
      expect(event.eventType).toBe('FamilyCreatedEvent');
      expect(event.occurredOn).toBeInstanceOf(Date);
    });
  });
});

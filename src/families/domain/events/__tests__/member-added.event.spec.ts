import { randomBytes } from 'crypto';
import { MemberAddedEvent } from '../member-added.event';
import { FamilyResponsibility, FamilyRole } from '../../value-objects';

const makeObjectId = () => randomBytes(12).toString('hex');
describe('MemberAddedEvent', () => {
  describe('constructor', () => {
    it('it should create event with valid data', () => {
      const aggregateId = makeObjectId();
      const eventData = {
        userId: makeObjectId(),
        role: FamilyRole.SON,
        responsibility: FamilyResponsibility.MEMBER,
        addedBy: makeObjectId(),
        addedAt: new Date('2024-01-01T00:00:00.000Z'),
      };
      const version = 1;

      const event = new MemberAddedEvent(aggregateId, eventData, version);

      expect(event.aggregateId).toBe(aggregateId);
      expect(event.aggregateType).toBe('Family');
      expect(event.eventData).toEqual(eventData);
      expect(event.version).toBe(version);
      expect(event.eventType).toBe('MemberAddedEvent');
      expect(event.occurredOn).toBeInstanceOf(Date);
    });
  });
});

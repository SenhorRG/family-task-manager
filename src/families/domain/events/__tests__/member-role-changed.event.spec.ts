import { FamilyResponsibility, FamilyRole } from '../../value-objects';
import { MemberRoleChangedEvent } from '../member-role-changed.event';
import { randomBytes } from 'crypto';

const makeObjectId = () => randomBytes(12).toString('hex');
describe('MemberRoleChangedEvent', () => {
  describe('constructor', () => {
    it('it should create event with valid data', () => {
      const aggregateId = makeObjectId();
      const eventData = {
        userId: makeObjectId(),
        oldRole: FamilyRole.SON,
        oldResponsibility: FamilyResponsibility.MEMBER,
        newRole: FamilyRole.FATHER,
        newResponsibility: FamilyResponsibility.AUXILIARY_RESPONSIBLE,
        changedBy: makeObjectId(),
        changedAt: new Date('2024-01-01T00:00:00.000Z'),
      };
      const version = 1;

      const event = new MemberRoleChangedEvent(aggregateId, eventData, version);

      expect(event.aggregateId).toBe(aggregateId);
      expect(event.aggregateType).toBe('Family');
      expect(event.eventData).toEqual(eventData);
      expect(event.version).toBe(version);
      expect(event.eventType).toBe('MemberRoleChangedEvent');
      expect(event.occurredOn).toBeInstanceOf(Date);
    });
  });
});

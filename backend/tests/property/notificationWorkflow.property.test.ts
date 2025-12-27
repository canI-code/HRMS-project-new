import fc from 'fast-check';
import { computeDeliveries, NotificationRecipient } from '../../src/domains/notifications/services/NotificationService';
import { NotificationChannel } from '../../src/domains/notifications/models/Notification';

const channels = [
  NotificationChannel.EMAIL,
  NotificationChannel.SMS,
  NotificationChannel.PUSH,
  NotificationChannel.IN_APP,
];

describe('Workflow Notification Properties', () => {
  test('Property 36: workflow notification completeness', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            userId: fc.uuid(),
            channels: fc.subarray(channels, { minLength: 1, maxLength: channels.length }),
          }),
          { minLength: 1, maxLength: 4 }
        ),
        fc.constantFrom(...channels),
        (recipientsInput, templateChannel) => {
          const deduped = new Map<string, { userId: string; channels: NotificationChannel[] }>();
          recipientsInput.forEach((r) => {
            if (!deduped.has(r.userId)) {
              deduped.set(r.userId, r);
            }
          });

          const recipients: NotificationRecipient[] = Array.from(deduped.values()).map((r) => ({
            userId: r.userId,
            channels: r.channels,
          }));

          const preferences = new Map<string, { enabledChannels: NotificationChannel[]; mutedCategories: string[]; optOutAll: boolean }>();
          recipients.forEach((r) => {
            preferences.set(r.userId, {
              enabledChannels: channels,
              mutedCategories: [],
              optOutAll: false,
            });
          });

          const deliveries = computeDeliveries(recipients, preferences, templateChannel, 'workflow');

          const expectedTotal = recipients.reduce((acc, recipient) => {
            const requested = recipient.channels && recipient.channels.length > 0 ? Array.from(new Set(recipient.channels)) : [templateChannel];
            return acc + requested.length;
          }, 0);

          expect(deliveries).toHaveLength(expectedTotal);

          recipients.forEach((recipient) => {
            const requested = recipient.channels && recipient.channels.length > 0 ? Array.from(new Set(recipient.channels)) : [templateChannel];
            const deliveredChannels = deliveries
              .filter((d) => d.userId === recipient.userId)
              .map((d) => d.channel)
              .sort();
            expect(deliveredChannels).toStrictEqual([...requested].sort());
          });
        }
      ),
      { numRuns: 50 }
    );
  });
});

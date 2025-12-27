import fc from 'fast-check';
import { computeDeliveries, NotificationRecipient } from '../../src/domains/notifications/services/NotificationService';
import { NotificationChannel } from '../../src/domains/notifications/models/Notification';

const channels = [
  NotificationChannel.EMAIL,
  NotificationChannel.SMS,
  NotificationChannel.PUSH,
  NotificationChannel.IN_APP,
];

describe('Notification Preference Properties', () => {
  test('Property 37: event notification preference compliance', () => {
    fc.assert(
      fc.property(
        fc.record({
          enabledChannels: fc.subarray(channels, { minLength: 0, maxLength: channels.length }),
          mutedWorkflow: fc.boolean(),
          optOutAll: fc.boolean(),
          requested: fc.subarray(channels, { minLength: 1, maxLength: channels.length }),
        }),
        (input) => {
          const recipient: NotificationRecipient = { userId: 'user-1', channels: input.requested };
          const preferences = new Map<string, { enabledChannels: NotificationChannel[]; mutedCategories: string[]; optOutAll: boolean }>();
          preferences.set(recipient.userId, {
            enabledChannels: input.enabledChannels,
            mutedCategories: input.mutedWorkflow ? ['workflow'] : [],
            optOutAll: input.optOutAll,
          });

          const deliveries = computeDeliveries([recipient], preferences, NotificationChannel.EMAIL, 'workflow');

          const expected = input.optOutAll || input.mutedWorkflow
            ? []
            : input.requested.filter((channel) => input.enabledChannels.includes(channel));

          const deliveredChannels = deliveries.map((d) => d.channel).sort();
          expect(deliveredChannels).toStrictEqual([...expected].sort());
        }
      ),
      { numRuns: 60 }
    );
  });
});

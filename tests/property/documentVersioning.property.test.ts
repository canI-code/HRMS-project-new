import fc from 'fast-check';
import { appendVersionHistory, computeNextVersionNumber } from '../../src/domains/documents/services/DocumentService';
import { Types } from 'mongoose';

const makeVersion = (version: number) => ({
  version,
  storageKey: `key-${version}`,
  uploadedBy: new Types.ObjectId(),
  uploadedAt: new Date(),
});

describe('Document Version Control', () => {
  test('Property 32: next version is monotonic increment', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 50 }), (current) => {
        const next = computeNextVersionNumber(current);
        expect(next).toBe(current + 1);
      }),
      { numRuns: 50 }
    );
  });

  test('Version history preserves older entries and appends new version in order', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 5 }), fc.integer({ min: 1, max: 5 }), (count, start) => {
        const baseHistory = Array.from({ length: count }, (_, idx) => makeVersion(start + idx));
        const last = baseHistory[baseHistory.length - 1];
        if (!last) {
          throw new Error('Base history must contain at least one version');
        }
        const current = last.version;
        const nextVersion = makeVersion(computeNextVersionNumber(current));
        const updated = appendVersionHistory(baseHistory, nextVersion);

        expect(updated).toHaveLength(baseHistory.length + 1);
        expect(updated.map((v) => v.version)).toStrictEqual(
          [...baseHistory, nextVersion].map((v) => v.version).sort((a, b) => a - b)
        );
        baseHistory.forEach((v) => {
          const matched = updated.find((u) => u.version === v.version);
          expect(matched).toBeDefined();
          expect(matched?.storageKey).toBe(v.storageKey);
        });
      })
    );
  });
});

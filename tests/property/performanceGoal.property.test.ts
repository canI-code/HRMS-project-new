import fc from 'fast-check';
import { computeNextProgress } from '../../src/domains/performance/services/PerformanceService';

describe('Performance Goal Progress Properties', () => {
  test('Property 26: progress stays within 0-100 and status reflects completion', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: -200, max: 200 }),
        (current, delta) => {
          const result = computeNextProgress(current, delta);
          expect(result.progress).toBeGreaterThanOrEqual(0);
          expect(result.progress).toBeLessThanOrEqual(100);

          if (result.progress === 100) {
            expect(result.status).toBe('completed');
          } else if (result.progress === 0) {
            expect(result.status).toBe('draft');
          } else {
            expect(result.status).toBe('in_progress');
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  test('Property: non-negative increments never decrease progress and cap at 100', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 0, max: 80 }), { minLength: 1, maxLength: 6 }),
        (increments) => {
          let progress = 0;
          let status = 'draft';

          for (const inc of increments) {
            const next = computeNextProgress(progress, inc);
            expect(next.progress).toBeGreaterThanOrEqual(progress);
            expect(next.progress).toBeLessThanOrEqual(100);
            progress = next.progress;
            status = next.status;
          }

          if (progress === 100) {
            expect(status).toBe('completed');
          }
        }
      ),
      { numRuns: 30 }
    );
  });
});

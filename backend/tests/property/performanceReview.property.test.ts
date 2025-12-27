import fc from 'fast-check';
import { validateReviewCompletionData } from '../../src/domains/performance/services/PerformanceService';
import { AppError } from '../../src/shared/utils/AppError';

describe('Performance Review Completion Properties', () => {
  test('Property 27: valid rating and feedback pass validation', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }),
        fc.string({ minLength: 3, maxLength: 40 }),
        fc.string({ minLength: 3, maxLength: 40 }),
        (rating, strengths, improvements) => {
          expect(() => validateReviewCompletionData({ rating, strengths, improvements })).not.toThrow();
        }
      ),
      { numRuns: 30 }
    );
  });

  test('Invalid rating outside 1-5 is rejected', () => {
    fc.assert(
      fc.property(fc.oneof(fc.integer({ max: 0 }), fc.integer({ min: 6, max: 20 })), (rating) => {
        expect(() => validateReviewCompletionData({ rating, strengths: 's', improvements: 'i' })).toThrow(AppError);
      }),
      { numRuns: 20 }
    );
  });

  test('Missing feedback is rejected', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 5 }), (rating) => {
        expect(() => validateReviewCompletionData({ rating, strengths: '', improvements: '' })).toThrow(AppError);
      }),
      { numRuns: 20 }
    );
  });
});

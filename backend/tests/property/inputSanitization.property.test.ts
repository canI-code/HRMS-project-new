import fc from 'fast-check';
import { sanitizeValue } from '../../src/shared/middleware/security';

describe('Input Sanitization', () => {
  test('Property 40: strips script tags and trims strings', () => {
    fc.assert(
      fc.property(fc.string(), (randomText) => {
        const dirty = `  <script>alert('x')</script>${randomText}  <div>${randomText}</div>  `;
        const sanitized = sanitizeValue(dirty) as string;

        expect(sanitized.includes('<script')).toBe(false);
        expect(sanitized.includes('</script>')).toBe(false);
        expect(sanitized.startsWith(' ')).toBe(false);
        expect(sanitized.endsWith(' ')).toBe(false);
      }),
      { numRuns: 60 }
    );
  });
});

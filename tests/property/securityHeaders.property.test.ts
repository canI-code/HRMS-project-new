import fc from 'fast-check';
import request from 'supertest';
import { app } from '../../src/server';

describe('Security Headers', () => {
  test('Property 41: data transmission security headers are present', async () => {
    await fc.assert(
      fc.asyncProperty(fc.constant('/health'), async (path) => {
        const res = await request(app).get(path);
        expect(res.headers['x-dns-prefetch-control']).toBeDefined();
        expect(res.headers['x-content-type-options']).toBe('nosniff');
        expect(res.headers['x-frame-options']).toBeDefined();
      }),
      { numRuns: 5 }
    );
  });
});

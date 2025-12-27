import request from 'supertest';
import { app } from '../../src/server';

describe('Performance Monitoring', () => {
  test('Property 46: response time header is attached', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-response-time']).toBeDefined();
    const value = res.headers['x-response-time'];
    expect(typeof value).toBe('string');
    const numeric = Number(String(value).replace('ms', ''));
    expect(Number.isFinite(numeric)).toBe(true);
    expect(numeric).toBeGreaterThanOrEqual(0);
  });
});

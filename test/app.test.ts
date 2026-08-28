import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';

const app = await buildApp();

beforeAll(async () => app.ready());
afterAll(async () => app.close());

describe('API foundation', () => {
  it('returns a health response', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
  });

  it('rejects a non-LinkedIn profile URL', async () => {
    const response = await app.inject({ method: 'POST', url: '/api/v1/profile', payload: { url: 'https://example.com/in/test/' } });
    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe('INVALID_PROFILE_URL');
  });

  it('reports an unconfigured LinkedIn session', async () => {
    const response = await app.inject({ method: 'POST', url: '/api/v1/profile', payload: { url: 'https://www.linkedin.com/in/test/' } });
    expect(response.statusCode).toBe(503);
    expect(response.json().error.code).toBe('LINKEDIN_SESSION_NOT_CONFIGURED');
  });
});

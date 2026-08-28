import { describe, expect, it } from 'vitest';
import { LinkedInClient } from '../src/linkedin/client.js';
import {
  LinkedInSessionError,
  UpstreamError,
} from '../src/errors.js';

describe('LinkedInClient.fetchExperience', () => {
  it('fetches the profile Experience component with the session cookie', async () => {
    const fetchImpl = async (
      input: string | URL | Request,
      init?: RequestInit,
    ) => {
      expect(input.toString()).toBe(
        'https://www.linkedin.com/in/example/details/experience/',
      );
      expect(init?.headers).toEqual({
        accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        cookie: 'li_at=session-cookie',
        'user-agent': 'test-agent',
      });

      return new Response('experience response');
    };

    const client = new LinkedInClient({
      liAt: 'session-cookie',
      userAgent: 'test-agent',
      fetchImpl,
    });

    await expect(
      client.fetchExperience('https://www.linkedin.com/in/example/'),
    ).resolves.toBe('experience response');
  });

  it('requires a LinkedIn session', async () => {
    const client = new LinkedInClient({
      fetchImpl: async () => new Response('unexpected'),
    });

    await expect(
      client.fetchExperience('https://www.linkedin.com/in/example/'),
    ).rejects.toBeInstanceOf(LinkedInSessionError);
  });

  it('maps upstream failures to UpstreamError', async () => {
    const client = new LinkedInClient({
      liAt: 'session-cookie',
      fetchImpl: async () => new Response(null, { status: 403 }),
    });

    await expect(
      client.fetchExperience('https://www.linkedin.com/in/example/'),
    ).rejects.toBeInstanceOf(UpstreamError);
  });
});
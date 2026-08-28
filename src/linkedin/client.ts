import { LinkedInSessionError, UpstreamError } from '../errors.js';

export interface LinkedInClientOptions {
  liAt?: string;
  userAgent?: string;
  fetchImpl?: typeof fetch;
}

export class LinkedInClient {
  private readonly fetchImpl: typeof fetch;

  constructor(private readonly options: LinkedInClientOptions = {}) {
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async fetchProfilePage(url: string): Promise<string> {
    if (!this.options.liAt) {
      throw new LinkedInSessionError();
    }

    const response = await this.fetchImpl(url, {
      headers: {
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        cookie: `li_at=${this.options.liAt}`,
        ...(this.options.userAgent ? { 'user-agent': this.options.userAgent } : {}),
      },
    });

    if (response.status === 401 || response.status === 403) {
      throw new UpstreamError('LinkedIn rejected the configured session.');
    }
    if (response.status === 404) {
      throw new UpstreamError('LinkedIn profile was not found.');
    }
    if (!response.ok) {
      throw new UpstreamError(`LinkedIn request failed with status ${response.status}.`);
    }

    return response.text();
  }
}

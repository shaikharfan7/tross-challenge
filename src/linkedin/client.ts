import { writeFile } from 'fs/promises';

import {
  LinkedInSessionError,
  UpstreamError,
} from '../errors.js';

export interface LinkedInClientOptions {
  liAt?: string;

  userAgent?: string;

  fetchImpl?: typeof fetch;
}

export class LinkedInClient {
  private readonly fetchImpl: typeof fetch;

  constructor(
    private readonly options: LinkedInClientOptions = {},
  ) {
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  /**
   * Fetches the main LinkedIn profile page.
   */
  async fetchProfilePage(url: string): Promise<string> {
    this.assertSession();

    const response = await this.fetchImpl(url, {
      headers: this.createHeaders({
        accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      }),
    });

    this.assertResponse(response);

    const html = await response.text();

    // Temporary debugging output.
    await writeFile(
      '/tmp/linkedin-profile.html',
      html,
    );
    

    return html;
  }

  /**
   * Fetches the LinkedIn Experience component response.
   */
  // async fetchExperience(url: string): Promise<string> {
  //   this.assertSession();

  //   const experienceUrl = new URL(
  //     'details/experience/',
  //     url.endsWith('/') ? url : `${url}/`,
  //   );

  //   const response = await this.fetchImpl(
  //     experienceUrl,
  //     {
  //       headers: this.createHeaders({
  //         accept:
  //           'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  //       }),
  //     },
  //   );

  //    await writeFile(
  //     '/tmp/linkedin-profile.html',
  //     await response.text(),
  //   );

  //   this.assertResponse(response);

  //   return response.text();
  // }

  async fetchExperience(url: string): Promise<string> {
  this.assertSession();

  const experienceUrl = new URL(
    'details/experience/',
    url.endsWith('/') ? url : `${url}/`,
  );

  const response = await this.fetchImpl(
    experienceUrl,
    {
      headers: this.createHeaders({
        accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      }),
    },
  );

  this.assertResponse(response);

  const html = await response.text();

  // Temporary debugging output.
  await writeFile(
    '/tmp/linkedin-experience.html',
    html,
  );

  return html;
}

  private assertSession(): void {
    if (!this.options.liAt) {
      throw new LinkedInSessionError();
    }
  }

  private createHeaders(
    additionalHeaders: Record<string, string> = {},
  ): Record<string, string> {
    return {
      ...additionalHeaders,

      cookie: `li_at=${this.options.liAt}`,

      ...(this.options.userAgent
        ? {
            'user-agent': this.options.userAgent,
          }
        : {}),
    };
  }

  private assertResponse(response: Response): void {
    if (
      response.status === 401 ||
      response.status === 403
    ) {
      throw new UpstreamError(
        'LinkedIn rejected the configured session.',
      );
    }

    if (response.status === 404) {
      throw new UpstreamError(
        'LinkedIn profile was not found.',
      );
    }

    if (!response.ok) {
      throw new UpstreamError(
        `LinkedIn request failed with status ${response.status}.`,
      );
    }
  }
}

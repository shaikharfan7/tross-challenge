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

  /**
   * Fetches the LinkedIn Skills component response.
   *
   * Same pattern as fetchExperience: a direct authenticated GET against
   * the details/skills/ page, no headless browser and no internal
   * rsc-action replay. This depends on the skills list being present in
   * this page's server-rendered HTML rather than requiring a separate
   * lazy-loaded action - that assumption needs to be verified against a
   * real fixture the same way experience was (see
   * LinkedInExperienceParser's dev notes) before trusting the parser
   * output.
   */
  async fetchSkills(url: string): Promise<string> {
    this.assertSession();

    const skillsUrl = new URL(
      'details/skills/',
      url.endsWith('/') ? url : `${url}/`,
    );

    const response = await this.fetchImpl(
      skillsUrl,
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
      '/tmp/linkedin-skills.html',
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
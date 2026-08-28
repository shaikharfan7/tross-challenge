import { LinkedInClient } from '../linkedin/client.js';
import { LinkedInProfilePageParser, type ProfilePageParser } from '../linkedin/parser.js';
import { normalizeProfileUrl, type Profile } from '../schemas/profile.js';

export class ProfileService {
  constructor(
    private readonly client: LinkedInClient,
    private readonly parser: ProfilePageParser = new LinkedInProfilePageParser(),
  ) {}

  async getProfile(inputUrl: string): Promise<Profile> {
    const url = normalizeProfileUrl(inputUrl);
    const html = await this.client.fetchProfilePage(url);

    return this.parser.parse(url, html);
  }
}

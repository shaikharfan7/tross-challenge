
import { LinkedInClient } from '../linkedin/client.js';

import {
  LinkedInProfilePageParser,
  type ProfilePageParser,
} from '../linkedin/parser.js';

import {
  LinkedInExperienceParser,
  type ExperienceParser,
} from '../linkedin/experience-parser.js';

import {
  normalizeProfileUrl,
  type Profile,
} from '../schemas/profile.js';

export class ProfileService {
  constructor(
    private readonly client: LinkedInClient,

    private readonly profileParser: ProfilePageParser =
      new LinkedInProfilePageParser(),

    private readonly experienceParser: ExperienceParser =
      new LinkedInExperienceParser(),
  ) {}

  async getProfile(inputUrl: string): Promise<Profile> {
    const url = normalizeProfileUrl(inputUrl);

    // 1. Fetch and parse the main profile page
    const html = await this.client.fetchProfilePage(url);

    const profile = this.profileParser.parse(
      url,
      html,
    );

    // 2. Fetch and parse the Experience section
    const experienceResponse =
      await this.client.fetchExperience(url);

    const experience =
      this.experienceParser.parse(
        experienceResponse,
      );

    // 3. Return the combined profile
    return {
      ...profile,
      experience,
    };
  }
}

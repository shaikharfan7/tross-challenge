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
  LinkedInSkillsParser,
  type SkillsParser,
} from '../linkedin/skills-parser.js';

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

    private readonly skillsParser: SkillsParser =
      new LinkedInSkillsParser(),
  ) {}

  async getProfile(inputUrl: string): Promise<Profile> {
    const url = normalizeProfileUrl(inputUrl);

    // 1. Fetch and parse the main profile page
    const html = await this.client.fetchProfilePage(url);

    const profile = this.profileParser.parse(
      url,
      html,
    );

    // 2. Fetch and parse Experience
    const experienceResponse =
      await this.client.fetchExperience(url);

    const experience =
      this.experienceParser.parse(
        experienceResponse,
      );

    // 3. Fetch and parse Skills
    //
    // Verified: details/skills/ does not always contain skills in its
    // server-rendered HTML (confirmed empty for at least one tested
    // profile - 0 entity-collection-item cards). LinkedIn appears to
    // load skills client-side via a separate internal component
    // request in that case, which is out of scope for this project
    // (see source.md "Known Limitations"). This still runs for real
    // rather than being hardcoded, so it picks up skills on any
    // profile/account where they are present server-side.
    const skillsResponse =
      await this.client.fetchSkills(url);

    const skills =
      this.skillsParser.parse(
        skillsResponse,
      );

    // 4. Return the combined profile
    return {
      ...profile,
      experience,
      skills,
    };
  }
}
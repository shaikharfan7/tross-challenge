import { load } from 'cheerio';

export interface SkillsParser {
  parse(response: string): string[];
}

function cleanText(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.replace(/\s+/g, ' ').trim();

  return normalized.length > 0 ? normalized : null;
}

export class LinkedInSkillsParser implements SkillsParser {
  /**
   * Parses skills from the details/skills/ server-rendered HTML.
   *
   * VERIFIED (2026-08-29, against a real fixture with a known skill
   * "PostgreSQL" absent from the file entirely): the actual skill
   * entries are NOT present in this page's server-rendered HTML.
   * LinkedIn renders the page shell and the category filter tabs
   * ("All", "Industry Knowledge", "Tools & Technologies", ...)
   * server-side, then loads the underlying skill list client-side
   * after those tabs are interacted with. This project does not
   * replay LinkedIn's internal component-fetch request for that list
   * (see source.md "Known Limitations"), so this correctly and
   * intentionally returns [] for now.
   *
   * The selector list below is scoped narrowly and excludes list/tab
   * containers on purpose - an earlier, broader version of this
   * parser matched the category tab labels themselves and returned
   * them as fake "skills" (["All", "Industry Knowledge", ...]). If
   * LinkedIn ever does render real skill entries server-side for some
   * profile/account combination, this should pick them up without
   * reintroducing that false-positive.
   */
  parse(response: string): string[] {
    const $ = load(response);

    const skillCandidates = [
      '[data-view-name="profile-skills"]',
      '[data-section-id="skills"]',
    ];

    const matchedScope = skillCandidates
      .map((selector) => $(selector))
      .find((collection) => collection.length > 0);

    if (!matchedScope) {
      return [];
    }

    return matchedScope
      .find('[componentkey^="entity-collection-item-"]')
      .map((_, element) => cleanText($(element).find('p, span').first().text()))
      .get()
      .filter((value): value is string => value !== null)
      .filter((value, index, array) => array.indexOf(value) === index)
      .slice(0, 25);
  }
}
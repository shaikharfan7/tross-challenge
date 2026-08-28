import { load } from 'cheerio';
import type { Profile } from '../schemas/profile.js';

/**
 * Parser boundary for the observed LinkedIn profile-page HTML.
 * Section adapters are kept separate because Experience, Education, and Skills
 * arrive from distinct server-component responses.
 */
export interface ProfilePageParser {
  parse(url: string, html: string): Profile;
}

function cleanText(value: string): string | null {
  const normalized = value.replace(/\s+/g, ' ').trim();
  return normalized.length > 0 ? normalized : null;
}

function firstImageUrl(html: string, fragment: string): string | null {
  const $ = load(html);
  const image = $(`img[src*="${fragment}"]`).first().attr('src');
  return image ?? null;
}

/**
 * Parses fields supplied by the server-rendered profile top card. The classes
 * in this document are generated per build, so this uses heading order and
 * LinkedIn's stable media URL families instead of generated CSS selectors.
 */
export class LinkedInProfilePageParser implements ProfilePageParser {
  parse(url: string, html: string): Profile {
    const $ = load(html);
    const headings = $('h2')
      .map((_, element) => cleanText($(element).text()))
      .get()
      .filter((value): value is string => value !== null);

    return {
      url,
      name: headings[0] ?? null,
      headline: headings[1] ?? null,
      location: headings[2] ?? null,
      about: null,
      image: firstImageUrl(html, 'profile-displayphoto'),
      backgroundImage: firstImageUrl(html, 'profile-displaybackgroundimage'),
      experience: [],
      education: [],
      skills: [],
      certifications: [],
      languages: [],
    };
  }
}

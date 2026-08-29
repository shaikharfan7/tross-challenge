import { load } from 'cheerio';
import type { Profile } from '../schemas/profile.js';

export interface ProfilePageParser {
  parse(url: string, html: string): Profile;
}

function cleanText(value: string | undefined | null): string | null {
  if (!value) return null;

  const normalized = value.replace(/\s+/g, ' ').trim();

  return normalized.length > 0 ? normalized : null;
}

function getImageUrl(
  $: ReturnType<typeof load>,
  selector: string,
): string | null {
  return $(selector).first().attr('src') ?? null;
}

export class LinkedInProfilePageParser implements ProfilePageParser {
  parse(url: string, html: string): Profile {
    const $ = load(html);
    const root = $('body');

    const topCard = $('[data-view-name="profile-top-card"]').first();
    const cardScope = topCard.length ? topCard : root;

    const h2Texts = cardScope
      .find('h2')
      .map((_, element) => cleanText($(element).text()))
      .get()
      .filter((value): value is string => value !== null);

    const pTexts = cardScope
      .find('p')
      .map((_, element) => cleanText($(element).text()))
      .get()
      .filter((value): value is string => value !== null);

    const name = cleanText(cardScope.find('h2').first().text()) ?? h2Texts[0] ?? null;

    const headline =
      cleanText(cardScope.find('h2').eq(1).text()) ??
      h2Texts[1] ??
      pTexts[0] ??
      null;

    const location =
      pTexts.find((text) => (
        text.includes(',') &&
        !text.includes('·') &&
        !text.includes('Contact info')
      )) ??
      h2Texts.find((text) => (
        text.includes(',') &&
        !text.includes('·') &&
        !text.includes('Contact info')
      )) ??
      null;

    const image =
      root.find('img[src*="profile-displayphoto"]').first().attr('src') ??
      getImageUrl($, 'img[src*="profile-displayphoto"]') ??
      null;

    const backgroundImage =
      root.find('img[src*="profile-displaybackgroundimage"]').first().attr('src') ??
      getImageUrl($, 'img[src*="profile-displaybackgroundimage"]') ??
      null;

    if (!topCard.length && h2Texts.length === 0 && pTexts.length === 0) {
      return {
        url,
        name: null,
        headline: null,
        location: null,
        about: null,
        image: null,
        backgroundImage: null,
        experience: [],
        education: [],
        skills: [],
        certifications: [],
        languages: [],
      };
    }

    return {
      url,
      name,
      headline,
      location,
      about: null,
      image,
      backgroundImage,
      experience: [],
      education: [],
      skills: [],
      certifications: [],
      languages: [],
    };
  }
}
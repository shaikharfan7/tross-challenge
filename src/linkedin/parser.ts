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
  selector: string
): string | null {
  return $(selector).first().attr('src') ?? null;
}

export class LinkedInProfilePageParser implements ProfilePageParser {
  parse(url: string, html: string): Profile {
    const $ = load(html);

    // IMPORTANT:
    // Only search inside the actual profile card.
    const topCard = $('[data-view-name="profile-top-card"]').first();

    if (!topCard.length) {
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

    // -----------------------------
    // NAME
    // -----------------------------
    const name =
      cleanText(
        topCard.find('h2').first().text()
      );

    // -----------------------------
    // IMAGE
    // -----------------------------
    const image =
      getImageUrl(
        $,
        '[data-view-name="profile-top-card"] img[src*="profile-displayphoto"]'
      );

    // -----------------------------
    // BACKGROUND IMAGE
    // -----------------------------
    const backgroundImage =
      getImageUrl(
        $,
        '[data-view-name="profile-top-card"] img[src*="profile-displaybackgroundimage"]'
      );

    // -----------------------------
    // TEXT FIELDS
    // -----------------------------
    const paragraphs = topCard
      .find('p')
      .map((_, element) => cleanText($(element).text()))
      .get()
      .filter((value): value is string => value !== null);

    /*
     * In the observed top card:
     *
     * h2 -> Arfan Shaikh
     *
     * p[0] -> 5+ years building products...
     * p[1] -> NEOSTARTER GmbH
     * p[2] -> Ponda, Goa, India
     *
     * The company is not currently part of your Profile schema,
     * so we skip it.
     */

    const headline = paragraphs[0] ?? null;

    const location =
      paragraphs.find((text) => {
        // Basic location heuristic.
        // Improve this if your schema/page format changes.
        return (
          text.includes(',') &&
          !text.includes('·') &&
          !text.includes('Contact info')
        );
      }) ?? null;

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
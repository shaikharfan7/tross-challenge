import { load } from 'cheerio';
import type { Experience } from '../schemas/profile.js';

export interface ExperienceParser {
  parse(response: string): Experience[];
}

type CheerioRoot = ReturnType<typeof load>;
type CheerioNode = ReturnType<CheerioRoot>;

function cleanText(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.replace(/\s+/g, ' ').trim();

  return normalized.length > 0 ? normalized : null;
}

function getImageUrl(scope: CheerioNode, selector: string): string | null {
  const src = scope.find(selector).first().attr('src') ?? null;

  if (!src) {
    return null;
  }

  try {
    // Experience schema requires a valid absolute URL or null -
    // never an empty/relative string.
    new URL(src);
    return src;
  } catch {
    return null;
  }
}

export class LinkedInExperienceParser implements ExperienceParser {
  parse(response: string): Experience[] {
    const $ = load(response);

    // Note: profile-experience-details-view exists in the DOM but does
    // NOT wrap the actual position cards (confirmed empirically - it's
    // effectively an empty shell/boundary marker). The cards live
    // elsewhere in the document, so we search the whole page instead
    // of scoping to that container.
    //
    // Each position is a repeating card keyed by a stable, non-hashed
    // attribute. LinkedIn's class names are hashed/obfuscated and churn
    // on deploy, so we deliberately avoid selecting on them.
    const cards = $('[componentkey^="entity-collection-item-"]');

    const experience: Experience[] = [];

    cards.each((_, element) => {
      const entry = this.parseCard($, $(element));

      if (entry) {
        experience.push(entry);
      }
    });

    return experience;
  }

  private parseCard($: CheerioRoot, card: CheerioNode): Experience | null {
    // The description lives in its own paragraph, outside the company
    // link, keyed by a stable test id.
    const descriptionNode = card
      .find('[data-testid="expandable-text-box"]')
      .first();

    // When a position has a linked company page, title/company/dates/
    // location are the (in-order) <p> descendants of that <a>. Not every
    // position links to a company page (e.g. unlisted/smaller companies),
    // so fall back to reading the same <p> sequence directly off the
    // card, stopping before the description paragraph.
    const companyLink = card.find('a[href*="/company/"]').first();

    let paragraphs: string[];

    if (companyLink.length) {
      paragraphs = companyLink
        .find('p')
        .map((_, el) => cleanText($(el).text()))
        .get()
        .filter((value): value is string => value !== null);
    } else {
      paragraphs = card
        .find('p')
        .filter((_, el) => {
          return (
            descriptionNode.length === 0 ||
            el !== descriptionNode.get(0)
          );
        })
        .map((_, el) => cleanText($(el).text()))
        .get()
        .filter((value): value is string => value !== null)
        .slice(0, 4);
    }

    const [titleRaw, companyRaw, datesRaw, locationRaw] = paragraphs;

    if (!titleRaw && !companyRaw) {
      // Nothing recognizable on this card - skip it rather than emit
      // an all-null entry.
      return null;
    }

    const { startDate, endDate } = this.parseDates(datesRaw);

    return {
      title: titleRaw ?? null,
      company: this.stripTrailingMeta(companyRaw),
      location: this.stripTrailingMeta(locationRaw),
      description: this.parseDescription($, descriptionNode),
      startDate,
      endDate,
      image: getImageUrl(card, 'figure[data-view-name="image"] img'),
    };
  }

  /**
   * Company text arrives as "NEOSTARTER GmbH · Full-time" and location
   * as "Düsseldorf, Germany · Remote" - we only keep the part before
   * the "·" separator; the schema has no field for employment type or
   * work arrangement.
   */
  private stripTrailingMeta(raw: string | undefined): string | null {
    if (!raw) {
      return null;
    }

    return cleanText(raw.split('·')[0]);
  }

  private parseDates(raw: string | undefined): {
    startDate: string | null;
    endDate: string | null;
  } {
    if (!raw) {
      return { startDate: null, endDate: null };
    }

    // e.g. "Jun 2025 - Present · 1 yr 3 mos" - drop the duration,
    // then split the remaining range on the dash.
    const range = raw.split('·')[0]?.trim() ?? '';
    const [start, end] = range.split(/\s*-\s*/);

    return {
      startDate: cleanText(start),
      endDate: cleanText(end),
    };
  }

  /**
   * The description paragraph uses <br/> tags for line breaks instead
   * of separate elements, so a plain .text() call would collapse
   * everything onto one line. We split on <br/> first, then strip tags
   * from each line individually.
   */
  private parseDescription(
    $: CheerioRoot,
    node: CheerioNode
  ): string | null {
    if (!node.length) {
      return null;
    }

    const html = node.html() ?? '';

    const lines = html
      .split(/<br\s*\/?>/i)
      .map((segment) => cleanText(load(`<span>${segment}</span>`)('span').text()))
      .filter((value): value is string => value !== null);

    return lines.length > 0 ? lines.join('\n') : null;
  }
}
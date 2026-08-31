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
   * Parses skills from either:
   *
   * 1. A server-rendered profile-skills section in HTML, or
   * 2. The SDUI payload that LinkedIn embeds in the page/component stream.
   *
   * The app intentionally avoids catalog tabs and generic page navigation,
   * because LinkedIn renders filter labels such as "All" and "Industry
   * Knowledge" server-side but those are not actual skill names.
   */
  parse(response: string): string[] {
    const trimmed = response.trim();

    if (!trimmed) {
      return [];
    }

    const $ = load(response);

    const htmlSkills = this.parseHtmlSkills($);
    if (htmlSkills.length > 0) {
      return htmlSkills;
    }

    return this.parseSduiSkills(response);
  }

  private parseHtmlSkills($: ReturnType<typeof load>): string[] {
    const skillCandidates = [
      '[data-view-name="profile-skills"]',
      '[data-section-id="skills"]',
      '[id*="skills"]',
      'section[data-section-id*="skills"]',
    ];

    const matchedScope = skillCandidates
      .map((selector) => $(selector))
      .find((collection) => collection.length > 0);

    if (!matchedScope) {
      return [];
    }

    const candidates = matchedScope
      .find('a[href*="/skills"], a[href*="skills/"]')
      .map((_, element) => cleanText($(element).text()))
      .get()
      .filter((value): value is string => value !== null)
      .filter((value) => this.isLikelySkillName(value));

    return this.dedupe(candidates).slice(0, 25);
  }

  private parseSduiSkills(response: string): string[] {
    const candidates = new Set<string>();
    let cursor = 0;

    while (cursor < response.length) {
      const keyIndex = response.indexOf('"children"', cursor);

      if (keyIndex === -1) {
        break;
      }

      const colonIndex = response.indexOf(':', keyIndex + '"children"'.length);

      if (colonIndex === -1) {
        break;
      }

      let valueIndex = colonIndex + 1;
      while (valueIndex < response.length && /\s/.test(response[valueIndex])) {
        valueIndex += 1;
      }

      if (response[valueIndex] === '"') {
        const parsed = this.readQuotedString(response, valueIndex);

        if (parsed) {
          const skillName = this.normalizeSduiText(parsed.value);

          if (skillName && this.isLikelySkillName(skillName)) {
            candidates.add(skillName);
          }

          cursor = parsed.nextIndex;
          continue;
        }
      }

      if (response[valueIndex] === '[') {
        const parsedArray = this.readTopLevelStringValues(response, valueIndex);

        for (const value of parsedArray.values) {
          const skillName = this.normalizeSduiText(value);

          if (skillName && this.isLikelySkillName(skillName)) {
            candidates.add(skillName);
          }
        }

        cursor = parsedArray.nextIndex;
        continue;
      }

      cursor = valueIndex + 1;
    }

    return Array.from(candidates).slice(0, 25);
  }

  private readQuotedString(response: string, startIndex: number): {
    value: string;
    nextIndex: number;
  } | null {
    let result = '';
    let i = startIndex + 1;

    while (i < response.length) {
      const char = response[i];

      if (char === '\\') {
        const next = response[i + 1];

        if (next === 'u') {
          const hex = response.slice(i + 2, i + 6);

          if (/^[0-9a-fA-F]{4}$/.test(hex)) {
            result += String.fromCharCode(Number.parseInt(hex, 16));
            i += 6;
            continue;
          }
        }

        if (next !== undefined) {
          result += next;
          i += 2;
          continue;
        }
      }

      if (char === '"') {
        return {
          value: result,
          nextIndex: i + 1,
        };
      }

      result += char;
      i += 1;
    }

    return null;
  }

  private readTopLevelStringValues(response: string, startIndex: number): {
    values: string[];
    nextIndex: number;
  } {
    const values: string[] = [];
    let i = startIndex + 1;
    let arrayDepth = 1;
    let objectDepth = 0;

    while (i < response.length) {
      const char = response[i];

      if (char === '"' && arrayDepth === 1 && objectDepth === 0) {
        const parsed = this.readQuotedString(response, i);

        if (parsed) {
          values.push(parsed.value);
          i = parsed.nextIndex;
          continue;
        }
      }

      if (char === '{') {
        objectDepth += 1;
      } else if (char === '}') {
        objectDepth = Math.max(0, objectDepth - 1);
      } else if (char === '[') {
        arrayDepth += 1;
      } else if (char === ']') {
        arrayDepth -= 1;

        if (arrayDepth === 0) {
          return {
            values,
            nextIndex: i + 1,
          };
        }
      }

      i += 1;
    }

    return {
      values,
      nextIndex: response.length,
    };
  }

  private normalizeSduiText(value: string): string | null {
    const normalized = cleanText(
      value
        .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(Number.parseInt(hex, 16)))
        .replace(/\\n/g, ' '),
    );

    return normalized;
  }

  private isLikelySkillName(value: string): boolean {
    const normalized = cleanText(value);

    if (!normalized) {
      return false;
    }

    const lowered = normalized.toLowerCase();

    if (lowered.length < 2) {
      return false;
    }

    const excludedPatterns = [
      /^all$/i,
      /^industry knowledge$/i,
      /^tools ?& ?technologies$/i,
      /^soft skills$/i,
      /^show more$/i,
      /^show less$/i,
      /^view all$/i,
      /^me$/i,
      /^my network$/i,
      /^jobs$/i,
      /^messaging$/i,
      /^home$/i,
      /^profile$/i,
      /^\$[A-Za-z0-9_]+$/,
      /^action(s)?$/i,
      /^navigate$/i,
      /^proto\./i,
      /^textprops$/i,
      /^maxlinecountexpression$/i,
      /^fontfamily$/i,
      /^fontstyle$/i,
      /^fontweight$/i,
      /^lineheight$/i,
      /^textalign$/i,
      /^linkcolortokens$/i,
      /^linkhoverdecoration$/i,
      /^linkstyle$/i,
      /^colorstatelistidentifier$/i,
      /^shouldsupportvisitedstate$/i,
      /^linkformatting$/i,
      /^children$/i,
      /\b(?:experience|company|companies|connections|followers|education|certifications|language|skills)\b/i,
      /\d+\s*(?:years?|months?|weeks?|days?)\b/i,
      /^\d+\s+.*\b(?:experience|company|companies)\b/i,
      /\b(?:at\s+.*\s+and\s+\d+\s+other company|at\s+.*\s+and\s+\d+\s+other companies)\b/i,
    ];

    if (excludedPatterns.some((pattern) => pattern.test(normalized))) {
      return false;
    }

    return /[a-z]/i.test(normalized) && !normalized.startsWith('$');
  }

  private dedupe(values: string[]): string[] {
    const unique: string[] = [];
    const seen = new Set<string>();

    for (const value of values) {
      if (!seen.has(value)) {
        seen.add(value);
        unique.push(value);
      }
    }

    return unique;
  }
}
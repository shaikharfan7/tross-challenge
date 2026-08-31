import { describe, expect, it } from 'vitest';
import { LinkedInExperienceParser } from '../src/linkedin/experience-parser.js';

describe('LinkedInExperienceParser', () => {
  it('parses cards emitted outside the details view shell', () => {
    const response = `
      <div data-view-name="profile-experience-details-view"></div>
      <div componentkey="entity-collection-item-first">
        <p>Software Engineer</p>
        <p>Example Co · Full-time</p>
        <p>Jun 2025 - Present · 1 yr</p>
        <p>Goa · Remote</p>
        <p>Built useful things.</p>
      </div>
      <div componentkey="entity-collection-item-second">
        <p>Intern</p>
        <p>Example Labs · Internship</p>
        <p>May 2016 · 1 mo</p>
        <p>Ponda · On-site</p>
      </div>
    `;

    expect(new LinkedInExperienceParser().parse(response)).toEqual([
      {
        title: 'Software Engineer',
        company: 'Example Co',
        location: 'Goa',
        description: 'Built useful things.',
        startDate: 'Jun 2025',
        endDate: 'Present',
        image: null,
      },
      {
        title: 'Intern',
        company: 'Example Labs',
        location: 'Ponda',
        description: null,
        startDate: 'May 2016',
        endDate: null,
        image: null,
      },
    ]);
  });
});
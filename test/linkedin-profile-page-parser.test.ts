import { describe, expect, it } from 'vitest';
import { LinkedInProfilePageParser } from '../src/linkedin/parser.js';

describe('LinkedInProfilePageParser', () => {
  it('normalizes verified top-card fields and image URLs', () => {
    const profile = new LinkedInProfilePageParser().parse('https://www.linkedin.com/in/example/', `
      <html><body>
        <h2>Example Person</h2>
        <h2>Software Engineer</h2>
        <h2>Goa, India</h2>
        <img src="https://media.licdn.com/dms/image/profile-displayphoto-shrink_800_800/example" />
        <img src="https://media.licdn.com/dms/image/profile-displaybackgroundimage-shrink_350_1400/example" />
      </body></html>
    `);

    expect(profile).toMatchObject({
      url: 'https://www.linkedin.com/in/example/',
      name: 'Example Person',
      headline: 'Software Engineer',
      location: 'Goa, India',
      image: 'https://media.licdn.com/dms/image/profile-displayphoto-shrink_800_800/example',
      backgroundImage: 'https://media.licdn.com/dms/image/profile-displaybackgroundimage-shrink_350_1400/example',
    });
    expect(profile.experience).toEqual([]);
    expect(profile.about).toBeNull();
  });
});

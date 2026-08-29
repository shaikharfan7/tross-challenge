import { describe, expect, it } from 'vitest';
import { LinkedInSkillsParser } from '../src/linkedin/skills-parser.js';

describe('LinkedInSkillsParser', () => {
  it('extracts skill names from a profile skills section in HTML', () => {
    const html = `
      <html><body>
        <section data-view-name="profile-skills">
          <ul>
            <li><a href="/in/example/skills/">Product Strategy</a></li>
            <li><a href="/in/example/skills/">TypeScript</a></li>
            <li><a href="/in/example/skills/">Leadership</a></li>
          </ul>
        </section>
      </body></html>
    `;

    const skills = new LinkedInSkillsParser().parse(html);

    expect(skills).toEqual([
      'Product Strategy',
      'TypeScript',
      'Leadership',
    ]);
  });

  it('extracts skill names from the LinkedIn SDUI component payload', () => {
    const payload = `17:["$","$L12",null,{"maxLineCountExpression":2,"textColorExpression":176,"textProps":{"fontFamily":"sans","fontSize":"medium","fontStyle":"normal","fontWeight":"bold","lineHeight":"default","textAlign":"start","children":["PostgreSQL"],"linkColorTokens":"$undefined","linkHoverDecoration":"none"}}]
1a:["$","$L12",null,{"maxLineCountExpression":2,"textColorExpression":176,"textProps":{"fontFamily":"sans","fontSize":"medium","fontStyle":"normal","fontWeight":"bold","lineHeight":"default","textAlign":"start","children":["AI Chatbots"],"linkColorTokens":"$undefined","linkHoverDecoration":"none"}}]
19:["$","$L12",null,{"maxLineCountExpression":2,"textColorExpression":176,"textProps":{"fontFamily":"sans","fontSize":"small","fontStyle":"normal","fontWeight":"normal","lineHeight":"default","textAlign":"start","children":[["$","$L1d",{"action":{"actions":[{"$type":"proto.sdui.actions.core.Navigate"}],"viewTrackingSpecs":"$undefined","linkStyle":{"$type":"proto.sdui.components.core.text.LinkStyle","style":{"$case":"colorStateListIdentifier","colorStateListIdentifier":4},"shouldSupportVisitedState":false,"linkFormatting":"LinkFormatting_DEFAULT"},"children":["2 experiences at NEOSTARTER GmbH and 1 other company"]}]],"weight":1,"linkColorTokens":{"default":"text","hover":"linkHover","active":"linkActive"},"linkHoverDecoration":"underline"}}]`;

    const skills = new LinkedInSkillsParser().parse(payload);

    expect(skills).toEqual([
      'PostgreSQL',
      'AI Chatbots',
    ]);
  });

  it('ignores generic page navigation when there is no skills section in the HTML', () => {
    const html = `
      <html>
        <body>
          <nav>
            <a>Home</a>
            <a>My Network</a>
            <a>Jobs</a>
            <a>Messaging</a>
            <a>Me</a>
          </nav>
          <div>Arfan Shaikh</div>
          <div>5+ years building products for founders across Europe.</div>
        </body>
      </html>
    `;

    const skills = new LinkedInSkillsParser().parse(html);

    expect(skills).toEqual([]);
  });
});

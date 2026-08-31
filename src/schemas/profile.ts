import { z } from 'zod';

/**
 * Validates a public LinkedIn profile URL.
 */
export const linkedinProfileUrlSchema = z
  .string()
  .trim()
  .url()
  .superRefine((value, ctx) => {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    const segments = url.pathname.split('/').filter(Boolean);

    const isLinkedInHost =
      host === 'linkedin.com' ||
      host === 'www.linkedin.com';

    const isProfilePath =
      segments.length === 2 &&
      segments[0] === 'in' &&
      segments[1].length > 0;

    if (!isLinkedInHost || !isProfilePath) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'URL must be a LinkedIn profile URL such as https://www.linkedin.com/in/example/',
      });
    }
  });

export const profileRequestSchema = z
  .object({
    url: linkedinProfileUrlSchema,
  })
  .strict();

export type ProfileRequest = z.infer<
  typeof profileRequestSchema
>;

/**
 * Converts equivalent LinkedIn profile URLs into one canonical form.
 */
export function normalizeProfileUrl(value: string): string {
  const url = new URL(value);

  const segments = url.pathname
    .split('/')
    .filter(Boolean);

  const slug = segments[1];

  if (!slug) {
    throw new Error('Invalid LinkedIn profile URL');
  }

  return `https://www.linkedin.com/in/${slug}/`;
}

/**
 * A normalized work experience entry.
 */
export const experienceSchema = z
  .object({
    title: z.string().nullable(),

    company: z.string().nullable(),

    location: z.string().nullable(),

    description: z.string().nullable(),

    startDate: z.string().nullable(),

    endDate: z.string().nullable(),

    /**
     * Usually the company logo associated with this experience.
     */
    image: z.string().url().nullable(),
  })
  .strict();

export type Experience = z.infer<
  typeof experienceSchema
>;


/**
 * A normalized education entry.
 */
export const educationSchema = z
  .object({
    school: z.string().nullable(),

    degree: z.string().nullable(),

    fieldOfStudy: z.string().nullable(),

    description: z.string().nullable(),

    startDate: z.string().nullable(),

    endDate: z.string().nullable(),

    /**
     * Usually the school's logo or image.
     */
    image: z.string().url().nullable(),
  })
  .strict();

export type Education = z.infer<
  typeof educationSchema
>;

/**
 * The normalized profile returned by our API.
 *
 * This schema is intentionally independent of LinkedIn's
 * internal RSC/SDUI response structure.
 */
export const profileSchema = z
  .object({
    url: z.string().url(),

    name: z.string().nullable(),

    headline: z.string().nullable(),

    location: z.string().nullable(),

    about: z.string().nullable(),

    image: z.string().url().nullable(),

    backgroundImage: z.string().url().nullable(),

    experience: z.array(experienceSchema),

    education: z.array(educationSchema),

    skills: z.array(z.string()),

    certifications: z.array(z.string()),

    languages: z.array(z.string()),
  })
  .strict();

export type Profile = z.infer<
  typeof profileSchema
>;

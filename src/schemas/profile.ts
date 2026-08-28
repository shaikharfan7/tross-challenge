import { z } from 'zod';

const linkedinProfileUrl = z
  .string()
  .trim()
  .url()
  .superRefine((value, ctx) => {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    const segments = url.pathname.split('/').filter(Boolean);

    if (!['linkedin.com', 'www.linkedin.com'].includes(host) || segments.length !== 2 || segments[0] !== 'in') {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'URL must be a LinkedIn profile URL such as https://www.linkedin.com/in/example/' });
    }
  });

export const profileRequestSchema = z.object({
  url: linkedinProfileUrl,
});

export type ProfileRequest = z.infer<typeof profileRequestSchema>;

export function normalizeProfileUrl(value: string): string {
  const url = new URL(value);
  const slug = url.pathname.split('/').filter(Boolean)[1];
  return `https://www.linkedin.com/in/${slug}/`;
}

export const experienceSchema = z.object({
  title: z.string().nullable(),
  company: z.string().nullable(),
  location: z.string().nullable(),
  description: z.string().nullable(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  image: z.string().url().nullable(),
});

export const educationSchema = z.object({
  school: z.string().nullable(),
  degree: z.string().nullable(),
  fieldOfStudy: z.string().nullable(),
  description: z.string().nullable(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  image: z.string().url().nullable(),
});

export const profileSchema = z.object({
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
});

export type Profile = z.infer<typeof profileSchema>;

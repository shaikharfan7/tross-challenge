# LinkedIn Profile API

> **Project specification / source of truth**
>
> This document describes the requirements, scope, technical decisions, and constraints for this project. When making implementation decisions, use this document as the primary reference.

## About

This project is an engineering challenge to build a hosted API that accepts a LinkedIn profile URL and returns profile information as structured JSON.

The LinkedIn integration must be **reverse engineered** and communicate directly with LinkedIn endpoints.

### Important

The challenge explicitly requires:

* Direct HTTP requests to LinkedIn endpoints
* Reverse engineering of the relevant LinkedIn requests
* No browser automation
* A publicly accessible HTTPS API
* The ability to use our own LinkedIn credentials/session information on the backend

Do **not** use:

* Playwright
* Puppeteer
* Selenium
* Headless browsers
* Browser automation of any kind

The goal is to understand and reproduce the relevant HTTP requests directly from the backend.

---

# Challenge Requirements

## 1. Hosted API

The API must be publicly accessible over HTTPS.

## 2. Input

The API accepts a LinkedIn profile URL.

Example:

```json
{
  "url": "https://www.linkedin.com/in/example/"
}
```

The API should validate that the URL is a LinkedIn profile URL before processing it.

## 3. Profile information

The API should return as much of the following information as is available:

* Name
* Headline
* Location
* About
* Experience
* Education
* Skills
* Certifications
* Languages
* Profile images

These are the **initial required fields**.

Additional useful profile information can be added after the required fields are working reliably.

Not every field is guaranteed to be retrievable through direct HTTP requests alone.
See "Verified LinkedIn Findings" and "Known Limitations" below for fields that
were investigated and found to require a different retrieval mechanism than
the one implemented here.

## 4. Response format

The response schema is up to us.

The response should be:

* Structured
* Consistent
* Easy for another application to consume
* Independent of LinkedIn's internal response format

Example:

```json
{
  "profile": {
    "url": "https://www.linkedin.com/in/example/",
    "name": "Example Person",
    "headline": "Software Engineer",
    "location": "Goa, India",
    "about": "...",
    "image": "https://...",
    "experience": [
      {
        "title": "Software Engineer",
        "company": "Example Company",
        "location": "...",
        "description": "...",
        "startDate": "...",
        "endDate": "..."
      }
    ],
    "education": [
      {
        "school": "Example University",
        "degree": "...",
        "fieldOfStudy": "...",
        "description": "...",
        "startDate": "...",
        "endDate": "..."
      }
    ],
    "skills": [],
    "certifications": [],
    "languages": []
  }
}
```

This is an example only. The actual schema should reflect the data we are able to retrieve.

---

# Reference

The challenge references PhantomBuster's LinkedIn Profile Scraper as an example of the type of output expected.

The reference tool accepts:

* LinkedIn profile(s)
* LinkedIn session cookie
* User agent

and returns a large set of normalized profile fields.

Some examples include:

* First name
* Last name
* Profile URL
* Profile ID
* Profile slug
* Profile URN
* Headline
* Location
* About/description
* Followers count
* Connections count
* Current company
* Current job title
* Current job description
* Current job location
* Current job dates
* Previous company
* Previous job title
* Previous job description
* Previous job location
* Previous job dates
* Education
* Skills
* Certifications
* Languages
* Company information
* Profile images

We should **not attempt to implement all of these initially**.

The priority is:

1. Required fields from the challenge
2. Verify that they work reliably
3. Add additional fields where useful

---

# Technical Stack

The initial stack is:

* **TypeScript**
* **Node.js**
* **Fastify**
* **Zod**
* Native `fetch`
* **Vitest**
* **OpenAPI / Swagger**
* **Docker**

### Why

The project is intentionally small. We don't need a database or additional infrastructure unless a real requirement appears.

Avoid adding dependencies or infrastructure without a reason.

---

# Architecture

Keep the API layer separate from the LinkedIn implementation.

Expected high-level flow:

```text
Client
  │
  │ POST /api/v1/profile
  ▼
Fastify API
  │
  │ Validate URL
  ▼
Profile Service
  │
  ▼
LinkedIn Client
  │
  │ Direct HTTP requests
  ▼
LinkedIn
  │
  ▼
Response Parser
  │
  ▼
Profile Normalizer
  │
  ▼
Structured JSON
```

The LinkedIn-specific code should be isolated so that changes to LinkedIn's internal APIs do not require rewriting the public API layer.

A reasonable initial structure is:

```text
src/
├── server.ts
├── app.ts
│
├── routes/
│   └── profile.ts
│
├── linkedin/
│   ├── client.ts
│   ├── auth.ts
│   ├── endpoints.ts
│   └── parser.ts
│
├── services/
│   └── profile-service.ts
│
├── schemas/
│   └── profile.ts
│
└── utils/
```

This structure can change if there is a good engineering reason.

---

# API

## `GET /health`

Basic health check.

Example:

```json
{
  "status": "ok"
}
```

## `POST /api/v1/profile`

Retrieve a LinkedIn profile.

Request:

```json
{
  "url": "https://www.linkedin.com/in/example/"
}
```

Response:

The exact response schema should be defined in `schemas/profile.ts` and documented through OpenAPI.

Swagger documentation should be available at:

```text
/docs
```

---

# Reverse Engineering Approach

This is the main part of the challenge.

The LinkedIn integration should be built by investigating the HTTP requests made by LinkedIn and reproducing the relevant requests directly from our backend.

The process should be:

1. Inspect LinkedIn network requests.
2. Identify requests related to profile data.
3. Understand the request URL, method, headers, cookies, parameters, and body.
4. Inspect the response structure.
5. Determine which requests contain the required profile fields.
6. Reproduce those requests using direct HTTP requests.
7. Parse the responses.
8. Normalize the data into our own response schema.
9. Add error handling for unexpected responses and missing fields.

Do not assume an endpoint exists until it has been verified.

Do not hard-code a response structure based purely on examples found online.

The implementation should be based on observed requests and responses.

---

# Authentication / Session

The challenge allows the use of our own LinkedIn credentials.

Authentication/session information must be provided through environment variables or deployment secrets.

**Never commit credentials, cookies, tokens, or session information to Git.**

Do not put real credentials in:

* Source code
* README
* `.env.example`
* Tests
* Logs
* Git history

`.env` must be included in `.gitignore`.

Verified local configuration:

```env
LINKEDIN_LI_AT=
LINKEDIN_USER_AGENT=
```

`LINKEDIN_LI_AT` is the value of the authorized account's `li_at` cookie.
The client sends it only as the `li_at` cookie when making the verified direct
profile-page, experience, and skills page requests. `LINKEDIN_USER_AGENT`
should match the authorized browser's user agent. The application loads these
values from `.env` locally; they must never be pasted into chat, committed,
or logged.

---

# Verified LinkedIn Findings

The following behavior was observed from an authorized LinkedIn profile view.
It is the only upstream behavior currently implemented.

* `GET https://www.linkedin.com/in/<profile-slug>/` returns the authenticated,
  server-rendered profile page.
* The initial page contains the top-card data required for name, headline,
  location, profile image, and background image.
* `GET https://www.linkedin.com/in/<profile-slug>/details/experience/` returns
  a server-rendered HTML page containing full experience entries
  (title, company, location, description, dates) as repeating cards keyed by
  a `componentkey="entity-collection-item-*"` attribute. This is implemented
  and working.
* `GET https://www.linkedin.com/in/<profile-slug>/details/skills/` returns a
  server-rendered HTML page containing only the page shell and the skills
  category filter tabs (e.g. "All", "Industry Knowledge",
  "Tools & Technologies"). **It does not contain the actual skill entries.**
  Verified by confirming a known skill on the target profile ("PostgreSQL")
  is entirely absent from the raw response text of both this endpoint and
  the main profile page endpoint above.
* The real skills list is loaded by a separate client-side request
  (`POST /flagship-web/rsc-action/actions/component`, captured in a HAR as
  the request triggered when scrolling to/interacting with the Skills
  section) that requires a `vieweeProfileId` and other session-bound/dynamic
  parameters. This request and its parameters have **not** been implemented
  and are intentionally out of scope for this project - see "Known
  Limitations" below.
* Education was investigated the same way and shows the same pattern: the
  visible education entries only appear after client-side interaction, via
  requests carrying dynamic cookie/auth parameters beyond the `li_at` cookie
  used for the direct page requests above. This has not been implemented for
  the same reason skills has not: it requires reproducing an internal,
  session-bound component-fetch action rather than a plain authenticated
  page GET.
* These lazy-loaded section responses (where they exist) are React Server
  Components / SDUI streams, not stable REST or GraphQL response objects.
  Any future parser for them must work from the observed component structure
  and must not assume undocumented JSON field paths.

Not yet observed: the actual About, Licenses & certifications, and Languages
component requests/responses. Whether these behave like Experience (present
in a direct page GET) or like Skills/Education (client-side-only) has not
been determined and should not be assumed either way until checked.

---

# Known Limitations

LinkedIn's internal endpoints are undocumented and can change without notice.

Confirmed limitations from implementation so far:

* **Skills** and **Education** are not retrievable through the direct,
  authenticated HTTP requests this project implements (a plain GET with the
  `li_at` cookie). Both sections were investigated - not merely assumed -
  and confirmed to load only via a separate internal client-side action
  request (`rsc-action/actions/component`) keyed to a `vieweeProfileId` and
  other dynamic/session-bound parameters that were not captured as a stable,
  reproducible contract. Implementing that request was judged out of scope:
  it would function as a general per-profile data-extraction client against
  an internal API LinkedIn does not expose for third-party use, which this
  project intentionally does not build. `skills` and `education` are
  returned as `[]` and documented here rather than silently omitted or
  faked.
* About, Certifications, and Languages have not yet been investigated and
  may or may not have the same limitation.

Other possible limitations include:

* Authentication/session requirements changing
* Endpoint changes
* Response format changes
* Rate limiting
* Profile visibility differences
* Missing fields
* Profile image availability
* Different responses for different accounts

The API should handle missing information gracefully rather than assuming every profile contains every field.

---

# Legal / Terms Considerations

This project is being developed specifically for an engineering challenge that explicitly requests a reverse-engineered solution which directly communicates with LinkedIn endpoints without browser automation.

The implementation uses undocumented LinkedIn endpoints.

LinkedIn's terms contain restrictions relating to automated access, scraping, copying profile data, and reverse engineering of its services. This project does not claim that using undocumented endpoints is authorized by LinkedIn.

The implementation is intended as a technical demonstration for the engineering challenge.

It should not attempt to bypass authentication, CAPTCHA, access controls, rate limits, or other security mechanisms.

The decision to leave Skills and Education unimplemented (see "Known
Limitations") reflects this constraint directly: reproducing their
underlying request would mean building a general-purpose client against an
internal, session-bound LinkedIn API not intended for third-party
consumption, which goes beyond reproducing a normal authenticated page
request.

Anyone using or extending this project is responsible for ensuring that their use complies with applicable laws, platform terms, and any required authorization.

---

# Development Principles

Keep the implementation simple.

Prefer:

* Small modules
* Clear interfaces
* Strong typing
* Explicit error handling
* Minimal dependencies
* Testable functions
* Useful logging
* Clear naming

Avoid:

* Over-engineering
* Unnecessary infrastructure
* Large abstractions without a use case
* Browser automation
* Hard-coded LinkedIn responses
* Committing secrets

When there is a choice between a clever implementation and a simple one that is easy to understand, prefer the simpler implementation.

---

# Current Priorities

Work through the project in this order:

### Phase 1 — API foundation

* [x] Initialize TypeScript/Fastify project
* [x] Add `/health`
* [x] Add `POST /api/v1/profile`
* [x] Add request validation
* [x] Define initial response schema
* [x] Add Swagger/OpenAPI at `/docs`
* [x] Add baseline API and parser tests

### Phase 2 — LinkedIn investigation

* [x] Investigate authorized LinkedIn network requests
* [x] Identify the direct profile-page request
* [x] Understand the initial profile page and Experience response formats
* [x] Investigate Skills - confirmed client-side-only, requires internal
      component-fetch action (out of scope, see Known Limitations)
* [x] Investigate Education - confirmed same pattern as Skills (out of
      scope, see Known Limitations)
* [ ] Identify and verify endpoints for About, Certifications, and Languages

### Phase 3 — LinkedIn client

* [x] Implement authenticated direct profile-page HTTP client
* [x] Implement authenticated direct experience-page HTTP client
* [x] Implement authenticated direct skills-page HTTP client (returns the
      page shell only; confirmed insufficient for actual skill data - kept
      for completeness / future investigation)
* [x] Add baseline session and upstream error handling
* [x] Keep LinkedIn-specific logic isolated
* [ ] Lazy-loaded section requests for Skills/Education intentionally NOT
      implemented - see Known Limitations

### Phase 4 — Parsing & normalization

* [x] Parse and normalize initial top-card fields
* [x] Parse Experience component/page responses
* [x] Skills parser implemented against the direct-fetch HTML; correctly
      returns `[]` for this data source since skill entries are not present
      server-side (verified, not a parser bug)
* [x] Handle currently unavailable profile fields as `null` or empty arrays
* [ ] Add additional useful fields (About, Certifications, Languages -
      pending investigation)

### Phase 5 — Testing

* [x] Parser test for profile-page top-card normalization
* [x] API tests for health, validation, and missing session configuration
* [x] Baseline error cases
* [ ] Add sanitized mock fixtures for captured section responses
      (Experience, Skills)

### Phase 6 — Deployment

* [x] Dockerize
* [ ] Deploy publicly
* [ ] Configure secrets
* [ ] Verify HTTPS endpoint
* [ ] Test deployed API

### Phase 7 — Documentation

* [ ] Finalize API documentation
* [ ] Document setup
* [ ] Document environment variables
* [x] Document reverse-engineering approach (see "Reverse Engineering
      Approach" and "Verified LinkedIn Findings")
* [x] Document limitations (see "Known Limitations")
* [ ] Add deployed API URL

---

# Important Instructions for AI / Codex

AI tools are explicitly allowed and encouraged for this challenge.

When working on this repository:

1. Treat `source.md` as the source of truth for the project requirements.
2. Do not introduce browser automation.
3. Do not add unnecessary infrastructure.
4. Do not invent LinkedIn endpoints or response fields.
5. Verify LinkedIn request/response behavior before implementing against it.
6. Keep credentials and session information out of source control.
7. Do not modify the project architecture significantly without a clear reason.
8. Prefer small, reviewable changes.
9. Explain significant implementation decisions.
10. Do not mark a requirement as complete until it has actually been implemented and tested.
11. Do not implement the internal `rsc-action/actions/component` request (or
    any equivalent lazy-loaded/session-bound component-fetch endpoint) for
    Skills, Education, or any other section. This has been investigated and
    deliberately scoped out - see "Known Limitations". Do not resume work
    toward it in a later session under a different framing (e.g. a
    differently-named helper, a "just checking if it works" test, or a
    request routed through another file).

If a requirement is unclear, prefer asking for clarification or documenting the assumption rather than silently making a large architectural decision.

---

# Project Status

**Status: In development — profile top-card and Experience complete;
Skills/Education confirmed blocked by design constraints (documented); About,
Certifications, and Languages pending investigation.**

The application currently accepts validated LinkedIn profile URLs, provides
OpenAPI documentation, loads a local authorized session from `.env`, fetches
the verified direct profile page and experience page, and returns: name,
headline, location, profile image, background image, and full experience
history.

Skills and Education are returned as empty arrays. This is a verified,
documented outcome rather than an oversight: both sections were investigated
directly against real HTTP responses and confirmed to require LinkedIn's
internal, session-bound component-fetch action rather than a plain
authenticated page request. Implementing that action was judged out of
scope for this project (see "Known Limitations" and "Legal / Terms
Considerations").

About, Certifications, and Languages have not yet been investigated and
should not be assumed to work or not work until checked the same way
Experience and Skills were.

## License

This repository was created as part of an engineering challenge and is provided for evaluation purposes.
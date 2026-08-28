export class AppError extends Error {
  constructor(
    public readonly statusCode: 502 | 503,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export class LinkedInSessionError extends AppError {
  constructor() {
    super(503, 'LINKEDIN_SESSION_NOT_CONFIGURED', 'LinkedIn session credentials are not configured.');
  }
}

export class UpstreamError extends AppError {
  constructor(message = 'LinkedIn returned an unexpected response.') {
    super(502, 'LINKEDIN_UPSTREAM_ERROR', message);
  }
}

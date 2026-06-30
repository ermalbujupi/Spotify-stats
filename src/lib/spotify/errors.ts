/** Typed errors for the Spotify data layer, so callers can branch precisely. */

/** Thrown on HTTP 401 — the access token is invalid/expired and needs a refresh. */
export class SpotifyAuthError extends Error {
  constructor(message = "Spotify access token is invalid or expired.") {
    super(message);
    this.name = "SpotifyAuthError";
  }
}

/** Thrown on HTTP 429 once we've exhausted polite retries. */
export class SpotifyRateLimitError extends Error {
  constructor(public readonly retryAfterSeconds: number) {
    super(`Spotify rate limit hit. Retry after ~${retryAfterSeconds}s.`);
    this.name = "SpotifyRateLimitError";
  }
}

/** Thrown on HTTP 403 — usually a missing OAuth scope or a not-allowed resource. */
export class SpotifyScopeError extends Error {
  constructor(message = "Missing permission for this Spotify resource.") {
    super(message);
    this.name = "SpotifyScopeError";
  }
}

/** Generic non-OK response. */
export class SpotifyApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "SpotifyApiError";
  }
}

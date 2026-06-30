import { createHash, randomBytes } from "node:crypto";

/**
 * PKCE (Proof Key for Code Exchange) helpers for the OAuth Authorization Code
 * flow. PKCE lets a public client authenticate without a client secret.
 */

/** base64url-encode a buffer (no padding), per RFC 7636. */
function base64url(input: Buffer): string {
  return input
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** A high-entropy random string used as the PKCE code verifier (43–128 chars). */
export function generateCodeVerifier(): string {
  return base64url(randomBytes(64));
}

/** S256 challenge derived from the verifier. */
export function generateCodeChallenge(verifier: string): string {
  return base64url(createHash("sha256").update(verifier).digest());
}

/** Random opaque value used to mitigate CSRF on the OAuth redirect. */
export function generateState(): string {
  return base64url(randomBytes(16));
}

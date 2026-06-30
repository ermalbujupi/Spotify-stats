import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

/**
 * Authenticated symmetric encryption (AES-256-GCM) for the session cookie.
 *
 * The session cookie holds Spotify tokens, so it must be opaque and tamper-proof
 * to the browser. We derive a 32-byte key from SESSION_SECRET and emit a compact
 * `iv.tag.ciphertext` base64url string.
 */

function getKey(): Buffer {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "SESSION_SECRET is missing or too short. Generate one with `openssl rand -base64 32` and set it in .env.local.",
    );
  }
  // sha256 normalizes any secret string to a fixed 32-byte key.
  return createHash("sha256").update(secret).digest();
}

function b64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(str: string): Buffer {
  return Buffer.from(str.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

export function encryptJSON(value: unknown): string {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const plaintext = Buffer.from(JSON.stringify(value), "utf8");
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${b64url(iv)}.${b64url(tag)}.${b64url(ciphertext)}`;
}

/** Decrypts and parses a value produced by {@link encryptJSON}. Returns null on any failure. */
export function decryptJSON<T>(token: string | undefined): T | null {
  if (!token) return null;
  try {
    const [ivPart, tagPart, dataPart] = token.split(".");
    if (!ivPart || !tagPart || !dataPart) return null;
    const key = getKey();
    const decipher = createDecipheriv("aes-256-gcm", key, fromB64url(ivPart));
    decipher.setAuthTag(fromB64url(tagPart));
    const plaintext = Buffer.concat([
      decipher.update(fromB64url(dataPart)),
      decipher.final(),
    ]);
    return JSON.parse(plaintext.toString("utf8")) as T;
  } catch {
    // Bad secret, tampered cookie, or format change → treat as no session.
    return null;
  }
}

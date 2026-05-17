const PKCE_CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";

function randomString(length: number): string {
  const bytes = new Uint8Array(length);
  globalThis.crypto.getRandomValues(bytes);

  return Array.from(bytes)
    .map((byte) => PKCE_CHARACTERS[byte % PKCE_CHARACTERS.length])
    .join("");
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export async function createCodeChallenge(codeVerifier: string): Promise<string> {
  const bytes = new TextEncoder().encode(codeVerifier);
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", buffer);
  return base64UrlEncode(new Uint8Array(digest));
}

export function createPkceVerifier(): string {
  return randomString(64);
}

export function createOpaqueValue(): string {
  return randomString(48);
}

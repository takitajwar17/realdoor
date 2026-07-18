const ENVELOPE_VERSION = 1;
const IV_LENGTH = 12;
const STRING_PREFIX = "rd1.";

type CryptoOptions = {
  secret: string;
  context: string;
};

function validateOptions({ secret, context }: CryptoOptions) {
  if (secret.length < 32) {
    throw new Error("Readiness encryption secret must be at least 32 characters");
  }

  if (!context.trim()) {
    throw new Error("Readiness encryption context is required");
  }
}

async function deriveKey(secret: string, usages: KeyUsage[]) {
  const material = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return crypto.subtle.importKey("raw", material, { name: "AES-GCM" }, false, usages);
}

function concatBytes(...parts: Uint8Array[]) {
  const result = new Uint8Array(parts.reduce((total, part) => total + part.byteLength, 0));
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.byteLength;
  }
  return result;
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  const chunkSize = 0x8000;

  for (let offset = 0; offset < bytes.byteLength; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }

  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
}

function base64UrlToBytes(value: string) {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export async function sealBytes(bytes: Uint8Array, options: CryptoOptions) {
  validateOptions(options);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await deriveKey(options.secret, ["encrypt"]);
  const cipherBuffer = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
      additionalData: new TextEncoder().encode(options.context),
      tagLength: 128,
    },
    key,
    new Uint8Array(bytes).buffer,
  );

  return concatBytes(Uint8Array.of(ENVELOPE_VERSION), iv, new Uint8Array(cipherBuffer));
}

export async function openEncryptedBytes(envelope: Uint8Array, options: CryptoOptions) {
  validateOptions(options);
  if (envelope.byteLength <= IV_LENGTH + 1 || envelope[0] !== ENVELOPE_VERSION) {
    throw new Error("Unsupported or malformed readiness encryption envelope");
  }

  const iv = envelope.slice(1, IV_LENGTH + 1);
  const ciphertext = envelope.slice(IV_LENGTH + 1);
  const key = await deriveKey(options.secret, ["decrypt"]);
  const plainBuffer = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv,
      additionalData: new TextEncoder().encode(options.context),
      tagLength: 128,
    },
    key,
    ciphertext,
  );

  return new Uint8Array(plainBuffer);
}

export async function sealJson(value: unknown, options: CryptoOptions) {
  const plaintext = new TextEncoder().encode(JSON.stringify(value));
  const envelope = await sealBytes(plaintext, options);
  return `${STRING_PREFIX}${bytesToBase64Url(envelope)}`;
}

export async function openEncryptedJson<T>(envelope: string, options: CryptoOptions): Promise<T> {
  if (!envelope.startsWith(STRING_PREFIX)) {
    throw new Error("Unsupported readiness encryption envelope");
  }

  const encrypted = base64UrlToBytes(envelope.slice(STRING_PREFIX.length));
  const plaintext = await openEncryptedBytes(encrypted, options);
  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(plaintext)) as T;
}

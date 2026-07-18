import { describe, expect, it } from "vitest";

import {
  openEncryptedBytes,
  openEncryptedJson,
  sealBytes,
  sealJson,
} from "./crypto";

const secret = "a-demo-secret-that-is-at-least-32-characters-long";

describe("session content encryption", () => {
  it("round-trips structured content and emits a versioned randomized envelope", async () => {
    const value = { name: "Synthetic Pay Stub.pdf", sourceQuote: "Gross pay $4,200" };
    const first = await sealJson(value, { secret, context: "rds_1:rdf_1" });
    const second = await sealJson(value, { secret, context: "rds_1:rdf_1" });

    expect(first.startsWith("rd1.")).toBe(true);
    expect(second).not.toBe(first);
    await expect(
      openEncryptedJson<typeof value>(first, { secret, context: "rds_1:rdf_1" }),
    ).resolves.toEqual(value);
  });

  it("binds encrypted content to its session and record context", async () => {
    const envelope = await sealJson({ value: "4200" }, { secret, context: "rds_1:rdf_1" });

    await expect(
      openEncryptedJson(envelope, { secret, context: "rds_2:rdf_1" }),
    ).rejects.toThrow();
  });

  it("refuses secrets that are too weak for persisted renter content", async () => {
    await expect(
      sealJson({ value: "4200" }, { secret: "short", context: "rds_1:rdf_1" }),
    ).rejects.toThrow("at least 32 characters");
  });

  it("round-trips document bytes without exposing plaintext in the envelope", async () => {
    const bytes = new TextEncoder().encode("synthetic document content");
    const encrypted = await sealBytes(bytes, { secret, context: "rds_1:rdd_1" });

    expect(new TextDecoder().decode(encrypted)).not.toContain("synthetic document content");
    await expect(
      openEncryptedBytes(encrypted, { secret, context: "rds_1:rdd_1" }),
    ).resolves.toEqual(bytes);
  });
});

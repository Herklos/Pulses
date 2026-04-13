import {
  generatePassphrase,
  deriveAuth,
  buildConvInviteUrl,
  parseConvInviteToken,
} from "@/lib/identity";

describe("generatePassphrase", () => {
  it("returns a string of 12 hyphen-separated words", () => {
    const phrase = generatePassphrase();
    const words = phrase.split("-");
    expect(words).toHaveLength(12);
    words.forEach((w) => expect(w.length).toBeGreaterThan(0));
  });

  it("returns a different passphrase on each call (probabilistic)", () => {
    const a = generatePassphrase();
    const b = generatePassphrase();
    expect(a).not.toBe(b);
  });
});

describe("deriveAuth", () => {
  it("returns an object with the expected shape", async () => {
    const creds = await deriveAuth("test passphrase words here now go far high best");
    expect(typeof creds.authToken).toBe("string");
    expect(typeof creds.userId).toBe("string");
    expect(typeof creds.encryptionSecret).toBe("string");
    expect(creds.passphrase).toBe("test passphrase words here now go far high best");
  });

  it("is deterministic: same passphrase → same credentials", async () => {
    const phrase = "able acid aged also area army away back ball band bank base";
    const a = await deriveAuth(phrase);
    const b = await deriveAuth(phrase);
    expect(a.authToken).toBe(b.authToken);
    expect(a.userId).toBe(b.userId);
    expect(a.encryptionSecret).toBe(b.encryptionSecret);
  });

  it("userId is the first 16 chars of authToken", async () => {
    const creds = await deriveAuth("able acid aged also area army away back ball band bank base");
    expect(creds.userId).toBe(creds.authToken.slice(0, 16));
  });

  it("strips leading/trailing whitespace from passphrase", async () => {
    const phrase = "able acid aged also area army away back ball band bank base";
    const a = await deriveAuth(phrase);
    const b = await deriveAuth(`  ${phrase}  `);
    expect(a.authToken).toBe(b.authToken);
  });

  it("different passphrases produce different credentials", async () => {
    const a = await deriveAuth("able acid aged also area army away back ball band bank base");
    const b = await deriveAuth("ball band bank base able acid aged also area army away back");
    expect(a.authToken).not.toBe(b.authToken);
    expect(a.userId).not.toBe(b.userId);
  });
});

describe("buildConvInviteUrl / parseConvInviteToken roundtrip", () => {
  const BASE_URL = "pulses://join";
  const CONV_ID = "550e8400-e29b-41d4-a716-446655440000";
  const CONV_KEY = "a".repeat(64);
  const CONV_NAME = "My Test Group";

  it("encodes and decodes invite data correctly", () => {
    const url = buildConvInviteUrl(BASE_URL, CONV_ID, CONV_KEY, CONV_NAME);
    // Extract the token from the URL
    const token = new URL(url).searchParams.get("t")!;
    const decoded = parseConvInviteToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded!.conversationId).toBe(CONV_ID);
    expect(decoded!.conversationKey).toBe(CONV_KEY);
    expect(decoded!.name).toBe(CONV_NAME);
  });

  it("handles names with special characters", () => {
    const name = "Alice & Bob's Chat (2024)";
    const url = buildConvInviteUrl(BASE_URL, CONV_ID, CONV_KEY, name);
    const token = new URL(url).searchParams.get("t")!;
    const decoded = parseConvInviteToken(token);
    expect(decoded!.name).toBe(name);
  });

  it("returns null for a malformed token", () => {
    expect(parseConvInviteToken("not-valid-base64!!!")).toBeNull();
  });

  it("returns null for an empty token", () => {
    expect(parseConvInviteToken("")).toBeNull();
  });

  it("returns null when required fields are missing", () => {
    // Encode a payload that's missing the 'k' field
    const partial = Buffer.from(JSON.stringify({ c: CONV_ID, n: "Name" })).toString("base64url");
    expect(parseConvInviteToken(partial)).toBeNull();
  });
});

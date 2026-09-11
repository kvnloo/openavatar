import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;

function scryptCost(): number {
  return process.env.OPENAVATAR_SCRYPT_N
    ? Number(process.env.OPENAVATAR_SCRYPT_N)
    : 16384;
}

export function hashPassphrase(passphrase: string): { salt: string; hash: string } {
  const salt = randomBytes(16);
  const hash = scryptSync(passphrase, salt, KEY_LENGTH, { N: scryptCost() });
  return { salt: salt.toString("hex"), hash: hash.toString("hex") };
}

export function verifyPassphrase(
  passphrase: string,
  saltHex: string,
  hashHex: string,
): boolean {
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(passphrase, salt, expected.length, { N: scryptCost() });
  return timingSafeEqual(actual, expected);
}

export function validatePassphrase(passphrase: string): string | null {
  if (passphrase.length < 8) {
    return "Passphrase must be at least 8 characters.";
  }
  if (passphrase.length > 200) {
    return "Passphrase is too long.";
  }
  return null;
}

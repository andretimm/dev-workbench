export interface PasswordOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
}

const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWER = "abcdefghijklmnopqrstuvwxyz";
const NUMS  = "0123456789";
const SYMS  = "!@#$%^&*()-_=+[]{}|;:,.<>?";
const AMBIGUOUS = /[0Ol1I]/g;

export const DEFAULT_OPTIONS: PasswordOptions = {
  length: 20,
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: true,
  excludeAmbiguous: false,
};

export function generatePassword(opts: PasswordOptions): string {
  let pool = "";
  if (opts.uppercase) pool += UPPER;
  if (opts.lowercase) pool += LOWER;
  if (opts.numbers)   pool += NUMS;
  if (opts.symbols)   pool += SYMS;
  if (pool === "")    pool = LOWER;
  if (opts.excludeAmbiguous) pool = pool.replace(AMBIGUOUS, "");

  const bytes = new Uint32Array(opts.length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (n) => pool[n % pool.length]).join("");
}

export function strengthLabel(password: string): "weak" | "fair" | "strong" | "very-strong" {
  const len = password.length;
  const variety = [/[A-Z]/, /[a-z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((r) => r.test(password)).length;
  const score = len >= 16 ? variety + 1 : len >= 12 ? variety : Math.max(0, variety - 1);
  if (score <= 1) return "weak";
  if (score === 2) return "fair";
  if (score === 3) return "strong";
  return "very-strong";
}

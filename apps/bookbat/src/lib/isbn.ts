function computeIsbn13CheckDigit(first12: string): string {
  let sum = 0;
  for (let i = 0; i < first12.length; i++) {
    sum += Number.parseInt(first12[i], 10) * (i % 2 === 0 ? 1 : 3);
  }
  return String((10 - (sum % 10)) % 10);
}

export function cleanIsbn(input: string): string {
  return input.replace(/[-\s]/g, "").toUpperCase();
}

export function isValidIsbn10(input: string): boolean {
  const cleaned = cleanIsbn(input);
  if (!/^\d{9}[\dX]$/.test(cleaned)) return false;

  let sum = 0;
  for (let i = 0; i < 10; i++) {
    const char = cleaned[i];
    const val = char === "X" ? 10 : Number.parseInt(char, 10);
    sum += val * (10 - i);
  }
  return sum % 11 === 0;
}

export function isValidIsbn13(input: string): boolean {
  const cleaned = cleanIsbn(input);
  if (!/^\d{13}$/.test(cleaned)) return false;
  return computeIsbn13CheckDigit(cleaned.slice(0, 12)) === cleaned[12];
}

export function isValidIsbn(input: string): boolean {
  const cleaned = cleanIsbn(input);
  if (cleaned.length === 10) return isValidIsbn10(cleaned);
  if (cleaned.length === 13) return isValidIsbn13(cleaned);
  return false;
}

export function toIsbn13(input: string): string | null {
  const cleaned = cleanIsbn(input);
  if (cleaned.length === 13) {
    return isValidIsbn13(cleaned) ? cleaned : null;
  }
  if (cleaned.length !== 10 || !isValidIsbn10(cleaned)) return null;

  const first12 = `978${cleaned.slice(0, 9)}`;
  return `${first12}${computeIsbn13CheckDigit(first12)}`;
}

const MAX_CENTS = 9_000_000_000_000n;

export function parseUsd(value: string): number {
  const input = value.trim();
  if (input.length > 20 || !/^-?\d+(?:\.\d{1,2})?$/.test(input)) {
    throw new Error(
      'Enter a dollar amount with up to two decimal places, without commas or a dollar sign.',
    );
  }
  const negative = input.startsWith('-');
  const [whole, fraction = ''] = input.replace(/^-/, '').split('.');
  // Parse decimal digits directly so money never passes through floating-point arithmetic.
  const cents = BigInt(whole!) * 100n + BigInt(fraction.padEnd(2, '0'));
  if (cents > MAX_CENTS)
    throw new Error(
      'The opening balance must be between -90,000,000,000.00 and 90,000,000,000.00.',
    );
  return Number(negative ? -cents : cents);
}

export function usdInput(cents: number): string {
  if (!Number.isSafeInteger(cents)) throw new Error('Invalid money amount.');
  const amount = BigInt(cents);
  const absolute = amount < 0n ? -amount : amount;
  return `${amount < 0n ? '-' : ''}${absolute / 100n}.${String(absolute % 100n).padStart(2, '0')}`;
}

export function formatUsd(cents: number): string {
  const [whole, fraction] = usdInput(cents).split('.');
  const digits = whole!.replace('-', '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${cents < 0 ? '-' : ''}$${digits}.${fraction}`;
}

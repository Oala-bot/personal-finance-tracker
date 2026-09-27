import type { Database } from '@/lib/supabase/database.types';
import { parseUsd } from '@/lib/finance/money';

export type Account = Database['public']['Tables']['accounts']['Row'];
export const accountTypes = {
  checking: 'Checking',
  savings: 'Savings',
  cash: 'Cash',
  credit: 'Credit card',
  other: 'Other',
};
export type AccountFields = {
  name: string;
  type: string;
  balance: string;
  date: string;
  archived: boolean;
};
export type AccountErrors = Partial<Record<keyof AccountFields, string>>;
export type AccountState = {
  error?: string;
  fields?: AccountFields;
  errors?: AccountErrors;
};

export function validateAccount(fields: AccountFields) {
  const errors: AccountErrors = {};
  const name = fields.name.trim();
  if (!name || name.length > 80)
    errors.name = 'Enter an account name of 1–80 characters.';
  if (!Object.hasOwn(accountTypes, fields.type))
    errors.type = 'Choose an account type.';
  let cents = 0;
  try {
    cents = parseUsd(fields.balance);
  } catch (error) {
    errors.balance = (error as Error).message;
  }
  const date = new Date(`${fields.date}T00:00:00.000Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(fields.date) ||
    fields.date.startsWith('0000') ||
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== fields.date
  ) {
    errors.date = 'Choose a valid opening date.';
  }
  return {
    errors,
    values: {
      name,
      type: fields.type,
      opening_balance_cents: cents,
      opening_date: fields.date,
      archived: fields.archived,
    },
  };
}

export function validAccountId(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    id,
  );
}

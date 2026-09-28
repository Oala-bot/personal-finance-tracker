import type { Database } from '@/lib/supabase/database.types';

export type Category = Database['public']['Tables']['categories']['Row'];
export type CategoryFields = { name: string; kind: string; archived: boolean };
export type CategoryState = {
  fields?: CategoryFields;
  errors?: Partial<Record<'name' | 'kind', string>>;
  error?: string;
};

export function validateCategory(fields: CategoryFields) {
  const errors: CategoryState['errors'] = {};
  const name = fields.name.trim();
  if (!name || [...name].length > 80)
    errors.name = 'Enter a category name of 1–80 characters.';
  if (fields.kind !== 'income' && fields.kind !== 'expense')
    errors.kind = 'Choose income or expense.';
  return { errors, values: { ...fields, name } };
}

export function validCategoryId(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    id,
  );
}

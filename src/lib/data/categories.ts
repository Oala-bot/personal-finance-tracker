import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/supabase/user';
import type { CategoryFields } from '@/lib/categories';

export async function listCategories() {
  const user = await requireUser();
  const supabase = await createClient();
  return supabase
    .from('categories')
    .select('*')
    .eq('user_id', user.id)
    .order('archived')
    .order('kind')
    .order('name')
    .order('id');
}

export async function saveCategory(id: string, values: CategoryFields) {
  const user = await requireUser();
  const supabase = await createClient();
  // Foreign keys preserve the category type of existing transactions and budgets.
  if (id)
    return supabase
      .from('categories')
      .update(values)
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id')
      .maybeSingle();
  return supabase
    .from('categories')
    .insert({ ...values, user_id: user.id })
    .select('id')
    .single();
}

export async function removeCategory(id: string) {
  const user = await requireUser();
  const supabase = await createClient();
  return supabase
    .from('categories')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id')
    .maybeSingle();
}

import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/supabase/user';
import {
  PAGE_SIZE,
  validateTransaction,
  type TransactionFields,
  type TransactionFilters,
  type TransactionState,
} from '@/lib/transactions';

export async function listTransactions(filters: TransactionFilters) {
  const user = await requireUser();
  const supabase = await createClient();
  let query = supabase
    .from('transactions')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id);
  if (filters.q)
    query = query.ilike(
      'description',
      `%${filters.q.replace(/[\\%_]/g, '\\$&')}%`,
    );
  if (filters.kind) query = query.eq('kind', filters.kind);
  if (filters.account)
    query = query.or(
      `account_id.eq.${filters.account},destination_account_id.eq.${filters.account}`,
    );
  if (filters.category) query = query.eq('category_id', filters.category);
  if (filters.from) query = query.gte('transaction_date', filters.from);
  if (filters.to) query = query.lte('transaction_date', filters.to);
  const amountSort = filters.sort === 'largest' || filters.sort === 'smallest';
  const ascending = filters.sort === 'oldest' || filters.sort === 'smallest';
  const result = await query
    .order(amountSort ? 'amount_cents' : 'transaction_date', { ascending })
    .order('id', { ascending })
    .range((filters.page - 1) * PAGE_SIZE, filters.page * PAGE_SIZE - 1);
  // Deleting the last item on a page can leave a valid URL beyond the final page.
  if (result.error?.code === 'PGRST103') {
    const first = await query.range(0, 0);
    return { ...first, data: first.error ? null : [] };
  }
  return result;
}

export async function getTransaction(id: string) {
  const user = await requireUser();
  const supabase = await createClient();
  return supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .eq('id', id)
    .maybeSingle();
}

export async function saveTransaction(
  id: string,
  fields: TransactionFields,
): Promise<TransactionState> {
  const user = await requireUser();
  const supabase = await createClient();
  const [accounts, categories, previous] = await Promise.all([
    supabase.from('accounts').select('*').eq('user_id', user.id),
    supabase.from('categories').select('*').eq('user_id', user.id),
    id ? getTransaction(id) : Promise.resolve({ data: null, error: null }),
  ]);
  if (accounts.error || categories.error || previous.error)
    return { error: 'Unable to load transaction details. Please try again.' };
  if (id && !previous.data)
    return {
      error: 'This transaction is unavailable. It may have been deleted.',
    };
  const { errors, values } = validateTransaction(
    fields,
    accounts.data ?? [],
    categories.data ?? [],
    previous.data,
  );
  if (Object.keys(errors).length)
    return { errors, error: 'Check the highlighted fields.' };
  const result = id
    ? await supabase
        .from('transactions')
        .update(values)
        .eq('user_id', user.id)
        .eq('id', id)
        .select('id')
        .maybeSingle()
    : await supabase
        .from('transactions')
        .insert({ ...values, user_id: user.id })
        .select('id')
        .single();
  if (result.error)
    return {
      error:
        'Unable to save. Check that the selected accounts and category still exist, then try again.',
    };
  if (!result.data)
    return {
      error: 'This transaction is unavailable. It may have been deleted.',
    };
  return {};
}

export async function removeTransaction(id: string): Promise<TransactionState> {
  const user = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('transactions')
    .delete()
    .eq('user_id', user.id)
    .eq('id', id)
    .select('id')
    .maybeSingle();
  if (error)
    return { error: 'Unable to delete the transaction. Please try again.' };
  return data
    ? {}
    : {
        error:
          'This transaction is unavailable. It may already have been deleted.',
      };
}

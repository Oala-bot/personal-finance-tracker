import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/supabase/user';
import type { Database } from '@/lib/supabase/database.types';

type AccountValues = Pick<
  Database['public']['Tables']['accounts']['Insert'],
  'name' | 'type' | 'opening_balance_cents' | 'opening_date' | 'archived'
>;

export async function listAccounts() {
  const user = await requireUser();
  const supabase = await createClient();
  return supabase
    .from('accounts')
    .select('*')
    .eq('user_id', user.id)
    .order('archived')
    .order('created_at', { ascending: false })
    .order('id');
}

export async function saveAccount(id: string, values: AccountValues) {
  const user = await requireUser();
  const supabase = await createClient();
  if (id) {
    const { data, error } = await supabase
      .from('transactions')
      .select('id')
      .eq('user_id', user.id)
      .or(`account_id.eq.${id},destination_account_id.eq.${id}`)
      .lt('transaction_date', values.opening_date)
      .limit(1);
    if (error) return { data: null, error };
    if (data.length)
      return {
        data: null,
        error: {
          code: 'OPENING_DATE',
          message:
            'The opening date cannot be later than existing transactions in this account.',
        },
      };
    return supabase
      .from('accounts')
      .update(values)
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id')
      .maybeSingle();
  }
  return supabase
    .from('accounts')
    .insert({ ...values, user_id: user.id, currency: 'USD' })
    .select('id')
    .single();
}

export async function removeAccount(id: string) {
  const user = await requireUser();
  const supabase = await createClient();
  // Foreign keys reject deletion if transactions or imports still reference this account.
  return supabase
    .from('accounts')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id')
    .maybeSingle();
}

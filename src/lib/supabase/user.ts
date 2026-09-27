import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from './server';

export const requireUser = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect('/auth/login');
  return data.user;
});

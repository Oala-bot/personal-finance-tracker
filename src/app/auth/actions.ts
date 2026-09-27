'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type AuthState = { error?: string; message?: string };
export type AuthMode =
  'login' | 'signup' | 'forgot-password' | 'reset-password';

function callbackUrl(reset = false) {
  // Never build email links from a caller-controlled Host header.
  const url = new URL(
    '/auth/callback',
    process.env.SITE_URL || 'http://localhost:3000',
  );
  if (reset) url.searchParams.set('next', '/auth/reset-password');
  return url.toString();
}

export async function authenticate(
  mode: AuthMode,
  _previous: AuthState,
  form: FormData,
): Promise<AuthState> {
  if (!['login', 'signup', 'forgot-password', 'reset-password'].includes(mode))
    return { error: 'Invalid request.' };
  const email = String(form.get('email') ?? '').trim();
  const password = String(form.get('password') ?? '');
  if (
    mode !== 'reset-password' &&
    (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
  ) {
    return { error: 'Enter a valid email address.' };
  }
  if (mode !== 'forgot-password' && (!password || password.length > 128))
    return { error: 'Enter a password of up to 128 characters.' };
  if ((mode === 'signup' || mode === 'reset-password') && password.length < 10)
    return { error: 'Use at least 10 characters for your password.' };
  if (
    (mode === 'signup' || mode === 'reset-password') &&
    !/[\p{P}\p{S}]/u.test(password)
  )
    return {
      error:
        'Include at least one symbol in your password, such as @, !, or #.',
    };
  if (
    (mode === 'signup' || mode === 'reset-password') &&
    password !== form.get('confirmPassword')
  )
    return { error: 'The passwords do not match.' };

  const supabase = await createClient({ writableCookies: true });
  try {
    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error)
        return {
          error:
            error.status === 429
              ? 'Too many attempts. Wait a moment and try again.'
              : 'Unable to sign in. Check your email, password, and email confirmation.',
        };
    } else if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: callbackUrl() },
      });
      if (error)
        return {
          error:
            'Unable to create an account right now. Try again later. Email delivery may be restricted during development.',
        };
      if (!data.session)
        return {
          message:
            'Check your inbox for a confirmation link. If you already have an account, sign in or reset your password. Open the link in this browser.',
        };
    } else if (mode === 'forgot-password') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: callbackUrl(true),
      });
      if (error && error.status !== 400 && error.status !== 422)
        return {
          error:
            'Unable to send a reset link right now. Wait a moment and try again.',
        };
      return {
        message:
          'If this address is eligible, you will receive a reset link. Open it in this browser. Delivery may be restricted during development.',
      };
    } else {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user)
        return {
          error:
            'Your reset session has expired. Request a new password reset link.',
        };
      const result = await supabase.auth.updateUser({ password });
      if (result.error)
        return {
          error:
            'Unable to update the password. Try a different password or request a new reset link.',
        };
      const signedOut = await supabase.auth.signOut({ scope: 'global' });
      if (signedOut.error)
        return {
          message:
            'Password updated. Sign out before signing in with your new password.',
        };
    }
  } catch {
    return { error: 'Unable to reach the sign-in service. Please try again.' };
  }
  revalidatePath('/', 'layout');
  redirect(
    mode === 'reset-password' ? '/auth/login?message=password-updated' : '/',
  );
}

export async function signOut(): Promise<AuthState> {
  const supabase = await createClient({ writableCookies: true });
  try {
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error) return { error: 'Sign-out failed. Please try again.' };
  } catch {
    return { error: 'Unable to sign out. Please try again.' };
  }
  revalidatePath('/', 'layout');
  redirect('/auth/login');
}

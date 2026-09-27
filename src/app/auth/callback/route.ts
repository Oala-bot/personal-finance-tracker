import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const origin = process.env.SITE_URL || 'http://localhost:3000';
  const code = request.nextUrl.searchParams.get('code');
  // Only these two destinations are allowed, even if the URL is tampered with.
  const target =
    request.nextUrl.searchParams.get('next') === '/auth/reset-password'
      ? '/auth/reset-password'
      : '/';
  const supabase = await createClient({ writableCookies: true });
  let success = false;
  if (code) {
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      success = !error;
    } catch {
      success = false;
    }
  }
  const response = NextResponse.redirect(
    new URL(
      success
        ? target
        : target === '/auth/reset-password'
          ? '/auth/forgot-password?error=invalid-link'
          : '/auth/login?error=confirmation-session',
      origin,
    ),
  );
  response.headers.set('Cache-Control', 'private, no-store');
  response.headers.set('Referrer-Policy', 'no-referrer');
  return response;
}

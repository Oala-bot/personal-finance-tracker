import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { AuthForm } from '@/components/auth-form';
import { createClient } from '@/lib/supabase/server';
import type { AuthMode } from '../actions';

const pages = {
  login: {
    title: 'Welcome back',
    description: 'Sign in to your personal finance workspace.',
  },
  signup: {
    title: 'Create your account',
    description: 'Keep your accounts, transactions, and budgets together.',
  },
  'forgot-password': {
    title: 'Forgot your password?',
    description: 'We will email you a link to choose a new password.',
  },
  'reset-password': {
    title: 'Choose a new password',
    description: 'Update the password for your account.',
  },
};
type Props = {
  params: Promise<{ mode: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
};
function isMode(mode: string): mode is AuthMode {
  return Object.hasOwn(pages, mode);
}

export async function generateMetadata({ params }: Props) {
  const { mode } = await params;
  return {
    title: `${isMode(mode) ? pages[mode].title : 'Not found'} | Personal Finance Tracker`,
  };
}

export default async function AuthPage({ params, searchParams }: Props) {
  const { mode } = await params;
  if (!isMode(mode)) notFound();
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (mode === 'reset-password' && !data.user)
    redirect('/auth/forgot-password?error=reset-session');
  if ((mode === 'login' || mode === 'signup') && data.user) redirect('/');
  const query = await searchParams;
  return (
    <main className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-sm-10 col-md-7 col-lg-5">
          <p className="fw-semibold text-center mb-4">
            Personal Finance Tracker
          </p>
          <div className="card">
            <div className="card-body p-4 p-sm-5">
              <h1 className="h3">{pages[mode].title}</h1>
              <p className="text-secondary mb-4">{pages[mode].description}</p>
              {query.error && (
                <p role="alert" className="alert alert-danger">
                  {query.error === 'confirmation-session'
                    ? 'We could not sign you in automatically from this link. Your email may already be verified. Try signing in with your email and password.'
                    : 'This reset link could not be used. Request a new link and open it in the browser where you requested it.'}
                </p>
              )}
              {query.message === 'password-updated' && (
                <p role="status" className="alert alert-success">
                  Password updated. Sign in with your new password.
                </p>
              )}
              <AuthForm mode={mode} />
              <nav
                aria-label="Account access"
                className="d-flex flex-column gap-3 mt-4"
              >
                {mode !== 'login' && (
                  <Link href="/auth/login">Back to sign in</Link>
                )}
                {mode === 'login' && (
                  <>
                    <Link href="/auth/forgot-password">
                      Forgot your password?
                    </Link>
                    <Link href="/auth/signup">Create an account</Link>
                  </>
                )}
              </nav>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

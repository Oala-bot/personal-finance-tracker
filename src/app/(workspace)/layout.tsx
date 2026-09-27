export const dynamic = 'force-dynamic';

import { requireUser } from '@/lib/supabase/user';
import { SignOut } from '@/components/auth-form';
import { Navigation } from '@/components/navigation';

export default async function WorkspaceLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser();
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <div className="workspace">
        <Navigation />
        <div className="workspace-main">
          <div className="workspace-topbar">
            <span className="small fw-semibold">
              Personal workspace{' '}
              <span className="text-secondary ms-2">/ USD</span>
            </span>
            <div className="d-flex align-items-center gap-3 flex-wrap">
              <span className="small text-break">{user.email}</span>
              <SignOut />
            </div>
          </div>
          <main id="main-content" tabIndex={-1} className="workspace-content">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}

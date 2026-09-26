import type { Metadata } from 'next';
import { Navigation } from '@/components/navigation';
import 'bootstrap/dist/css/bootstrap.min.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'Overview | Personal Finance Tracker',
  description: 'Track your accounts, income, expenses, and monthly budgets.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
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
              <span className="preview-label">
                Layout preview · No data connected
              </span>
            </div>
            <main id="main-content" tabIndex={-1} className="workspace-content">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import { Placeholder } from '@/components/placeholder';

export const metadata: Metadata = {
  title: 'Accounts | Personal Finance Tracker',
};

export default function Page() {
  return (
    <Placeholder
      title="Accounts"
      description="A clear view across your accounts."
      emptyTitle="Bring your balances together"
    >
      Account creation and management will be available after secure sign-in is
      set up.
    </Placeholder>
  );
}

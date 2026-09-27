import type { Metadata } from 'next';
import { Placeholder } from '@/components/placeholder';

export const metadata: Metadata = {
  title: 'Import CSV | Personal Finance Tracker',
};

export default function Page() {
  return (
    <Placeholder
      title="Import CSV"
      description="Bring your transaction history with you."
      emptyTitle="Your bank export starts here"
    >
      CSV upload, column mapping, and a review step will help you check
      transactions and possible duplicates before importing.
    </Placeholder>
  );
}

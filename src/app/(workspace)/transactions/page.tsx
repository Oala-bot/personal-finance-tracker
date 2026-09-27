import type { Metadata } from 'next';
import { Placeholder } from '@/components/placeholder';

export const metadata: Metadata = {
  title: 'Transactions | Personal Finance Tracker',
};

export default function Page() {
  return (
    <Placeholder
      title="Transactions"
      description="Everyday money, in one place."
      emptyTitle="A home for your money in and out"
    >
      Transaction entry, editing, and search will be available in a later
      milestone.
    </Placeholder>
  );
}

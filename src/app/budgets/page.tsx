import type { Metadata } from 'next';
import { Placeholder } from '@/components/placeholder';

export const metadata: Metadata = {
  title: 'Budgets | Personal Finance Tracker',
};

export default function Page() {
  return (
    <Placeholder
      title="Budgets"
      description="Plan your spending, one month at a time."
      emptyTitle="Make a plan for your month"
    >
      Monthly category budgets and progress indicators will be available in a
      later milestone.
    </Placeholder>
  );
}

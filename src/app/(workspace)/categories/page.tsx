import type { Metadata } from 'next';
import { Placeholder } from '@/components/placeholder';

export const metadata: Metadata = {
  title: 'Categories | Personal Finance Tracker',
};

export default function Page() {
  return (
    <Placeholder
      title="Categories"
      description="Give every transaction a place."
      emptyTitle="Organize spending your way"
    >
      Income and expense categories will help you understand the patterns in
      your money.
    </Placeholder>
  );
}

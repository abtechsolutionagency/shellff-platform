
import { Metadata } from 'next';
import { UnlockCodesContent } from './UnlockCodesContent';

export const metadata: Metadata = {
  title: 'Unlock Codes - Creator Dashboard | Shellff',
  description: 'Manage your physical album unlock codes and track redemptions',
};

export default function UnlockCodesPage() {
  return <UnlockCodesContent />;
}

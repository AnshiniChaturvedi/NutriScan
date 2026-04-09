'use client';

import { useRouter } from 'next/navigation';

import AuthPanel from '@/components/AuthPanel';
import AuthShell from '@/components/AuthShell';
import { useAuth } from '@/components/AuthProvider';

export default function SignupPage() {
  const router = useRouter();
  const { register } = useAuth();

  return (
    <AuthShell>
      <AuthPanel
        mode="signup"
        title="Create your account"
        subtitle="Save your nutrition searches, keep an audit trail of scans, and pick up your history on any device."
        primaryLabel="Create account"
        switchLabel="Sign in instead"
        switchHref="/login"
        onSubmit={async ({ name, email, password }) => {
          await register({ name: name || '', email, password });
          router.push('/account');
          router.refresh();
        }}
      />
    </AuthShell>
  );
}
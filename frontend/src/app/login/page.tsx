'use client';

import { useRouter, useSearchParams } from 'next/navigation';

import AuthPanel from '@/components/AuthPanel';
import AuthShell from '@/components/AuthShell';
import { useAuth } from '@/components/AuthProvider';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const nextPath = searchParams.get('next') || '/account';

  return (
    <AuthShell>
      <AuthPanel
        mode="login"
        title="Welcome back"
        subtitle="Sign in to continue where you left off and keep your scan history synced to your account."
        primaryLabel="Sign in"
        switchLabel="Create account"
        switchHref="/signup"
        onSubmit={async ({ email, password }) => {
          await login({ email, password });
          router.push(nextPath);
          router.refresh();
        }}
      />
    </AuthShell>
  );
}
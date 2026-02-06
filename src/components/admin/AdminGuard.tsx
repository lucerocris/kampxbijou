'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    const isAdmin = localStorage.getItem('isAdmin');
    if (!isAdmin) router.push('/admin');
  }, [router]);

  return <>{children}</>;
}

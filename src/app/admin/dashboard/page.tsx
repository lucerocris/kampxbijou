'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to registrations page since dashboard is disabled
    router.replace('/admin/registrations');
  }, [router]);

  return null;
}

'use client';

import AdminPageHeader from '@/components/AdminPageHeader';
import { Card, CardContent } from '@/components/ui/card';

export default function CheckIn() {
  return (
    <div className="space-y-4 md:space-y-6 pb-8">
      <AdminPageHeader
        title="Check-in"
        subtitle="QR-based check-in has been removed."
      />

      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          This app is now focused on registrations and admin payment
          verification.
        </CardContent>
      </Card>
    </div>
  );
}

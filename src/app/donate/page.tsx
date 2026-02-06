"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DonatePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">
            Donations Disabled
          </CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          This app is now focused on registrations + admin payment verification.
        </CardContent>
      </Card>
    </div>
  );
}

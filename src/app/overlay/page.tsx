'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Overlay() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Overlay Disabled</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          The overlay was tied to donations and has been removed.
        </CardContent>
      </Card>
    </div>
  );
}

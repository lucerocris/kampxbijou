import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  metric: string | number | ReactNode;
  metricDescription: string | ReactNode;
  Icon: ReactNode;
  className?: string;
}

const MetricCard = ({
  title,
  metric,
  metricDescription,
  Icon,
  className,
}: MetricCardProps) => {
  return (
    <Card className={cn('p-4', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{metric}</div>
        <div className="text-xs text-muted-foreground">{metricDescription}</div>
      </CardContent>
    </Card>
  );
};

export default MetricCard;

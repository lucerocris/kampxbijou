import type { ReactNode } from 'react';
import MetricCard from '@/components/admin/ui/MetricCard';

export type Metric = {
  title: string;
  metric: string | number | ReactNode;
  metricDescription: string | ReactNode;
  icon: ReactNode;
};

interface MetricGridProps {
  metrics: Metric[];
  className?: string;
}

const MetricGrid = ({ metrics, className }: MetricGridProps) => {
  const containerClass =
    className ?? 'grid w-full gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
  return (
    <div className={containerClass}>
      {metrics.map((m, idx) => (
        <MetricCard
          key={idx}
          title={m.title}
          metric={m.metric}
          metricDescription={m.metricDescription}
          Icon={m.icon}
        />
      ))}
    </div>
  );
};

export default MetricGrid;

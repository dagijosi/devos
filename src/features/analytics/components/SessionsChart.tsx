import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface SessionsChartProps {
  data: { day?: string; month?: string; minutes: number }[];
  period: 'weekly' | 'monthly' | 'yearly';
}

function formatLabel(item: any, period: string): string {
  if (period === 'yearly') {
    const d = new Date(item.month + '-01');
    return d.toLocaleString('default', { month: 'short' });
  }
  if (period === 'weekly') {
    const d = new Date(item.day + 'T00:00:00');
    return d.toLocaleString('default', { weekday: 'short' });
  }
  const d = new Date(item.day + 'T00:00:00');
  return String(d.getDate());
}

export function SessionsChart({ data, period }: SessionsChartProps) {
  const chartData = data.map(item => ({
    label: formatLabel(item, period),
    minutes: item.minutes,
  }));

  return (
    <div className="bg-theme-surface border border-theme-border/30 rounded-2xl p-5">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.15} />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--color-text)' }} opacity={0.5} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: 'var(--color-text)' }} opacity={0.5} axisLine={false} tickLine={false} unit="m" />
          <Tooltip
            contentStyle={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              fontSize: '12px',
            }}
            labelFormatter={(label) => `${label}`}
            formatter={(value: number) => [`${value} min`, 'Time']}
          />
          <Bar dataKey="minutes" fill="var(--color-icon)" radius={[6, 6, 0, 0]} opacity={0.8} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

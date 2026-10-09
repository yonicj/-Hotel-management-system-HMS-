import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsService } from '../../services/reports.service';
import { PageHeader } from '../../components/shared/PageHeader';
import { Input } from '../../components/ui/Input';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { today } from '@hms/shared-utils';

export default function OccupancyReport() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [from, setFrom] = useState(thirtyDaysAgo.toISOString().split('T')[0]);
  const [to, setTo] = useState(today());

  const { data = [], isLoading } = useQuery({
    queryKey: ['reports', 'occupancy', from, to],
    queryFn: () => reportsService.getOccupancy(from, to),
    enabled: !!from && !!to,
  });

  return (
    <div>
      <PageHeader title="Occupancy Report" />
      <div className="flex gap-4 mb-6">
        <Input id="from" type="date" label="From" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input id="to" type="date" label="To" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>

      {isLoading ? (
        <p className="text-gray-400">Loading...</p>
      ) : (
        <div className="card">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickFormatter={(d) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
              />
              <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
              <Tooltip formatter={(v: number) => [`${v}%`, 'Occupancy Rate']} />
              <Bar dataKey="occupancyRate" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

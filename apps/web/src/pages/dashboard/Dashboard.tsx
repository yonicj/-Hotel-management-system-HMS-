import { useQuery } from '@tanstack/react-query';
import { Bed, Users, TrendingUp, CalendarCheck } from 'lucide-react';
import { StatCard } from '../../components/ui/StatCard';
import { PageHeader } from '../../components/shared/PageHeader';
import { frontDeskService } from '../../services/front-desk.service';
import { reportsService } from '../../services/reports.service';
import { QUERY_KEYS } from '../../lib/constants';
import { today } from '@hms/shared-utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const todayDate = today();

  const { data: arrivals = [] } = useQuery({
    queryKey: [...QUERY_KEYS.ARRIVALS, todayDate],
    queryFn: () => frontDeskService.getArrivals(todayDate),
  });

  const { data: departures = [] } = useQuery({
    queryKey: [...QUERY_KEYS.DEPARTURES, todayDate],
    queryFn: () => frontDeskService.getDepartures(todayDate),
  });

  const { data: inHouse = [] } = useQuery({
    queryKey: QUERY_KEYS.IN_HOUSE,
    queryFn: frontDeskService.getInHouse,
  });

  const from = new Date();
  from.setDate(from.getDate() - 6);
  const { data: occupancyData } = useQuery({
    queryKey: QUERY_KEYS.REPORTS_OCCUPANCY,
    queryFn: () => reportsService.getOccupancy(from.toISOString().split('T')[0], todayDate),
  });

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Welcome back — here's today's overview" />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Arrivals Today"
          value={arrivals.length}
          icon={<CalendarCheck className="w-6 h-6" />}
          colorClass="bg-blue-50 text-blue-600"
        />
        <StatCard
          label="Departures Today"
          value={departures.length}
          icon={<TrendingUp className="w-6 h-6" />}
          colorClass="bg-orange-50 text-orange-600"
        />
        <StatCard
          label="In-House Guests"
          value={inHouse.length}
          icon={<Bed className="w-6 h-6" />}
          colorClass="bg-green-50 text-green-600"
        />
        <StatCard
          label="Occupancy Rate"
          value={`${occupancyData?.at(-1)?.occupancyRate ?? 0}%`}
          icon={<Users className="w-6 h-6" />}
          colorClass="bg-purple-50 text-purple-600"
        />
      </div>

      {/* Charts */}
      {occupancyData && occupancyData.length > 0 && (
        <div className="card">
          <h2 className="text-base font-semibold text-gray-900 mb-4">7-Day Occupancy</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={occupancyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(d) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} />
              <YAxis tick={{ fontSize: 12 }} unit="%" domain={[0, 100]} />
              <Tooltip formatter={(v: number) => [`${v}%`, 'Occupancy']} />
              <Bar dataKey="occupancyRate" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

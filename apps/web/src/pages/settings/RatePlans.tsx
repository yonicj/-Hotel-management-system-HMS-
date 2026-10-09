import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { PageHeader } from '../../components/shared/PageHeader';
import { formatCurrency, formatDisplayDate } from '@hms/shared-utils';

export default function RatePlans() {
  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['rate-plans'],
    queryFn: () => api.get('/rate-plans').then((r) => r.data.data),
  });

  return (
    <div>
      <PageHeader title="Rate Plans" subtitle={`${plans.length} rate plans`} />
      <Table
        keyField="id"
        loading={isLoading}
        data={plans}
        columns={[
          { header: 'Name', accessor: 'name' as any },
          { header: 'Rate / Night', render: (p: any) => formatCurrency(p.rate) },
          { header: 'Min Stay', accessor: 'minStay' as any },
          { header: 'Valid From', render: (p: any) => formatDisplayDate(p.startDate) },
          { header: 'Valid To', render: (p: any) => formatDisplayDate(p.endDate) },
          { header: 'Status', render: (p: any) => (
            <Badge label={p.isActive ? 'Active' : 'Inactive'} className={p.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'} />
          )},
        ]}
      />
    </div>
  );
}

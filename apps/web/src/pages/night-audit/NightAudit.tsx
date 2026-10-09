import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { PageHeader } from '../../components/shared/PageHeader';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { useNotificationStore } from '../../stores/notification.store';
import { QUERY_KEYS } from '../../lib/constants';
import { formatDisplayDate, formatCurrency } from '@hms/shared-utils';

export default function NightAudit() {
  const qc = useQueryClient();
  const { add } = useNotificationStore();

  const { data: status } = useQuery({
    queryKey: [...QUERY_KEYS.NIGHT_AUDIT, 'status'],
    queryFn: () => api.get('/night-audit/status').then((r) => r.data.data),
    refetchInterval: 5000,
  });

  const { data: history = [], isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.NIGHT_AUDIT, 'history'],
    queryFn: () => api.get('/night-audit/history').then((r) => r.data.data),
  });

  const runAudit = useMutation({
    mutationFn: () => api.post('/night-audit/run').then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.NIGHT_AUDIT });
      add({ type: 'success', title: 'Night audit completed' });
    },
    onError: (err: any) => add({ type: 'error', title: 'Audit failed', message: err.response?.data?.message }),
  });

  const alreadyDone = status?.status === 'COMPLETED';

  return (
    <div>
      <PageHeader
        title="Night Audit"
        subtitle="Post room charges, process no-shows, and close the business day"
        actions={
          <Button onClick={() => runAudit.mutate()} loading={runAudit.isPending} disabled={alreadyDone}>
            {alreadyDone ? 'Audit Completed' : 'Run Night Audit'}
          </Button>
        }
      />

      {status && (
        <div className="card mb-6 max-w-sm">
          <p className="text-sm text-gray-500 mb-1">Today's Audit Status</p>
          <p className={`text-lg font-bold capitalize ${status.status === 'COMPLETED' ? 'text-green-600' : 'text-yellow-600'}`}>
            {status.status?.toLowerCase()}
          </p>
          {status.completedAt && <p className="text-xs text-gray-400 mt-1">Completed at {new Date(status.completedAt).toLocaleTimeString()}</p>}
        </div>
      )}

      <h3 className="text-base font-semibold text-gray-900 mb-3">Audit History</h3>
      <Table
        keyField="id"
        loading={isLoading}
        data={history}
        emptyMessage="No audit history yet"
        columns={[
          { header: 'Date', render: (a: any) => formatDisplayDate(a.auditDate) },
          { header: 'Status', accessor: 'status' as any },
          { header: 'Rooms Occupied', accessor: 'totalRoomsOccupied' as any },
          { header: 'Revenue', render: (a: any) => formatCurrency(a.totalRevenue) },
          { header: 'Completed At', render: (a: any) => a.completedAt ? new Date(a.completedAt).toLocaleTimeString() : '—' },
        ]}
      />
    </div>
  );
}

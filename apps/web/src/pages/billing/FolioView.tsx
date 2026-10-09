import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { billingService } from '../../services/billing.service';
import { PageHeader } from '../../components/shared/PageHeader';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { useNotificationStore } from '../../stores/notification.store';
import { formatCurrency, formatDisplayDateTime } from '@hms/shared-utils';
import { QUERY_KEYS } from '../../lib/constants';

export default function FolioView() {
  const { folioId } = useParams<{ folioId: string }>();
  const qc = useQueryClient();
  const { add } = useNotificationStore();

  const { data: folio, isLoading } = useQuery({
    queryKey: QUERY_KEYS.FOLIO(folioId!),
    queryFn: () => billingService.getFolio(folioId!),
    enabled: !!folioId,
  });

  const closeFolio = useMutation({
    mutationFn: () => billingService.closeFolio(folioId!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.FOLIO(folioId!) });
      add({ type: 'success', title: 'Folio closed' });
    },
    onError: (err: any) => add({ type: 'error', title: 'Cannot close folio', message: err.response?.data?.message }),
  });

  if (isLoading) return <p className="p-6 text-gray-400">Loading folio...</p>;
  if (!folio) return <p className="p-6 text-red-500">Folio not found</p>;

  return (
    <div className="max-w-4xl">
      <PageHeader
        title={`Folio ${folio.folioNumber}`}
        subtitle={`Status: ${folio.status}`}
        actions={
          folio.status === 'OPEN' && (
            <Button variant="secondary" onClick={() => closeFolio.mutate()} loading={closeFolio.isPending}>
              Close Folio
            </Button>
          )
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card text-center">
          <p className="text-xs text-gray-500 mb-1">Total Charges</p>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(folio.totalCharges ?? 0)}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-500 mb-1">Payments</p>
          <p className="text-xl font-bold text-green-600">{formatCurrency(folio.totalPayments ?? 0)}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-500 mb-1">Balance</p>
          <p className={`text-xl font-bold ${(folio.balance ?? 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {formatCurrency(folio.balance ?? 0)}
          </p>
        </div>
      </div>

      {/* Charges */}
      <h3 className="text-base font-semibold text-gray-900 mb-3">Charges</h3>
      <Table
        keyField="id"
        data={folio.charges ?? []}
        emptyMessage="No charges"
        columns={[
          { header: 'Type', render: (c: any) => c.chargeType.replace('_', ' ') },
          { header: 'Description', accessor: 'description' as any },
          { header: 'Qty', accessor: 'quantity' as any },
          { header: 'Unit Price', render: (c: any) => formatCurrency(c.unitPrice) },
          { header: 'Amount', render: (c: any) => formatCurrency(c.amount) },
          { header: 'Posted', render: (c: any) => formatDisplayDateTime(c.postedAt) },
        ]}
      />

      {/* Payments */}
      <h3 className="text-base font-semibold text-gray-900 mt-6 mb-3">Payments</h3>
      <Table
        keyField="id"
        data={folio.payments ?? []}
        emptyMessage="No payments"
        columns={[
          { header: 'Method', render: (p: any) => p.method.replace('_', ' ') },
          { header: 'Amount', render: (p: any) => formatCurrency(p.amount) },
          { header: 'Reference', accessor: 'referenceNumber' as any },
          { header: 'Status', accessor: 'status' as any },
          { header: 'Date', render: (p: any) => formatDisplayDateTime(p.processedAt) },
        ]}
      />
    </div>
  );
}

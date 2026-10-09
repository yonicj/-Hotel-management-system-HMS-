import { useState } from 'react';
import { useHousekeepingTasks, useUpdateTaskStatus } from '../../hooks/useHousekeeping';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/shared/PageHeader';
import { Input } from '../../components/ui/Input';
import { today } from '@hms/shared-utils';
import { HousekeepingTaskStatus } from '@hms/shared-types';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  VERIFIED: 'bg-gray-100 text-gray-700',
};

const NEXT_STATUS: Record<string, HousekeepingTaskStatus> = {
  PENDING: HousekeepingTaskStatus.IN_PROGRESS,
  IN_PROGRESS: HousekeepingTaskStatus.COMPLETED,
  COMPLETED: HousekeepingTaskStatus.VERIFIED,
};

export default function HousekeepingBoard() {
  const [date, setDate] = useState(today());
  const { data: tasks = [], isLoading } = useHousekeepingTasks(date);
  const updateStatus = useUpdateTaskStatus();

  return (
    <div>
      <PageHeader
        title="Housekeeping"
        subtitle={`${tasks.length} tasks for today`}
        actions={<Input id="hkDate" type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Select date" />}
      />

      <Table
        keyField="id"
        loading={isLoading}
        data={tasks}
        emptyMessage="No housekeeping tasks for this date"
        columns={[
          { header: 'Room', render: (t: any) => t.room?.roomNumber },
          { header: 'Type', render: (t: any) => t.taskType.replace('_', ' ') },
          { header: 'Assigned To', render: (t: any) => t.assignedUser ? `${t.assignedUser.firstName} ${t.assignedUser.lastName}` : '—' },
          { header: 'Priority', render: (t: any) => <Badge label={t.priority} className={t.priority === 'URGENT' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'} /> },
          { header: 'Status', render: (t: any) => <Badge label={t.status.replace('_', ' ')} className={STATUS_COLORS[t.status] ?? ''} /> },
          { header: 'Action', render: (t: any) => {
            const next = NEXT_STATUS[t.status];
            return next ? (
              <Button
                size="sm"
                variant="secondary"
                loading={updateStatus.isPending}
                onClick={() => updateStatus.mutate({ id: t.id, status: next })}
              >
                Mark {next.replace('_', ' ')}
              </Button>
            ) : <span className="text-xs text-gray-400">—</span>;
          }},
        ]}
      />
    </div>
  );
}

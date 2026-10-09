import { useRooms, useUpdateRoomStatus } from '../../hooks/useRooms';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Select';
import { PageHeader } from '../../components/shared/PageHeader';
import { ROOM_STATUS_COLORS } from '../../lib/constants';
import { RoomStatus } from '@hms/shared-types';

const statusOptions = Object.values(RoomStatus).map((s) => ({ value: s, label: s.replace('_', ' ') }));

export default function RoomList() {
  const { data: rooms = [], isLoading } = useRooms();
  const updateStatus = useUpdateRoomStatus();

  return (
    <div>
      <PageHeader title="Rooms" subtitle={`${rooms.length} rooms`} />
      <Table
        keyField="id"
        loading={isLoading}
        data={rooms}
        columns={[
          { header: 'Room No.', accessor: 'roomNumber' as any },
          { header: 'Floor', accessor: 'floor' as any },
          { header: 'Type', render: (r: any) => r.roomType?.name },
          { header: 'Smoking', render: (r: any) => r.isSmoking ? 'Yes' : 'No' },
          { header: 'Status', render: (r: any) => (
            <Badge label={r.status.replace('_', ' ')} className={ROOM_STATUS_COLORS[r.status.toLowerCase()] ?? ''} />
          )},
          { header: 'Update Status', render: (r: any) => (
            <Select
              id={`status-${r.id}`}
              options={statusOptions}
              value={r.status}
              onChange={(e) => updateStatus.mutate({ id: r.id, status: e.target.value })}
              aria-label={`Update status for room ${r.roomNumber}`}
            />
          )},
        ]}
      />
    </div>
  );
}

import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Table } from '../../components/ui/Table';
import { PageHeader } from '../../components/shared/PageHeader';
import { formatCurrency } from '@hms/shared-utils';

export default function RoomTypes() {
  const { data: roomTypes = [], isLoading } = useQuery({
    queryKey: ['room-types'],
    queryFn: () => api.get('/room-types').then((r) => r.data.data),
  });

  return (
    <div>
      <PageHeader title="Room Types" subtitle={`${roomTypes.length} room types configured`} />
      <Table
        keyField="id"
        loading={isLoading}
        data={roomTypes}
        columns={[
          { header: 'Name', accessor: 'name' as any },
          { header: 'Base Rate', render: (rt: any) => formatCurrency(rt.baseRate) },
          { header: 'Max Occupancy', accessor: 'maxOccupancy' as any },
          { header: 'Amenities', render: (rt: any) => (rt.amenities as string[]).join(', ') || '—' },
        ]}
      />
    </div>
  );
}

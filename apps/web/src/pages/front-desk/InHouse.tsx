import { useQuery } from '@tanstack/react-query';
import { frontDeskService } from '../../services/front-desk.service';
import { Table } from '../../components/ui/Table';
import { PageHeader } from '../../components/shared/PageHeader';
import { Button } from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { QUERY_KEYS } from '../../lib/constants';
import { formatDisplayDate } from '@hms/shared-utils';

export default function InHouse() {
  const navigate = useNavigate();
  const { data: guests = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.IN_HOUSE,
    queryFn: frontDeskService.getInHouse,
  });

  return (
    <div>
      <PageHeader title="In-House Guests" subtitle={`${guests.length} guests currently in-house`} />
      <Table
        keyField="id"
        loading={isLoading}
        data={guests}
        emptyMessage="No guests currently in-house"
        columns={[
          { header: 'Confirmation', render: (r) => <span className="font-mono text-sm">{(r as any).confirmationNumber}</span> },
          { header: 'Guest', render: (r) => { const g = (r as any).reservationGuests?.[0]?.guest; return g ? `${g.firstName} ${g.lastName}` : '—'; } },
          { header: 'Room', render: (r) => (r as any).room?.roomNumber },
          { header: 'Checked In', render: (r) => (r as any).actualCheckIn ? formatDisplayDate((r as any).actualCheckIn) : '—' },
          { header: 'Check-out', render: (r) => formatDisplayDate((r as any).checkOutDate) },
          { header: 'Actions', render: (r) => (
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => navigate(`/billing/${(r as any).folios?.[0]?.id}`)}>Folio</Button>
              <Button size="sm" onClick={() => navigate(`/front-desk/check-out/${(r as any).id}`)}>Check Out</Button>
            </div>
          )},
        ]}
      />
    </div>
  );
}

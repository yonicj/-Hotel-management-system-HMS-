import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { frontDeskService } from '../../services/front-desk.service';
import { QUERY_KEYS } from '../../lib/constants';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/shared/PageHeader';
import { Input } from '../../components/ui/Input';
import { today, formatDisplayDate } from '@hms/shared-utils';

export default function Arrivals() {
  const [date, setDate] = useState(today());
  const navigate = useNavigate();

  const { data: arrivals = [], isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.ARRIVALS, date],
    queryFn: () => frontDeskService.getArrivals(date),
  });

  return (
    <div>
      <PageHeader
        title="Arrivals"
        subtitle={`${arrivals.length} arrivals for ${formatDisplayDate(date)}`}
        actions={<Input id="arrivalDate" type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Select date" />}
      />

      <Table
        keyField="id"
        loading={isLoading}
        data={arrivals}
        emptyMessage="No arrivals for this date"
        columns={[
          { header: 'Confirmation', render: (r) => <span className="font-mono text-sm">{(r as any).confirmationNumber}</span> },
          { header: 'Guest', render: (r) => { const g = (r as any).reservationGuests?.[0]?.guest; return g ? `${g.firstName} ${g.lastName}` : '—'; } },
          { header: 'Room Type', render: (r) => (r as any).roomType?.name },
          { header: 'Room', render: (r) => (r as any).room?.roomNumber ?? <span className="text-yellow-600 text-xs">Unassigned</span> },
          { header: 'Adults', accessor: 'adults' as any },
          { header: 'Actions', render: (r) => (
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => navigate(`/reservations/${(r as any).id}`)}>Details</Button>
              <Button size="sm" onClick={() => navigate(`/front-desk/check-in/${(r as any).id}`)}>Check In</Button>
            </div>
          )},
        ]}
      />
    </div>
  );
}

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

export default function Departures() {
  const [date, setDate] = useState(today());
  const navigate = useNavigate();

  const { data: departures = [], isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.DEPARTURES, date],
    queryFn: () => frontDeskService.getDepartures(date),
  });

  return (
    <div>
      <PageHeader
        title="Departures"
        subtitle={`${departures.length} departures for ${formatDisplayDate(date)}`}
        actions={<Input id="departureDate" type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Select date" />}
      />

      <Table
        keyField="id"
        loading={isLoading}
        data={departures}
        emptyMessage="No departures for this date"
        columns={[
          { header: 'Confirmation', render: (r) => <span className="font-mono text-sm">{(r as any).confirmationNumber}</span> },
          { header: 'Guest', render: (r) => { const g = (r as any).reservationGuests?.[0]?.guest; return g ? `${g.firstName} ${g.lastName}` : '—'; } },
          { header: 'Room', render: (r) => (r as any).room?.roomNumber },
          { header: 'Actions', render: (r) => (
            <Button size="sm" onClick={() => navigate(`/front-desk/check-out/${(r as any).id}`)}>Check Out</Button>
          )},
        ]}
      />
    </div>
  );
}

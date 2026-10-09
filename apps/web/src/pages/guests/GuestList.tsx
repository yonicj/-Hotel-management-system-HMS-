import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import { guestsService } from '../../services/guests.service';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { PageHeader } from '../../components/shared/PageHeader';
import { QUERY_KEYS } from '../../lib/constants';

export default function GuestList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.GUESTS, search],
    queryFn: () => guestsService.getAll({ search }),
  });

  const guests = data?.data ?? [];

  return (
    <div>
      <PageHeader
        title="Guests"
        subtitle={`${data?.pagination?.total ?? 0} total guests`}
        actions={
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                className="input pl-9 w-64"
                placeholder="Search guests..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search guests"
              />
            </div>
            <Button onClick={() => navigate('/guests/new')}>
              <Plus className="w-4 h-4" /> New Guest
            </Button>
          </div>
        }
      />

      <Table
        keyField="id"
        loading={isLoading}
        data={guests}
        columns={[
          { header: 'Name', render: (g: any) => `${g.firstName} ${g.lastName}` },
          { header: 'Email', accessor: 'email' as any },
          { header: 'Phone', accessor: 'phone' as any },
          { header: 'Nationality', accessor: 'nationality' as any },
          { header: 'VIP', render: (g: any) => <span className="capitalize">{g.vipLevel?.toLowerCase()}</span> },
          { header: 'Actions', render: (g: any) => (
            <Button size="sm" variant="secondary" onClick={() => navigate(`/guests/${g.id}`)}>View</Button>
          )},
        ]}
      />
    </div>
  );
}

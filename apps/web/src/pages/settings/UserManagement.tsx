import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { PageHeader } from '../../components/shared/PageHeader';
import { QUERY_KEYS } from '../../lib/constants';

export default function UserManagement() {
  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.USERS,
    queryFn: () => api.get('/users').then((r) => r.data),
  });

  const users = data?.data ?? [];

  return (
    <div>
      <PageHeader title="User Management" subtitle={`${data?.pagination?.total ?? 0} users`} />
      <Table
        keyField="id"
        loading={isLoading}
        data={users}
        columns={[
          { header: 'Name', render: (u: any) => `${u.firstName} ${u.lastName}` },
          { header: 'Email', accessor: 'email' as any },
          { header: 'Role', render: (u: any) => <span className="capitalize">{u.role?.name}</span> },
          { header: 'Status', render: (u: any) => (
            <Badge label={u.isActive ? 'Active' : 'Inactive'} className={u.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} />
          )},
          { header: 'Last Login', render: (u: any) => u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never' },
        ]}
      />
    </div>
  );
}

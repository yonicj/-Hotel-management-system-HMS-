import { PageHeader } from '../../components/shared/PageHeader';

export default function RolePermissions() {
  return (
    <div>
      <PageHeader title="Role Permissions" subtitle="Manage what each role can access" />
      <div className="card">
        <p className="text-sm text-gray-500">Role and permission management UI — configure RBAC rules per role.</p>
        {/* TODO: Implement role-permission matrix */}
      </div>
    </div>
  );
}

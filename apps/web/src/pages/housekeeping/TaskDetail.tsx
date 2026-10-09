import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { housekeepingService } from '../../services/housekeeping.service';
import { PageHeader } from '../../components/shared/PageHeader';
import { Button } from '../../components/ui/Button';
import { useUpdateTaskStatus } from '../../hooks/useHousekeeping';

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: tasks = [] } = useQuery({
    queryKey: ['hk-task', id],
    queryFn: () => housekeepingService.getTasks(),
  });
  const updateStatus = useUpdateTaskStatus();
  const task = tasks.find((t: any) => t.id === id);

  if (!task) return <p className="p-6 text-gray-400">Task not found</p>;

  return (
    <div className="max-w-xl">
      <PageHeader title="Task Detail" />
      <div className="card space-y-3">
        <p><span className="text-gray-500">Room:</span> {(task as any).room?.roomNumber}</p>
        <p><span className="text-gray-500">Type:</span> {(task as any).taskType}</p>
        <p><span className="text-gray-500">Status:</span> {(task as any).status}</p>
        <p><span className="text-gray-500">Priority:</span> {(task as any).priority}</p>
        <p><span className="text-gray-500">Assigned to:</span> {(task as any).assignedUser?.firstName} {(task as any).assignedUser?.lastName}</p>
      </div>
      <div className="flex gap-3 mt-4">
        {(task as any).status !== 'VERIFIED' && (
          <Button
            onClick={() => updateStatus.mutate({ id: (task as any).id, status: 'COMPLETED' }, { onSuccess: () => navigate('/housekeeping') })}
            loading={updateStatus.isPending}
          >
            Mark Completed
          </Button>
        )}
        <Button variant="secondary" onClick={() => navigate(-1)}>Back</Button>
      </div>
    </div>
  );
}

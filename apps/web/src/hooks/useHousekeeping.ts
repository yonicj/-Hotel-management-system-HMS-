import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { housekeepingService } from '../services/housekeeping.service';
import { QUERY_KEYS } from '../lib/constants';
import { useNotificationStore } from '../stores/notification.store';

export function useHousekeepingTasks(date?: string) {
  return useQuery({
    queryKey: [...QUERY_KEYS.HOUSEKEEPING_TASKS, date],
    queryFn: () => housekeepingService.getTasks(date),
  });
}

export function useHousekeepingBoard() {
  return useQuery({
    queryKey: QUERY_KEYS.HOUSEKEEPING_BOARD,
    queryFn: housekeepingService.getBoard,
  });
}

export function useUpdateTaskStatus() {
  const qc = useQueryClient();
  const { add } = useNotificationStore();
  return useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: string; notes?: string }) =>
      housekeepingService.updateTaskStatus(id, status, notes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.HOUSEKEEPING_TASKS });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.HOUSEKEEPING_BOARD });
      add({ type: 'success', title: 'Task status updated' });
    },
  });
}

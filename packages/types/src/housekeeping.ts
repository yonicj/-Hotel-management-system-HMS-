export type HousekeepingStatus = 'DIRTY' | 'IN_PROGRESS' | 'CLEAN' | 'INSPECTED';

export interface HousekeepingTask {
  id: string;
  roomId: string;
  assignedStaffId?: string;
  status: HousekeepingStatus;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  notes?: string;
  inspectedBy?: string;
  updatedAt: string;
}

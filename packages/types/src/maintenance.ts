export interface MaintenanceWorkOrder {
  id: string;
  roomId?: string;
  facilityLocation?: string;
  description: string;
  reportedBy: string;
  assignedTo?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
}

import { useQuery } from '@tanstack/react-query';
import { frontDeskService } from '../../services/front-desk.service';
import { PageHeader } from '../../components/shared/PageHeader';
import { QUERY_KEYS, ROOM_STATUS_COLORS } from '../../lib/constants';
import { useRoomStore } from '../../stores/room.store';
import clsx from 'clsx';

export default function RoomRack() {
  const { data: rooms = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.ROOM_RACK,
    queryFn: frontDeskService.getRoomRack,
  });

  const roomStatuses = useRoomStore((s) => s.roomStatuses);

  if (isLoading) return <p className="p-6 text-gray-400">Loading room rack...</p>;

  // Group by floor
  const floors = [...new Set(rooms.map((r: any) => r.floor))].sort((a, b) => b - a);

  return (
    <div>
      <PageHeader title="Room Rack" subtitle="Real-time room status overview" />

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-6">
        {Object.entries(ROOM_STATUS_COLORS).map(([status, cls]) => (
          <span key={status} className={clsx('badge capitalize', cls)}>
            {status.replace('_', ' ')}
          </span>
        ))}
      </div>

      {floors.map((floor) => (
        <div key={floor} className="mb-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Floor {floor}</h3>
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
            {rooms
              .filter((r: any) => r.floor === floor)
              .map((room: any) => {
                // Real-time override from Socket.IO
                const liveStatus = roomStatuses[room.id]?.status ?? room.status.toLowerCase();
                const colorClass = ROOM_STATUS_COLORS[liveStatus] ?? 'bg-gray-100 text-gray-600';
                const activeReservation = room.reservations?.[0];
                const guest = activeReservation?.reservationGuests?.[0]?.guest;

                return (
                  <div
                    key={room.id}
                    title={guest ? `${guest.firstName} ${guest.lastName}` : liveStatus}
                    className={clsx(
                      'rounded-lg p-2 text-center text-xs font-semibold cursor-default transition-colors',
                      colorClass
                    )}
                    role="img"
                    aria-label={`Room ${room.roomNumber} — ${liveStatus}`}
                  >
                    <p className="text-base font-bold">{room.roomNumber}</p>
                    <p className="text-[10px] capitalize truncate">{liveStatus.replace('_', ' ')}</p>
                    {guest && <p className="text-[10px] truncate">{guest.firstName}</p>}
                  </div>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}

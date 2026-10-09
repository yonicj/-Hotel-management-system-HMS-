import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '../../components/shared/PageHeader';
import { GuestSearch } from '../../components/shared/GuestSearch';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { useCreateReservation } from '../../hooks/useReservations';
import { roomsService } from '../../services/rooms.service';
import type { Guest, RoomType } from '@hms/shared-types';
import { QUERY_KEYS } from '../../lib/constants';

const schema = z.object({
  roomTypeId: z.string().uuid('Select a room type'),
  checkInDate: z.string().min(1, 'Required'),
  checkOutDate: z.string().min(1, 'Required'),
  adults: z.coerce.number().int().min(1),
  children: z.coerce.number().int().min(0),
  specialRequests: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function ReservationForm() {
  const navigate = useNavigate();
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const create = useCreateReservation();

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { adults: 1, children: 0 },
  });

  const { data: roomTypes = [] } = useQuery<RoomType[]>({
    queryKey: QUERY_KEYS.ROOM_TYPES,
    queryFn: () => import('../../services/rooms.service').then(() =>
      fetch('/api/room-types').then((r) => r.json()).then((d) => d.data)
    ),
  });

  const onSubmit = (values: FormValues) => {
    if (!selectedGuest) return;
    create.mutate(
      { ...values, guestId: selectedGuest.id },
      { onSuccess: () => navigate('/reservations') }
    );
  };

  return (
    <div className="max-w-2xl">
      <PageHeader title="New Reservation" />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Guest Selection */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Guest</h3>
          <GuestSearch onSelect={setSelectedGuest} />
          {selectedGuest && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm">
              <p className="font-medium text-blue-900">{selectedGuest.firstName} {selectedGuest.lastName}</p>
              <p className="text-blue-700">{selectedGuest.email}</p>
            </div>
          )}
          {!selectedGuest && <p className="mt-2 text-xs text-red-500">Please select a guest</p>}
        </div>

        {/* Stay Details */}
        <div className="card space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">Stay Details</h3>
          <Select
            id="roomTypeId"
            label="Room Type"
            options={roomTypes.map((rt) => ({ value: rt.id, label: `${rt.name} — $${rt.baseRate}/night` }))}
            placeholder="Select room type"
            error={errors.roomTypeId?.message}
            {...register('roomTypeId')}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input id="checkInDate" type="date" label="Check-in Date" error={errors.checkInDate?.message} {...register('checkInDate')} />
            <Input id="checkOutDate" type="date" label="Check-out Date" error={errors.checkOutDate?.message} {...register('checkOutDate')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input id="adults" type="number" label="Adults" min={1} error={errors.adults?.message} {...register('adults')} />
            <Input id="children" type="number" label="Children" min={0} error={errors.children?.message} {...register('children')} />
          </div>
          <Input id="specialRequests" label="Special Requests" placeholder="Any special needs?" {...register('specialRequests')} />
        </div>

        <div className="flex gap-3">
          <Button type="submit" loading={create.isPending} disabled={!selectedGuest}>Create Reservation</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/reservations')}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}

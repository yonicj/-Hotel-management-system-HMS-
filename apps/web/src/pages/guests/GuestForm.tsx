import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { guestsService } from '../../services/guests.service';
import { PageHeader } from '../../components/shared/PageHeader';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useNotificationStore } from '../../stores/notification.store';
import { QUERY_KEYS } from '../../lib/constants';

const schema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(7, 'Invalid phone'),
  nationality: z.string().optional(),
  address: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function GuestForm() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { add } = useNotificationStore();
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const create = useMutation({
    mutationFn: (data: FormValues) => guestsService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.GUESTS });
      add({ type: 'success', title: 'Guest created' });
      navigate('/guests');
    },
  });

  return (
    <div className="max-w-xl">
      <PageHeader title="New Guest" />
      <form onSubmit={handleSubmit((d) => create.mutate(d))} className="card space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input id="firstName" label="First Name" error={errors.firstName?.message} {...register('firstName')} />
          <Input id="lastName" label="Last Name" error={errors.lastName?.message} {...register('lastName')} />
        </div>
        <Input id="email" type="email" label="Email" error={errors.email?.message} {...register('email')} />
        <Input id="phone" label="Phone" error={errors.phone?.message} {...register('phone')} />
        <Input id="nationality" label="Nationality" {...register('nationality')} />
        <Input id="address" label="Address" {...register('address')} />
        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={create.isPending}>Save Guest</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/guests')}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}

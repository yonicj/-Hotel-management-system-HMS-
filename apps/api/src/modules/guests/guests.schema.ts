import { z } from 'zod';
import { GuestIdType, VipLevel } from '@hms/shared-types';

export const createGuestSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(7),
  nationality: z.string().optional(),
  idType: z.nativeEnum(GuestIdType).optional(),
  idNumber: z.string().optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  vipLevel: z.nativeEnum(VipLevel).optional(),
  notes: z.string().optional(),
});

export const updateGuestSchema = createGuestSchema.partial();
export type CreateGuestInput = z.infer<typeof createGuestSchema>;
export type UpdateGuestInput = z.infer<typeof updateGuestSchema>;

import { z } from 'zod';

export const CreateGuestSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  phone: z.string().min(9),
  email: z.string().email().optional(),
  idType: z.enum(['PASSPORT', 'NATIONAL_ID', 'KEBELE_ID', 'DRIVING_LICENSE']),
  idNumber: z.string().min(4),
  nationality: z.string().default('Ethiopian'),
  isVip: z.boolean().default(false),
});

export type CreateGuestInput = z.infer<typeof CreateGuestSchema>;

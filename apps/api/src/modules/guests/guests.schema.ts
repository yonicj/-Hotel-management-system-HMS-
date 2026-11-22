import { z } from 'zod';

export const createGuestSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional().nullable().or(z.literal('')),
  phone: z.string().min(7),
  nationality: z.string().optional().nullable(),
  idType: z
    .enum(['PASSPORT', 'NATIONAL_ID', 'DRIVING_LICENSE', 'passport', 'national_id', 'driving_license'])
    .optional()
    .nullable()
    .transform((val) => (val ? (val.toUpperCase() as any) : undefined)),
  idNumber: z.string().optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  vipLevel: z
    .enum(['STANDARD', 'SILVER', 'GOLD', 'PLATINUM', 'standard', 'silver', 'gold', 'platinum'])
    .optional()
    .nullable()
    .transform((val) => (val ? (val.toUpperCase() as any) : undefined)),
  notes: z.string().optional().nullable(),
});

export const updateGuestSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  phone: z.string().min(7).optional(),
  nationality: z.string().optional().nullable(),
  idType: z
    .enum(['PASSPORT', 'NATIONAL_ID', 'DRIVING_LICENSE', 'passport', 'national_id', 'driving_license'])
    .optional()
    .nullable()
    .transform((val) => (val ? (val.toUpperCase() as any) : undefined)),
  idNumber: z.string().optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  vipLevel: z
    .enum(['STANDARD', 'SILVER', 'GOLD', 'PLATINUM', 'standard', 'silver', 'gold', 'platinum'])
    .optional()
    .nullable()
    .transform((val) => (val ? (val.toUpperCase() as any) : undefined)),
  notes: z.string().optional().nullable(),
});

export type CreateGuestInput = z.infer<typeof createGuestSchema>;
export type UpdateGuestInput = z.infer<typeof updateGuestSchema>;

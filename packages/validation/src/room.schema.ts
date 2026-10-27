import { z } from 'zod';

export const CreateRoomSchema = z.object({
  propertyId: z.string().uuid(),
  roomTypeId: z.string().uuid(),
  floorId: z.string().uuid(),
  number: z.string().min(1),
});

export type CreateRoomInput = z.infer<typeof CreateRoomSchema>;

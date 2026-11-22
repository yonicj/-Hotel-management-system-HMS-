export * from './client';
export * from './auth.api';
export * from './reservations.api';
export * from './rooms.api';
export * from './room-types.api';
export * from './floors.api';
export * from './rate-plans.api';
export * from './guests.api';
export * from './folios.api';
export * from './payments.api';

import { AxiosInstance } from 'axios';
import { createAuthApi } from './auth.api';
import { createReservationsApi } from './reservations.api';
import { createRoomsApi } from './rooms.api';
import { createRoomTypesApi } from './room-types.api';
import { createFloorsApi } from './floors.api';
import { createRatePlansApi } from './rate-plans.api';
import { createGuestsApi } from './guests.api';
import { createFoliosApi } from './folios.api';
import { createPaymentsApi } from './payments.api';

export function createEhmsApi(client: AxiosInstance) {
  return {
    auth: createAuthApi(client),
    reservations: createReservationsApi(client),
    rooms: createRoomsApi(client),
    roomTypes: createRoomTypesApi(client),
    floors: createFloorsApi(client),
    ratePlans: createRatePlansApi(client),
    guests: createGuestsApi(client),
    folios: createFoliosApi(client),
    payments: createPaymentsApi(client),
  };
}

export type EhmsApi = ReturnType<typeof createEhmsApi>;

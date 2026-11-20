export const ROLES = {
  SUPER_ADMIN: 'Super Admin',
  HOTEL_MANAGER: 'Hotel Manager',
  RECEPTIONIST: 'Receptionist',
  HOUSEKEEPER: 'Housekeeper',
  ACCOUNTANT: 'Accountant',
  GENERAL_STAFF: 'General Staff',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
export type RoleKey = keyof typeof ROLES;

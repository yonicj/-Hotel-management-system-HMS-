export interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  idType: 'PASSPORT' | 'NATIONAL_ID' | 'KEBELE_ID' | 'DRIVING_LICENSE';
  idNumber: string;
  nationality: string;
  isVip: boolean;
  corporateAccountId?: string;
}

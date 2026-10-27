export interface Property {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  address: string;
  city: string;
  country: string;
  timezone: string;
  currency: string;
  checkInTime: string;
  checkOutTime: string;
}

export interface Floor {
  id: string;
  propertyId: string;
  number: number;
  name: string;
}

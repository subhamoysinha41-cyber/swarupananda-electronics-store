export type UserRole = 'customer' | 'admin';
export type ServiceRequestType = 'repair' | 'trade-in';
export type ServiceRequestStatus = 'open' | 'reviewed' | 'closed';

export interface Product {
  id: string;
  brand: string;
  model: string;
  ram: string;
  storage: string;
  battery: string;
  priceInr: number;
  imageUrl: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PublicUser {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface ServiceRequest {
  id: string;
  userId: string;
  type: ServiceRequestType;
  device: string;
  imei: string;
  details: string;
  status: ServiceRequestStatus;
  estimateInr?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrder {
  id: string;
  userId: string;
  providerOrderId: string;
  amountInr: number;
  currency: 'INR';
  status: 'created' | 'paid' | 'failed';
  createdAt: string;
}

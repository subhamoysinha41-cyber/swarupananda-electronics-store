import type { Product, PublicUser, PurchaseOrder, ServiceRequest } from './entities';

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'BAD_REQUEST'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'SERVICE_UNAVAILABLE'
  | 'INTERNAL_ERROR';

export interface ErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
    details: Record<string, unknown> | null;
  };
}

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: Record<string, boolean>;
}

export interface ProductListResponse {
  products: Product[];
  count: number;
}

export interface ProductResponse {
  product: Product;
}

export interface AuthResponse {
  user: PublicUser;
  token: string;
}

export interface CurrentUserResponse {
  user: PublicUser;
}

export interface ServiceRequestResponse {
  serviceRequest: ServiceRequest;
}

export interface ServiceRequestListResponse {
  requests: ServiceRequest[];
}

export interface OrderResponse {
  order: PurchaseOrder;
}

export interface PaymentVerificationResponse {
  verified: boolean;
  order: PurchaseOrder;
}

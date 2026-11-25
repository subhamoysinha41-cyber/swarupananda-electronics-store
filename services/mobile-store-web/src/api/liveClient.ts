import axios from 'axios';
import type {
  ApiClient,
  CartItem,
  CreateAccountInput,
  Fulfillment,
  LoginInput,
  Product,
  ProductInput,
  ServiceLead,
  ServiceRequestInput,
  StoreOrder,
  StoreUser,
} from './types';

type AuthResponse = { user: StoreUser; token: string };
type ProductListResponse = { products: Product[]; count: number };
type ProductResponse = { product: Product };
type ServiceListResponse = { requests: ServiceLead[] };
type OrderResponse = { order: StoreOrder };
type ServiceRequestResponse = { serviceRequest: ServiceLead };
type UploadResponse = { imageUrl: string };
type PaymentResponse = { verified: boolean; order: StoreOrder };

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});
const cartStorageKey = 'mobile-store-cart';
const tokenStorageKey = 'mobile-store-token';

function setAuthToken(token: string): void {
  window.localStorage.setItem(tokenStorageKey, token);
  client.defaults.headers.common.Authorization = `Bearer ${token}`;
}

function storedCart(): CartItem[] {
  try {
    const stored: unknown = JSON.parse(window.localStorage.getItem(cartStorageKey) ?? '[]');
    return Array.isArray(stored) ? stored as CartItem[] : [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]): CartItem[] {
  window.localStorage.setItem(cartStorageKey, JSON.stringify(items));
  return items;
}

const existingToken = window.localStorage.getItem(tokenStorageKey);
if (existingToken) client.defaults.headers.common.Authorization = `Bearer ${existingToken}`;

export const liveClient: ApiClient = {
  async health() {
    const response = await client.get<{ status: string; services: string[] }>('/health');
    return response.data;
  },
  async listProducts(query = '') {
    const response = await client.get<ProductListResponse>('/products', { params: query ? { search: query } : undefined });
    return response.data.products;
  },
  async getProduct(id) {
    try {
      const response = await client.get<ProductResponse>(`/products/${encodeURIComponent(id)}`);
      return response.data.product;
    } catch (reason: unknown) {
      if (axios.isAxiosError(reason) && reason.response?.status === 404) return null;
      throw reason;
    }
  },
  async login(input: LoginInput) {
    const response = await client.post<AuthResponse>('/auth/login', input);
    setAuthToken(response.data.token);
    return response.data.user;
  },
  async createAccount(input: CreateAccountInput) {
    const response = await client.post<AuthResponse>('/auth/register', input);
    setAuthToken(response.data.token);
    return response.data.user;
  },
  async getCurrentUser() {
    const token = window.localStorage.getItem(tokenStorageKey);
    if (!token) return null;
    const response = await client.get<{ user: StoreUser }>('/auth/me');
    return response.data.user;
  },
  async logout() {
    window.localStorage.removeItem(tokenStorageKey);
    delete client.defaults.headers.common.Authorization;
  },
  async uploadProductImage(file: File) {
    const form = new FormData();
    form.append('image', file);
    const response = await client.post<UploadResponse>('/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.imageUrl;
  },
  async addProduct(input: ProductInput) {
    const { image, ...product } = input;
    const response = await client.post<ProductResponse>('/products', { product, image });
    return response.data.product;
  },
  async getCart() {
    return storedCart();
  },
  async addToCart(productId) {
    const productResponse = await client.get<ProductResponse>(`/products/${encodeURIComponent(productId)}`);
    const product = productResponse.data.product;
    const current = storedCart();
    const item = current.find((entry) => entry.product.id === productId);
    if (item) item.quantity += 1;
    else current.push({ product, quantity: 1 });
    return saveCart(current);
  },
  async updateCartQuantity(productId, quantity) {
    const current = storedCart().flatMap((item) => {
      if (item.product.id !== productId) return [item];
      return quantity > 0 ? [{ ...item, quantity }] : [];
    });
    return saveCart(current);
  },
  async removeFromCart(productId) {
    return saveCart(storedCart().filter((item) => item.product.id !== productId));
  },
  async createOrder(fulfillment: Fulfillment, amount) {
    const response = await client.post<OrderResponse>('/orders', { items: storedCart(), fulfillment, amount });
    return response.data.order;
  },
  async verifyPayment(orderId, paymentId, signature) {
    const response = await client.post<PaymentResponse>('/payments/verify', { orderId, paymentId, signature });
    return response.data;
  },
  async createServiceRequest(input: ServiceRequestInput) {
    const response = await client.post<ServiceRequestResponse>('/services/requests', input);
    return response.data.serviceRequest;
  },
  async listServiceLeads() {
    const response = await client.get<ServiceListResponse>('/admin/services');
    return response.data.requests;
  },
};

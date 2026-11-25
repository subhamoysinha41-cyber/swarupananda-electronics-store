export type Product = {
  id: string;
  brand: string;
  model: string;
  ram: string;
  storage: string;
  battery: string;
  price: number;
  image: string;
  badge?: string;
};

export type CartItem = {
  product: Product;
  quantity: number;
};

export type Fulfillment = 'delivery' | 'pickup';

export type StoreUser = {
  id: string;
  name: string;
  phone: string;
  email: string;
  isAdmin: boolean;
};

export type LoginInput = { phone: string; password: string };
export type CreateAccountInput = {
  name: string;
  phone: string;
  email: string;
  password: string;
};
export type ProductInput = Omit<Product, 'id' | 'image' | 'badge'> & { image?: string };
export type ServiceRequestInput = {
  type: 'repair' | 'trade-in';
  device: string;
  imei: string;
  details: string;
  name: string;
};
export type ServiceLead = {
  id: string;
  name: string;
  type: string;
  device: string;
  status: 'Open' | 'Reviewed';
};
export type StoreOrder = {
  id: string;
  amount: number;
  fulfillment: Fulfillment;
  status: 'created' | 'paid';
};
export type PaymentVerification = {
  verified: boolean;
  order: StoreOrder;
};

export interface ApiClient {
  health(): Promise<{ status: string; services: string[] }>;
  listProducts(query?: string): Promise<Product[]>;
  getProduct(id: string): Promise<Product | null>;
  login(input: LoginInput): Promise<StoreUser>;
  createAccount(input: CreateAccountInput): Promise<StoreUser>;
  getCurrentUser(): Promise<StoreUser | null>;
  logout(): Promise<void>;
  uploadProductImage(file: File): Promise<string>;
  addProduct(input: ProductInput): Promise<Product>;
  getCart(): Promise<CartItem[]>;
  addToCart(productId: string): Promise<CartItem[]>;
  updateCartQuantity(productId: string, quantity: number): Promise<CartItem[]>;
  removeFromCart(productId: string): Promise<CartItem[]>;
  createOrder(fulfillment: Fulfillment, amount: number): Promise<StoreOrder>;
  verifyPayment(orderId: string, paymentId: string, signature: string): Promise<PaymentVerification>;
  createServiceRequest(input: ServiceRequestInput): Promise<ServiceLead>;
  listServiceLeads(): Promise<ServiceLead[]>;
}

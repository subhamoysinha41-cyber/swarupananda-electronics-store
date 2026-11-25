import { applyPreviewState } from './previewState';
import { demoUser, initialLeads, products } from './data';
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

let catalog = [...products];
let cart: CartItem[] = [{ product: products[0], quantity: 1 }];
let leads = [...initialLeads];
let signedInUser: StoreUser | null = null;
const orders = new Map<string, StoreOrder>();
let sequence = 1;

const clone = <T>(value: T): T => structuredClone(value);
const emptyOrder: StoreOrder = { id: '', amount: 0, fulfillment: 'delivery', status: 'created' };

export const mockClient: ApiClient = {
  health: () => applyPreviewState({ status: 'ok', services: ['catalog', 'orders', 'repairs'] }, { status: 'empty', services: [] }),
  listProducts: (query = '') => {
    const matches = catalog.filter((product) =>
      `${product.brand} ${product.model}`.toLowerCase().includes(query.trim().toLowerCase()),
    );
    return applyPreviewState(clone(matches), []);
  },
  getProduct: (id) => applyPreviewState(clone(catalog.find((product) => product.id === id) ?? null), null),
  login: async (_input: LoginInput) => {
    const user = await applyPreviewState(clone(demoUser), clone(demoUser));
    signedInUser = user;
    window.localStorage.setItem('mobile-store-token', 'demo-session');
    return user;
  },
  createAccount: async (input: CreateAccountInput) => {
    if (input.phone === demoUser.phone && input.email.toLowerCase() === demoUser.email) {
      throw new Error('An account already exists for these details. Sign in instead.');
    }
    const user = await applyPreviewState(
      { ...clone(demoUser), name: input.name, phone: input.phone, email: input.email },
      { ...clone(demoUser), name: input.name, phone: input.phone, email: input.email },
    );
    signedInUser = user;
    window.localStorage.setItem('mobile-store-token', 'demo-session');
    return user;
  },
  getCurrentUser: () => applyPreviewState(clone(signedInUser), clone(signedInUser)),
  logout: async () => {
    await applyPreviewState(undefined, undefined);
    signedInUser = null;
    window.localStorage.removeItem('mobile-store-token');
  },
  uploadProductImage: (file) =>
    applyPreviewState(
      `https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=900&q=85&sig=${encodeURIComponent(file.name)}`,
      '',
    ),
  addProduct: async (input: ProductInput) => {
    const product: Product = {
      ...input,
      id: `draft-${sequence++}`,
      image: input.image || 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=900&q=85',
    };
    const result = await applyPreviewState(product, product);
    catalog = [result, ...catalog];
    return result;
  },
  getCart: () => applyPreviewState(clone(cart), []),
  addToCart: async (productId) => {
    const product = catalog.find((item) => item.id === productId);
    if (!product) throw new Error('This phone is no longer available.');
    const item = cart.find((entry) => entry.product.id === productId);
    if (item) item.quantity += 1;
    else cart = [...cart, { product, quantity: 1 }];
    return applyPreviewState(clone(cart), []);
  },
  updateCartQuantity: async (productId, quantity) => {
    cart = quantity < 1
      ? cart.filter((item) => item.product.id !== productId)
      : cart.map((item) => item.product.id === productId ? { ...item, quantity } : item);
    return applyPreviewState(clone(cart), []);
  },
  removeFromCart: async (productId) => {
    cart = cart.filter((item) => item.product.id !== productId);
    return applyPreviewState(clone(cart), []);
  },
  createOrder: async (fulfillment: Fulfillment, amount) => {
    const order = await applyPreviewState(
      { id: `order-${sequence++}`, amount, fulfillment, status: 'created' as const },
      emptyOrder,
    );
    if (order.id) orders.set(order.id, order);
    return order;
  },
  verifyPayment: async (orderId, _paymentId, _signature) => {
    const createdOrder = orders.get(orderId);
    const paidOrder: StoreOrder = createdOrder
      ? { ...createdOrder, status: 'paid' }
      : { id: orderId, amount: 0, fulfillment: 'delivery', status: 'paid' };
    const result = await applyPreviewState({ verified: true, order: paidOrder }, { verified: false, order: emptyOrder });
    if (result.verified) orders.set(orderId, paidOrder);
    return result;
  },
  createServiceRequest: async (input: ServiceRequestInput) => {
    const lead: ServiceLead = {
      id: `lead-${sequence++}`,
      name: input.name,
      type: input.type === 'repair' ? input.details : 'Trade-in',
      device: input.device,
      status: 'Open',
    };
    const result = await applyPreviewState(lead, lead);
    leads = [result, ...leads];
    return result;
  },
  listServiceLeads: () => applyPreviewState(clone(leads), []),
};

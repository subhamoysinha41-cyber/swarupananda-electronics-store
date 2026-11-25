import crypto from 'node:crypto';
import { describe, expect, it, jest } from '@jest/globals';
import { RazorpayPaymentService } from '../src/services/payment-service.js';

const KEY_SECRET = 'test-only-razorpay-secret';
const productId = '507f1f77bcf86cd799439011';

function createService() {
  const products = [{
    _id: productId,
    brand: 'Samsung',
    model: 'Galaxy S24',
    priceInr: 1000,
    isActive: true,
  }];
  const providerCreate = jest.fn(async () => ({ id: 'order_provider_123' }));
  const createdOrders = [];
  const Product = {
    find: jest.fn(() => ({ lean: async () => products })),
  };
  const Order = {
    create: jest.fn(async (order) => {
      const saved = { ...order, _id: '507f191e810c19729de860ea', createdAt: new Date() };
      createdOrders.push(saved);
      return saved;
    }),
    findOne: jest.fn(),
  };
  const service = new RazorpayPaymentService({
    config: { razorpay: { keyId: 'test-key-id', keySecret: KEY_SECRET } },
    Order,
    Product,
    clientFactory: () => ({ orders: { create: providerCreate } }),
  });
  return { service, Order, Product, providerCreate, createdOrders };
}

describe('RazorpayPaymentService', () => {
  it('recomputes checkout totals and returns the Razorpay order ID', async () => {
    const { service, providerCreate, createdOrders } = createService();

    const order = await service.createOrder('507f1f77bcf86cd799439012', {
      items: [{ productId, quantity: 1 }],
      fulfillment: 'delivery',
      amount: 1049,
    });

    expect(providerCreate).toHaveBeenCalledWith(expect.objectContaining({
      amount: 104900,
      currency: 'INR',
    }));
    expect(createdOrders[0].amountInr).toBe(1049);
    expect(order.id).toBe('order_provider_123');
    expect(order.amount).toBe(1049);
  });

  it('rejects client-supplied totals that do not match catalog prices', async () => {
    const { service, providerCreate, Order } = createService();

    await expect(service.createOrder('user-1', {
      items: [{ productId, quantity: 1 }],
      fulfillment: 'pickup',
      amount: 1,
    })).rejects.toMatchObject({ status: 422 });

    expect(providerCreate).not.toHaveBeenCalled();
    expect(Order.create).not.toHaveBeenCalled();
  });

  it('verifies HMAC signatures and prevents invalid payment confirmation', async () => {
    const { service, Order } = createService();
    const order = {
      _id: '507f191e810c19729de860ea',
      providerOrderId: 'order_provider_123',
      userId: 'user-1',
      amountInr: 1000,
      fulfillment: 'pickup',
      status: 'created',
      currency: 'INR',
      save: jest.fn(async () => {}),
    };
    Order.findOne.mockResolvedValue(order);

    const validSignature = crypto.createHmac('sha256', KEY_SECRET)
      .update('order_provider_123|payment_456')
      .digest('hex');
    const verified = await service.verifyPayment('user-1', {
      orderId: 'order_provider_123',
      paymentId: 'payment_456',
      signature: validSignature,
    });

    expect(verified.verified).toBe(true);
    expect(order.status).toBe('paid');
    expect(order.save).toHaveBeenCalled();
    await expect(service.verifyPayment('user-1', {
      orderId: 'order_provider_123',
      paymentId: 'payment_other',
      signature: 'invalid',
    })).rejects.toMatchObject({ status: 403 });
  });
});

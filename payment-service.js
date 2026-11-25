import crypto from 'node:crypto';
import Razorpay from 'razorpay';
import { AppError, ERROR_CODES } from '../errors/app-error.js';

const DELIVERY_FEE_INR = 49;

export class RazorpayPaymentService {
  constructor({ config, Order, Product, clientFactory }) {
    this.config = config.razorpay;
    this.Order = Order;
    this.Product = Product;
    this.clientFactory = clientFactory || (() => new Razorpay({
      key_id: this.config.keyId,
      key_secret: this.config.keySecret,
    }));
  }

  isConfigured() {
    return Boolean(this.config.keyId && this.config.keySecret);
  }

  async healthCheck() {
    return this.isConfigured();
  }

  async createOrder(userId, input) {
    if (!this.isConfigured()) {
      throw new AppError(503, ERROR_CODES.SERVICE_UNAVAILABLE, 'Payments are not configured');
    }
    const quantities = new Map();
    for (const item of input.items) {
      quantities.set(item.productId, (quantities.get(item.productId) || 0) + item.quantity);
    }
    const productIds = [...quantities.keys()];
    const products = await this.Product.find({ _id: { $in: productIds }, isActive: true }).lean();
    const byId = new Map(products.map((product) => [String(product._id), product]));
    if (products.length !== productIds.length) {
      throw new AppError(404, ERROR_CODES.NOT_FOUND, 'One or more products are unavailable');
    }

    const items = productIds.map((productId) => {
      const product = byId.get(productId);
      const quantity = quantities.get(productId);
      return {
        productId: product._id,
        brand: product.brand,
        model: product.model,
        quantity,
        unitPriceInr: product.priceInr,
      };
    });
    const fulfillment = typeof input.fulfillment === 'string'
      ? input.fulfillment
      : input.fulfillment.type;
    const subtotalInr = items.reduce((total, item) => total + item.quantity * item.unitPriceInr, 0);
    const amountInr = subtotalInr + (fulfillment === 'delivery' ? DELIVERY_FEE_INR : 0);
    if (amountInr !== input.amount) {
      throw new AppError(422, ERROR_CODES.VALIDATION_ERROR, 'Order amount does not match the product prices and fulfillment fee');
    }

    let providerOrder;
    try {
      providerOrder = await this.clientFactory().orders.create({
        amount: amountInr * 100,
        currency: 'INR',
        receipt: `store-${String(userId).slice(-16)}-${Date.now()}`,
      });
    } catch {
      throw new AppError(503, ERROR_CODES.SERVICE_UNAVAILABLE, 'Payment provider is unavailable');
    }
    const order = await this.Order.create({
      userId,
      providerOrderId: providerOrder.id,
      items,
      fulfillment,
      amountInr,
      currency: 'INR',
      status: 'created',
    });
    return publicOrder(order);
  }

  async verifyPayment(userId, input) {
    if (!this.isConfigured()) {
      throw new AppError(503, ERROR_CODES.SERVICE_UNAVAILABLE, 'Payments are not configured');
    }
    const order = await this.Order.findOne({
      providerOrderId: input.orderId,
      userId,
    });
    if (!order) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Order not found');

    const expected = crypto.createHmac('sha256', this.config.keySecret)
      .update(`${input.orderId}|${input.paymentId}`)
      .digest();
    const supplied = Buffer.from(input.signature, 'hex');
    if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) {
      throw new AppError(403, ERROR_CODES.FORBIDDEN, 'Payment signature is invalid');
    }
    if (order.status !== 'paid') {
      order.status = 'paid';
      order.paymentId = input.paymentId;
      await order.save();
    }
    return { verified: true, order: publicOrder(order) };
  }
}

function publicOrder(order) {
  const value = typeof order.toObject === 'function' ? order.toObject() : order;
  return {
    id: value.providerOrderId,
    providerOrderId: value.providerOrderId,
    amount: value.amountInr,
    amountInr: value.amountInr,
    fulfillment: value.fulfillment,
    status: value.status,
    currency: value.currency || 'INR',
    createdAt: value.createdAt,
  };
}

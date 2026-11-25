import mongoose from 'mongoose';

const { Schema } = mongoose;

const productSchema = new Schema({
  brand: { type: String, required: true, trim: true, maxlength: 80 },
  model: { type: String, required: true, trim: true, maxlength: 120 },
  ram: { type: String, required: true, trim: true, maxlength: 30 },
  storage: { type: String, required: true, trim: true, maxlength: 30 },
  battery: { type: String, required: true, trim: true, maxlength: 30 },
  priceInr: { type: Number, required: true, min: 1 },
  imageUrl: { type: String, default: '' },
  description: { type: String, default: '', maxlength: 2000 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true, versionKey: false });

const userSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  phone: { type: String, required: true, unique: true, trim: true, maxlength: 16 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['customer', 'admin'], default: 'customer', required: true },
}, { timestamps: true, versionKey: false });

const serviceRequestSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, maxlength: 100 },
  type: { type: String, enum: ['repair', 'trade-in'], required: true },
  device: { type: String, required: true, maxlength: 120 },
  imei: { type: String, required: true, match: /^\d{15}$/ },
  details: { type: String, required: true, maxlength: 2000 },
  status: { type: String, enum: ['open', 'reviewed', 'closed'], default: 'open' },
}, { timestamps: true, versionKey: false });

const orderItemSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  brand: { type: String, required: true },
  model: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1, max: 10 },
  unitPriceInr: { type: Number, required: true, min: 1 },
}, { _id: false });

const orderSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  providerOrderId: { type: String, required: true, unique: true },
  paymentId: { type: String, default: '' },
  items: { type: [orderItemSchema], required: true },
  fulfillment: { type: String, enum: ['delivery', 'pickup'], required: true },
  amountInr: { type: Number, required: true, min: 1 },
  currency: { type: String, enum: ['INR'], default: 'INR' },
  status: { type: String, enum: ['created', 'paid', 'failed'], default: 'created' },
}, { timestamps: true, versionKey: false });

export function createModels(connection = mongoose) {
  const model = (name, schema) => connection.models[name] || connection.model(name, schema);
  return {
    Product: model('Product', productSchema),
    User: model('User', userSchema),
    ServiceRequest: model('ServiceRequest', serviceRequestSchema),
    Order: model('Order', orderSchema),
  };
}

export const models = createModels();

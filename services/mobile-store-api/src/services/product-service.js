import { AppError, ERROR_CODES } from '../errors/app-error.js';

function publicProduct(product) {
  const value = typeof product.toObject === 'function' ? product.toObject() : product;
  const id = String(value._id ?? value.id);
  return {
    id,
    brand: value.brand,
    model: value.model,
    ram: value.ram,
    storage: value.storage,
    battery: value.battery,
    priceInr: value.priceInr,
    imageUrl: value.imageUrl || '',
    price: value.priceInr,
    image: value.imageUrl || '',
    description: value.description || '',
    isActive: value.isActive !== false,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

export class ProductService {
  constructor({ Product }) {
    this.Product = Product;
  }

  async listProducts(filters) {
    const query = { isActive: true };
    if (filters.brand) query.brand = new RegExp(`^${escapeRegex(filters.brand)}$`, 'i');
    if (filters.search) {
      const search = new RegExp(escapeRegex(filters.search), 'i');
      query.$or = [{ brand: search }, { model: search }, { description: search }];
    }
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      query.priceInr = {};
      if (filters.minPrice !== undefined) query.priceInr.$gte = filters.minPrice;
      if (filters.maxPrice !== undefined) query.priceInr.$lte = filters.maxPrice;
    }
    const [products, count] = await Promise.all([
      this.Product.find(query)
        .sort({ createdAt: -1 })
        .skip((filters.page - 1) * filters.limit)
        .limit(filters.limit)
        .lean(),
      this.Product.countDocuments(query),
    ]);
    return { products: products.map(publicProduct), count };
  }

  async getProduct(id) {
    const product = await this.Product.findOne({ _id: id, isActive: true }).lean();
    if (!product) throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Product not found');
    return publicProduct(product);
  }

  async createProduct(input) {
    const product = await this.Product.create(input);
    return publicProduct(product);
  }
}

export function toPublicProduct(product) {
  return publicProduct(product);
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

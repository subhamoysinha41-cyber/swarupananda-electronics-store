import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppError, ERROR_CODES } from '../errors/app-error.js';

const HASH_ROUNDS = 12;

export function toPublicUser(user) {
  return {
    id: String(user._id ?? user.id),
    name: user.name,
    phone: user.phone,
    email: user.email,
    role: user.role,
    isAdmin: user.role === 'admin',
    createdAt: user.createdAt,
  };
}

export class AuthService {
  constructor({ User, config, clock = () => Date.now() }) {
    this.User = User;
    this.config = config;
    this.clock = clock;
  }

  async register(input) {
    this.requireJwtSecret();
    const existing = await this.User.findOne({
      $or: [{ phone: input.phone }, { email: input.email.toLowerCase() }],
    }).lean();
    if (existing) {
      throw new AppError(409, ERROR_CODES.CONFLICT, 'An account already exists for these details');
    }

    let user;
    try {
      user = await this.User.create({
        name: input.name,
        phone: input.phone,
        email: input.email.toLowerCase(),
        passwordHash: await bcrypt.hash(input.password, HASH_ROUNDS),
        role: 'customer',
      });
    } catch (error) {
      if (error?.code === 11000) {
        throw new AppError(409, ERROR_CODES.CONFLICT, 'An account already exists for these details');
      }
      throw error;
    }
    return { user: toPublicUser(user), token: this.createToken(user) };
  }

  async login(input) {
    this.requireJwtSecret();
    const user = await this.User.findOne({ phone: input.phone }).select('+passwordHash');
    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
      throw new AppError(401, ERROR_CODES.UNAUTHORIZED, 'Invalid phone number or password');
    }
    return { user: toPublicUser(user), token: this.createToken(user) };
  }

  async healthCheck() {
    return this.isJwtSecretReady();
  }

  async authenticate(token) {
    this.requireJwtSecret();
    let claims;
    try {
      claims = jwt.verify(token, this.config.jwtSecret, {
        algorithms: ['HS256'],
        issuer: this.config.jwtIssuer,
        audience: this.config.jwtAudience,
        clockTimestamp: Math.floor(this.clock() / 1000),
      });
    } catch {
      throw new AppError(401, ERROR_CODES.UNAUTHORIZED, 'Invalid or expired authentication token');
    }
    if (!Number.isInteger(claims.exp) || claims.exp <= Math.floor(this.clock() / 1000) || !claims.sub) {
      throw new AppError(401, ERROR_CODES.UNAUTHORIZED, 'Invalid or expired authentication token');
    }
    const user = await this.User.findById(claims.sub).lean();
    if (!user) throw new AppError(401, ERROR_CODES.UNAUTHORIZED, 'Invalid or expired authentication token');
    return toPublicUser(user);
  }

  createToken(user) {
    return jwt.sign(
      { role: user.role },
      this.config.jwtSecret,
      {
        algorithm: 'HS256',
        subject: String(user._id ?? user.id),
        issuer: this.config.jwtIssuer,
        audience: this.config.jwtAudience,
        expiresIn: this.config.jwtExpiresIn,
      },
    );
  }

  requireJwtSecret() {
    if (!this.isJwtSecretReady()) {
      throw new AppError(503, ERROR_CODES.SERVICE_UNAVAILABLE, 'Authentication is not configured');
    }
  }

  isJwtSecretReady() {
    return Boolean(this.config.jwtSecret)
      && (
        this.config.environment === 'development'
        || Buffer.byteLength(this.config.jwtSecret, 'utf8') >= 32
      );
  }
}

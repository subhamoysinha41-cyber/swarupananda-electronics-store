import { v2 as cloudinary } from 'cloudinary';
import { AppError, ERROR_CODES } from '../errors/app-error.js';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export class CloudinaryMediaService {
  constructor({ config, client = cloudinary }) {
    this.config = config.cloudinary;
    this.client = client;
  }

  isConfigured() {
    return Boolean(this.config.cloudName && this.config.apiKey && this.config.apiSecret);
  }

  async healthCheck() {
    return this.isConfigured();
  }

  async upload(image, file = null) {
    if (!this.isConfigured()) {
      throw new AppError(503, ERROR_CODES.SERVICE_UNAVAILABLE, 'Image upload is not configured');
    }

    let uploadSource;
    if (file) {
      if (
        !ALLOWED_MIME_TYPES.has(file.mimetype)
        || file.size > MAX_IMAGE_BYTES
        || detectImageMime(file.buffer) !== file.mimetype
      ) {
        throw new AppError(422, ERROR_CODES.VALIDATION_ERROR, 'Upload a JPEG, PNG, or WebP image up to 10 MB');
      }
      uploadSource = await bufferToDataUri(file.buffer, file.mimetype);
    } else {
      const parsed = parseImageData(image);
      if (!parsed || parsed.buffer.length > MAX_IMAGE_BYTES) {
        throw new AppError(422, ERROR_CODES.VALIDATION_ERROR, 'Image must be a JPEG, PNG, or WebP data URL up to 10 MB');
      }
      uploadSource = image;
    }

    this.client.config({
      cloud_name: this.config.cloudName,
      api_key: this.config.apiKey,
      api_secret: this.config.apiSecret,
      secure: true,
    });
    let result;
    try {
      result = await this.client.uploader.upload(uploadSource, {
        folder: 'mobile-store/products',
        resource_type: 'image',
      });
    } catch {
      throw new AppError(503, ERROR_CODES.SERVICE_UNAVAILABLE, 'Image upload provider is unavailable');
    }
    return result.secure_url;
  }
}

function parseImageData(value) {
  if (typeof value !== 'string') return null;
  const match = value.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/);
  if (!match) return null;
  const buffer = Buffer.from(match[2], 'base64');
  if (detectImageMime(buffer) !== match[1]) return null;
  return { mimeType: match[1], buffer };
}

async function bufferToDataUri(buffer, mimeType) {
  if (!Buffer.isBuffer(buffer)) {
    throw new AppError(422, ERROR_CODES.VALIDATION_ERROR, 'Image file is invalid');
  }
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}

function detectImageMime(buffer) {
  if (!Buffer.isBuffer(buffer)) return '';
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    buffer.length >= 8
    && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return 'image/png';
  }
  if (
    buffer.length >= 12
    && buffer.toString('ascii', 0, 4) === 'RIFF'
    && buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }
  return '';
}

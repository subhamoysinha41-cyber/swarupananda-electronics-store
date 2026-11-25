import { AppError, ERROR_CODES } from '../errors/app-error.js';

export class ServiceRequestService {
  constructor({ ServiceRequest, User }) {
    this.ServiceRequest = ServiceRequest;
    this.User = User;
  }

  async createRequest(userId, input) {
    const user = await this.User.findById(userId).select('name').lean();
    if (!user) throw new AppError(401, ERROR_CODES.UNAUTHORIZED, 'Authentication required');
    const serviceRequest = await this.ServiceRequest.create({
      userId,
      name: user.name,
      type: input.type,
      device: input.device,
      imei: input.imei,
      details: input.details,
    });
    return publicRequest(serviceRequest);
  }

  async listRequests() {
    const requests = await this.ServiceRequest.find({})
      .sort({ createdAt: -1 })
      .lean();
    return requests.map(publicRequest);
  }
}

function publicRequest(request) {
  return {
    id: String(request._id ?? request.id),
    userId: String(request.userId),
    name: request.name,
    type: request.type,
    device: request.device,
    imei: request.imei,
    details: request.details,
    status: request.status,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
  };
}

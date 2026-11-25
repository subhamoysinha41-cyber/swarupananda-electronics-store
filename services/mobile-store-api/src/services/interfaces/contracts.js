/**
 * Application-facing service contracts (JSDoc, implemented by injected services).
 * Database operations use Mongoose models and must not expose provider details to routes.
 *
 * @typedef {object} ProductService
 * @property {(filters: object) => Promise<{products: object[], count: number}>} listProducts
 * @property {(id: string) => Promise<object|null>} getProduct
 * @property {(input: object) => Promise<object>} createProduct
 * @typedef {object} AuthService
 * @property {(input: object) => Promise<{user: object, token: string}>} register
 * @property {(input: object) => Promise<{user: object, token: string}>} login
 * @property {(token: string) => Promise<object>} authenticate
 * @typedef {object} MediaService
 * @property {(image: string) => Promise<string>} upload
 * @property {() => Promise<boolean>} healthCheck
 * @typedef {object} PaymentService
 * @property {(input: object) => Promise<object>} createOrder
 * @property {(input: object) => Promise<object>} verifyPayment
 * @typedef {object} ServiceRequestService
 * @property {(userId: string, input: object) => Promise<object>} createRequest
 * @property {() => Promise<object[]>} listRequests
 */

export {};

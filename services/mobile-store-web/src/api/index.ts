import type { ApiClient } from './types';
import { liveClient } from './liveClient';
import { mockClient } from './mockClient';

export const api: ApiClient = import.meta.env.VITE_API_BASE_URL ? liveClient : mockClient;
export type { ApiClient } from './types';

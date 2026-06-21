import { buildCanonicalString, getClientToken, hmacSha256Hex } from './core';

// ─── Types ────────────────────────────────────────────────────────────────────

// Socket must connect directly to the external host — Next.js rewrites don't
// tunnel WebSocket connections, so we bypass the /api-proxy path here.
// NEXT_PUBLIC_API_BASE_URL is the full API URL (e.g. https://api-dev.servixos.com/api).
const _apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://api-dev.servixos.com/api';
export const SOCKET_BASE_URL = _apiBase.replace(/\/api$/, '');

export interface SocketAuthPayload {
  businessId: string;
  clientToken: string;
  timestamp: string;
  signature: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function createSocketAuthHeaders(payload: SocketAuthPayload): Record<string, string> {
  return {
    'x-business-id': payload.businessId,
    'x-client-token': payload.clientToken,
    'x-timestamp': payload.timestamp,
    'x-signature': payload.signature,
    'x-channel': 'web',
    // access_token cookie is sent automatically via withCredentials: true
  };
}

export async function getSocketAuthPayload(businessId: string): Promise<SocketAuthPayload> {
  const { token: clientToken } = await getClientToken();
  const timestamp = Date.now().toString();
  const canonical = buildCanonicalString('GET', '/chat', timestamp, '');
  const signature = await hmacSha256Hex(canonical, clientToken);

  return {
    businessId,
    clientToken,
    timestamp,
    signature,
  };
}

export async function getSocketAuthHeaders(businessId: string): Promise<Record<string, string>> {
  const payload = await getSocketAuthPayload(businessId);
  return createSocketAuthHeaders(payload);
}

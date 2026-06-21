import { protectedGet, protectedRequest } from './core';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BusinessProfileSettings {
  name: string;
  categoryName: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  description: string | null;
}

export interface UpdateBusinessProfileInput {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  description?: string;
}

export interface NotificationPreferences {
  email: boolean;
  newClient: boolean;
  payment: boolean;
}

export interface UpdatePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const settings = {
  getProfile: async (businessId: string): Promise<BusinessProfileSettings> => {
    const envelope = await protectedGet<BusinessProfileSettings>('/settings/profile', businessId);
    return envelope.data;
  },

  updateProfile: (businessId: string, input: UpdateBusinessProfileInput): Promise<null> =>
    protectedRequest<null>('PATCH', '/settings/profile', businessId, input),

  getNotifications: async (businessId: string): Promise<NotificationPreferences> => {
    const envelope = await protectedGet<NotificationPreferences>(
      '/settings/notifications',
      businessId
    );
    return envelope.data;
  },

  updateNotifications: (
    businessId: string,
    input: Partial<NotificationPreferences>
  ): Promise<null> =>
    protectedRequest<null>('PATCH', '/settings/notifications', businessId, input),

  updatePassword: (businessId: string, input: UpdatePasswordInput): Promise<null> =>
    protectedRequest<null>('PATCH', '/settings/password', businessId, input),

  deleteAccount: (businessId: string): Promise<null> =>
    protectedRequest<null>('DELETE', '/settings/account', businessId),
};

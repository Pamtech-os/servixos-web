import { protectedGet, protectedRequest } from './core';

// ─── Types ────────────────────────────────────────────────────────────────────

export type Permission = string;

export interface Role {
  _id: string;
  businessId: string;
  name: string;
  permissions: Permission[];
  isSystem: boolean;
  isOwnerRole: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoleInput {
  name: string;
  permissions: Permission[];
}

export interface UpdateRoleInput {
  name?: string;
  permissions?: Permission[];
}

// ─── Permissions API ──────────────────────────────────────────────────────────

export const permissions = {
  list: async (businessId: string): Promise<Permission[]> => {
    const envelope = await protectedGet<Permission[]>('/permissions', businessId);
    return envelope.data;
  },
};

// ─── Roles API ────────────────────────────────────────────────────────────────

export const roles = {
  list: async (businessId: string): Promise<Role[]> => {
    const envelope = await protectedGet<Role[]>('/roles', businessId);
    return envelope.data;
  },

  get: async (businessId: string, id: string): Promise<Role> => {
    const envelope = await protectedGet<Role>(`/roles/${id}`, businessId);
    return envelope.data;
  },

  create: (businessId: string, input: CreateRoleInput): Promise<Role> =>
    protectedRequest<Role>('POST', '/roles', businessId, input),

  update: (businessId: string, id: string, input: UpdateRoleInput): Promise<Role> =>
    protectedRequest<Role>('PATCH', `/roles/${id}`, businessId, input),

  delete: (businessId: string, id: string): Promise<null> =>
    protectedRequest<null>('DELETE', `/roles/${id}`, businessId),
};

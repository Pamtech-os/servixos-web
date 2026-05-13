'use client';

export interface PermissionParts {
  module: string;
  action: string;
}

const MODULE_ALIASES: Record<string, string[]> = {
  schedule: ['schedules'],
  schedules: ['schedule'],
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export function splitPermission(permission: string): PermissionParts {
  const raw = normalize(permission);
  if (!raw) return { module: '', action: '' };

  const colonIdx = raw.indexOf(':');
  const dotIdx = raw.indexOf('.');
  const splitIdx =
    colonIdx === -1
      ? dotIdx
      : dotIdx === -1
        ? colonIdx
        : Math.min(colonIdx, dotIdx);

  if (splitIdx === -1) return { module: raw, action: '' };

  return {
    module: raw.slice(0, splitIdx).trim(),
    action: raw.slice(splitIdx + 1).trim(),
  };
}

function expandModules(moduleName: string): Set<string> {
  const moduleKey = normalize(moduleName);
  return new Set([moduleKey, ...(MODULE_ALIASES[moduleKey] ?? [])]);
}

export function permissionMatches(granted: string, required: string): boolean {
  const grantedParts = splitPermission(granted);
  const requiredParts = splitPermission(required);

  if (!grantedParts.module || !requiredParts.module) return false;

  const moduleMatch =
    expandModules(grantedParts.module).has(requiredParts.module) ||
    expandModules(requiredParts.module).has(grantedParts.module);

  if (!moduleMatch) return false;

  if (!requiredParts.action) return true;
  return grantedParts.action === '*' || grantedParts.action === requiredParts.action;
}

export function hasPermission(granted: string[], required: string): boolean {
  return granted.some((permission) => permissionMatches(permission, required));
}

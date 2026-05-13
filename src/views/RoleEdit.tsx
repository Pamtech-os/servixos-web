'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Check, Loader2, Search, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';
import { getApiErrorMessage } from '@/common/network/http-client';
import { splitPermission } from '@/common/auth/permissions';
import { useRole, usePermissions } from '@/hooks/queries/use-roles';
import { useCreateRole, useUpdateRole } from '@/hooks/mutations/use-roles';

// ─── Descriptions ─────────────────────────────────────────────────────────────

const permissionGroupDescriptions: Record<string, string> = {
  dashboard: 'Overview and business metrics',
  clients: 'Client records and profile management',
  invoices: 'Billing and invoice workflow',
  jobs: 'Service job scheduling and updates',
  contracts: 'Contract creation and maintenance',
  roles: 'Role assignment and access controls',
  payments: 'Payment processing and records',
  employees: 'Employee management and access',
  requests: 'Service request handling',
  tasks: 'Task creation and assignment',
  analytics: 'Business analytics and reports',
  settings: 'Business configuration options',
  schedule: 'Schedule management and calendar',
  schedules: 'Schedule management and calendar',
  time: 'Time tracking and clock management',
  files: 'File storage and document management',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const toTitleCase = (value: string) =>
  value.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const formatAction = (perm: string) => {
  const { action } = splitPermission(perm);
  return toTitleCase(action || perm);
};

const formatLabel = (perm: string) => {
  const { module: group, action } = splitPermission(perm);
  return `${toTitleCase(action)} ${toTitleCase(group)}`.trim();
};

// ─── Circular toggle ──────────────────────────────────────────────────────────

function CircleToggle({
  checked,
  indeterminate,
  onChange,
  size = 'md',
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  size?: 'sm' | 'md';
}) {
  const dim = size === 'sm' ? 'h-[18px] w-[18px]' : 'h-5 w-5';
  const iconSize = size === 'sm' ? 8 : 10;
  const dotSize = size === 'sm' ? 'h-1.5 w-1.5' : 'h-2 w-2';
  const active = checked || indeterminate;

  return (
    <button
      type='button'
      role='checkbox'
      aria-checked={indeterminate ? 'mixed' : checked}
      onClick={onChange}
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full border-2 transition-all',
        dim,
        active
          ? 'border-primary bg-primary'
          : 'border-muted-foreground/40 bg-transparent hover:border-primary/50',
      )}
    >
      {checked && (
        <Check size={iconSize} className='text-primary-foreground' strokeWidth={3} />
      )}
      {!checked && indeterminate && (
        <div className={cn('rounded-full bg-primary-foreground', dotSize)} />
      )}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const RoleEdit = () => {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id ?? '';
  const isNew = id === 'new';

  const { data: existingRole, isLoading: isLoadingRole } = useRole(id);
  const { data: apiPermissions = [], isLoading: isLoadingPermissions } = usePermissions();
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();

  const [roleName, setRoleName] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [nameError, setNameError] = useState('');
  const [permissionError, setPermissionError] = useState('');
  const [permissionQuery, setPermissionQuery] = useState('');

  useEffect(() => {
    if (existingRole) {
      setRoleName(existingRole.name);
      setSelectedPermissions([...existingRole.permissions]);
    }
  }, [existingRole]);

  // Group API permissions by module segment (supports both "module:action" and "module.action")
  const permissionGroups = useMemo(() => {
    const groups: Record<string, string[]> = {};
    apiPermissions.forEach((p) => {
      const { module: group } = splitPermission(p);
      if (group) {
        if (!groups[group]) groups[group] = [];
        groups[group].push(p);
      }
    });
    return groups;
  }, [apiPermissions]);

  const filteredGroups = useMemo<Array<[string, string[]]>>(() => {
    const q = permissionQuery.trim().toLowerCase();
    return Object.entries(permissionGroups)
      .map(([group, perms]) => {
        const filtered = perms.filter((perm) => {
          if (!q) return true;
          const { action = '' } = splitPermission(perm);
          return `${group} ${action} ${toTitleCase(group)} ${toTitleCase(action)}`
            .toLowerCase()
            .includes(q);
        });
        return [group, filtered] as [string, string[]];
      })
      .filter(([, perms]) => perms.length > 0);
  }, [permissionGroups, permissionQuery]);

  const visiblePermissions = useMemo(
    () => filteredGroups.flatMap(([, perms]) => perms),
    [filteredGroups],
  );

  const togglePermission = (perm: string) => {
    setPermissionError('');
    setSelectedPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm],
    );
  };

  const toggleGroup = (groupPerms: string[]) => {
    setPermissionError('');
    const allSelected = groupPerms.every((p) => selectedPermissions.includes(p));
    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((p) => !groupPerms.includes(p)));
    } else {
      setSelectedPermissions((prev) => [...new Set([...prev, ...groupPerms])]);
    }
  };

  const selectAllVisible = () => {
    if (visiblePermissions.length === 0) return;
    setPermissionError('');
    setSelectedPermissions((prev) => [...new Set([...prev, ...visiblePermissions])]);
  };

  const clearVisible = () => {
    if (visiblePermissions.length === 0) return;
    const s = new Set<string>(visiblePermissions);
    setSelectedPermissions((prev) => prev.filter((p) => !s.has(p)));
  };

  const isSaving = createRole.isPending || updateRole.isPending;

  const handleSave = () => {
    if (!roleName.trim()) {
      setNameError('Role name is required');
      return;
    }
    if (roleName.trim().length > 60) {
      setNameError('Role name cannot exceed 60 characters');
      return;
    }
    if (selectedPermissions.length === 0) {
      setPermissionError('Select at least one permission');
      return;
    }

    const name = roleName.trim();

    if (isNew) {
      createRole.mutate(
        { name, permissions: selectedPermissions },
        {
          onSuccess: () => {
            toast.success('Role created', { description: `"${name}" has been created.` });
            router.push('/roles');
          },
          onError: (err) => {
            toast.error('Failed to create role', { description: getApiErrorMessage(err) });
          },
        },
      );
    } else {
      updateRole.mutate(
        { id, input: { name, permissions: selectedPermissions } },
        {
          onSuccess: () => {
            toast.success('Role updated', { description: `"${name}" has been updated.` });
            router.push('/roles');
          },
          onError: (err) => {
            toast.error('Failed to update role', { description: getApiErrorMessage(err) });
          },
        },
      );
    }
  };

  const isLocked = !isNew && existingRole?.isOwnerRole;
  const pageTitle = isNew ? 'Create Role' : 'Edit Role';
  const pageSubtitle = isNew
    ? 'Define a new role and configure its permissions.'
    : 'Update the role name and permissions.';

  // ─── Loading skeleton ────────────────────────────────────────────────────────

  if ((!isNew && isLoadingRole) || isLoadingPermissions) {
    return (
      <div className='space-y-6'>
        <div className='flex items-center gap-3'>
          <Skeleton className='h-9 w-9 rounded-lg' />
          <div className='space-y-1.5'>
            <Skeleton className='h-7 w-36' />
            <Skeleton className='h-4 w-56' />
          </div>
        </div>
        <Skeleton className='h-10 w-full' />
        <div className='grid gap-4 md:grid-cols-2'>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className='h-48 w-full rounded-xl' />
          ))}
        </div>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className='space-y-6'>
      {/* Page header */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
        <div className='flex items-start gap-3'>
          <Button
            variant='outline'
            size='icon'
            className='mt-0.5 shrink-0'
            onClick={() => router.push('/roles')}
            disabled={isSaving}
          >
            <ArrowLeft size={16} />
          </Button>
          <div className='flex items-center gap-3'>
            <div className='gradient-bg flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-primary-foreground shadow-sm'>
              <ShieldCheck size={19} />
            </div>
            <div>
              <h1 className='font-display text-2xl font-bold md:text-3xl'>{pageTitle}</h1>
              <p className='text-sm text-muted-foreground'>{pageSubtitle}</p>
            </div>
          </div>
        </div>

        <div className='flex items-center gap-2 self-end sm:self-auto'>
          <Button
            variant='outline'
            onClick={() => router.push('/roles')}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className='gradient-bg text-primary-foreground'
            disabled={isSaving || isLocked}
          >
            {isSaving ? (
              <>
                <Loader2 size={15} className='mr-1.5 animate-spin' />
                Saving...
              </>
            ) : (
              <>
                <Check size={15} className='mr-1.5' />
                {isNew ? 'Create Role' : 'Update Role'}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Role name */}
      <div className='space-y-2'>
        <Label htmlFor='role-name' className='text-sm font-semibold'>
          Role Name
        </Label>
        <Input
          id='role-name'
          placeholder='e.g. Technician'
          value={roleName}
          onChange={(e) => {
            setRoleName(e.target.value);
            setNameError('');
          }}
          className={cn('max-w-sm', nameError && 'border-destructive')}
          maxLength={60}
          disabled={isSaving || isLocked}
        />
        {nameError && <p className='text-xs text-destructive'>{nameError}</p>}
        {isLocked && (
          <p className='text-xs text-muted-foreground'>Owner role name and permissions are locked.</p>
        )}
      </div>

      {/* Permissions */}
      <div className='space-y-4'>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <div>
            <p className='text-sm font-semibold'>Permissions</p>
            <p className='text-xs text-muted-foreground'>
              Choose what this role can access and modify.
            </p>
          </div>
          <Badge className='gradient-bg text-primary-foreground'>
            {selectedPermissions.length} selected of {apiPermissions.length}
          </Badge>
        </div>

        {/* Search + bulk actions */}
        <div className='flex flex-wrap items-center gap-2'>
          <div className='relative min-w-[220px] flex-1 sm:max-w-sm'>
            <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              value={permissionQuery}
              onChange={(e) => setPermissionQuery(e.target.value)}
              placeholder='Search permissions...'
              className='pl-9'
              disabled={isLocked}
            />
          </div>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={selectAllVisible}
            disabled={isLocked || visiblePermissions.length === 0}
          >
            Select visible
          </Button>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={clearVisible}
            disabled={isLocked || visiblePermissions.length === 0}
          >
            Clear visible
          </Button>
        </div>

        {permissionError && <p className='text-xs text-destructive'>{permissionError}</p>}

        {/* Permission group grid */}
        {filteredGroups.length === 0 ? (
          <div className='rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground'>
            No permissions match your search.
          </div>
        ) : (
          <div className='grid gap-3 md:grid-cols-2'>
            {filteredGroups.map(([group, perms], gi) => {
              const selectedCount = perms.filter((p) => selectedPermissions.includes(p)).length;
              const allChecked = selectedCount === perms.length;
              const someChecked = selectedCount > 0 && !allChecked;

              return (
                <motion.div
                  key={group}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: gi * 0.03 }}
                  className='rounded-xl border border-border bg-card'
                >
                  {/* Group header */}
                  <div className='flex items-start justify-between gap-3 border-b border-border px-4 py-3'>
                    <div className='min-w-0'>
                      <p className='font-semibold leading-none'>{toTitleCase(group)}</p>
                      <p className='mt-1 text-xs text-muted-foreground'>
                        {permissionGroupDescriptions[group] ?? 'Permission set'}
                      </p>
                    </div>
                    <div className='flex shrink-0 items-center gap-2'>
                      <span className='rounded-full border border-border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground'>
                        {selectedCount}/{perms.length}
                      </span>
                      <CircleToggle
                        checked={allChecked}
                        indeterminate={someChecked}
                        onChange={() => !isLocked && toggleGroup(perms)}
                        size='md'
                      />
                    </div>
                  </div>

                  {/* Permission items */}
                  <div className='divide-y divide-border/60'>
                    {perms.map((perm) => {
                      const checked = selectedPermissions.includes(perm);
                      return (
                        <label
                          key={perm}
                          className={cn(
                            'flex cursor-pointer items-center justify-between gap-3 px-4 py-2.5 transition-colors',
                            !isLocked && 'hover:bg-muted/40',
                            isLocked && 'cursor-default opacity-60',
                            checked && !isLocked && 'bg-primary/5',
                          )}
                        >
                          <div className='min-w-0'>
                            <p className='text-sm font-medium leading-none'>{formatAction(perm)}</p>
                            <p className='mt-0.5 text-[11px] text-muted-foreground'>
                              {formatLabel(perm)}
                            </p>
                          </div>
                          <CircleToggle
                            checked={checked}
                            onChange={() => !isLocked && togglePermission(perm)}
                            size='sm'
                          />
                        </label>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom action bar */}
      <div className='flex justify-end gap-2 border-t border-border pt-6'>
        <Button variant='outline' onClick={() => router.push('/roles')} disabled={isSaving}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          className='gradient-bg text-primary-foreground'
          disabled={isSaving || isLocked}
        >
          {isSaving ? (
            <>
              <Loader2 size={15} className='mr-1.5 animate-spin' />
              Saving...
            </>
          ) : (
            <>
              <Check size={15} className='mr-1.5' />
              {isNew ? 'Create Role' : 'Update Role'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default RoleEdit;

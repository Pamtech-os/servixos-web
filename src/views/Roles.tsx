'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Check,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import ConfirmModal from '@/components/ConfirmModal';
import { toast } from 'sonner';

const ALL_PERMISSIONS = [
  'dashboard.view',
  'clients.view',
  'clients.create',
  'clients.edit',
  'clients.delete',
  'invoices.view',
  'invoices.create',
  'invoices.edit',
  'invoices.delete',
  'jobs.view',
  'jobs.create',
  'jobs.edit',
  'jobs.delete',
  'contracts.view',
  'contracts.create',
  'contracts.edit',
  'contracts.delete',
  'roles.view',
  'roles.create',
  'roles.edit',
  'roles.delete',
  'reports.view',
  'settings.view',
  'settings.edit',
] as const;

type Permission = (typeof ALL_PERMISSIONS)[number];

interface Role {
  id: string;
  name: string;
  permissions: Permission[];
  isDefault?: boolean;
}

const defaultRoles: Role[] = [
  { id: 'owner', name: 'Owner', permissions: [...ALL_PERMISSIONS], isDefault: true },
  {
    id: 'manager',
    name: 'Manager',
    permissions: [
      'dashboard.view',
      'clients.view',
      'clients.create',
      'clients.edit',
      'invoices.view',
      'invoices.create',
      'invoices.edit',
      'jobs.view',
      'jobs.create',
      'jobs.edit',
      'contracts.view',
      'reports.view',
    ],
  },
  {
    id: 'employee',
    name: 'Employee',
    permissions: ['dashboard.view', 'clients.view', 'jobs.view', 'jobs.edit', 'invoices.view'],
  },
];

const permissionGroups = (() => {
  const groups: Record<string, Permission[]> = {};
  ALL_PERMISSIONS.forEach((p) => {
    const [group] = p.split('.');
    if (!groups[group]) groups[group] = [];
    groups[group].push(p);
  });
  return groups;
})();

const permissionGroupDescriptions: Record<string, string> = {
  dashboard: 'Overview and business metrics',
  clients: 'Client records and profile management',
  invoices: 'Billing and invoice workflow',
  jobs: 'Service job scheduling and updates',
  contracts: 'Contract creation and maintenance',
  roles: 'Role assignment and access controls',
  reports: 'Report visibility',
  settings: 'Business configuration options',
};

const toTitleCase = (value: string) =>
  value.replace(/[-_]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

const formatPermissionLabel = (permission: Permission) => {
  const [group, action] = permission.split('.');
  return `${toTitleCase(action)} ${toTitleCase(group)}`;
};

const formatPermissionAction = (permission: Permission) =>
  toTitleCase(permission.split('.')[1]);

const buildGroupSummary = (permissions: Permission[]) => {
  const summary: Record<string, number> = {};
  permissions.forEach((perm) => {
    const [group] = perm.split('.');
    summary[group] = (summary[group] ?? 0) + 1;
  });
  return summary;
};

const Roles = () => {
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<Role[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleName, setRoleName] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>([]);
  const [nameError, setNameError] = useState('');
  const [permissionError, setPermissionError] = useState('');
  const [permissionQuery, setPermissionQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setRoles(defaultRoles);
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const filteredPermissionGroups = useMemo<Array<[string, Permission[]]>>(() => {
    const query = permissionQuery.trim().toLowerCase();
    const groups = Object.entries(permissionGroups).map(([group, perms]) => {
      const filteredPerms = perms.filter((perm) => {
        if (!query) return true;
        const [resource, action] = perm.split('.');
        const queryText =
          `${group} ${resource} ${action} ` +
          `${toTitleCase(group)} ${toTitleCase(resource)} ${toTitleCase(action)}`;
        return queryText.toLowerCase().includes(query);
      });
      return [group, filteredPerms] as [string, Permission[]];
    });
    return groups.filter(([, perms]) => perms.length > 0);
  }, [permissionQuery]);

  const visiblePermissions = useMemo(
    () => filteredPermissionGroups.flatMap(([, perms]) => perms),
    [filteredPermissionGroups],
  );

  const totalAssignedPermissions = useMemo(
    () => roles.reduce((sum, role) => sum + role.permissions.length, 0),
    [roles],
  );

  const averagePermissions = useMemo(
    () =>
      roles.length === 0 ? 0 : Math.round(totalAssignedPermissions / roles.length),
    [roles.length, totalAssignedPermissions],
  );

  const openCreate = () => {
    setEditingRole(null);
    setRoleName('');
    setSelectedPermissions([]);
    setNameError('');
    setPermissionError('');
    setPermissionQuery('');
    setDialogOpen(true);
  };

  const openEdit = (role: Role) => {
    setEditingRole(role);
    setRoleName(role.name);
    setSelectedPermissions([...role.permissions]);
    setNameError('');
    setPermissionError('');
    setPermissionQuery('');
    setDialogOpen(true);
  };

  const togglePermission = (perm: Permission) => {
    setPermissionError('');
    setSelectedPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm],
    );
  };

  const toggleGroup = (groupPerms: Permission[]) => {
    setPermissionError('');
    const allSelected = groupPerms.every((p) => selectedPermissions.includes(p));
    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((p) => !groupPerms.includes(p)));
    } else {
      setSelectedPermissions((prev) => [...new Set([...prev, ...groupPerms])]);
    }
  };

  const handleSave = () => {
    if (!roleName.trim()) {
      setNameError('Role name is required');
      return;
    }
    if (selectedPermissions.length === 0) {
      setPermissionError('Select at least one permission');
      return;
    }

    if (editingRole) {
      setRoles((prev) =>
        prev.map((r) =>
          r.id === editingRole.id
            ? { ...r, name: roleName.trim(), permissions: selectedPermissions }
            : r
        )
      );
      toast.success('Role updated', { description: `"${roleName.trim()}" has been updated.` });
    } else {
      const newRole: Role = {
        id: Date.now().toString(),
        name: roleName.trim(),
        permissions: selectedPermissions,
      };
      setRoles((prev) => [...prev, newRole]);
      toast.success('Role created', { description: `"${roleName.trim()}" has been created.` });
    }

    setRoleName('');
    setSelectedPermissions([]);
    setPermissionQuery('');
    setNameError('');
    setPermissionError('');
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setRoles((prev) => prev.filter((r) => r.id !== deleteTarget.id));
    toast.success('Role deleted', { description: `"${deleteTarget.name}" has been removed.` });
    setDeleteTarget(null);
  };

  const selectAllVisible = () => {
    if (visiblePermissions.length === 0) return;
    setPermissionError('');
    setSelectedPermissions((prev) => [...new Set([...prev, ...visiblePermissions])]);
  };

  const clearVisible = () => {
    if (visiblePermissions.length === 0) return;
    setSelectedPermissions((prev) =>
      prev.filter((perm) => !visiblePermissions.includes(perm)),
    );
  };

  const closeDialog = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setPermissionQuery('');
      setNameError('');
      setPermissionError('');
    }
  };

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='font-display text-2xl font-bold md:text-3xl'>Roles</h1>
          <p className='text-sm text-muted-foreground'>Manage business roles and permissions</p>
        </div>
        <Button onClick={openCreate} className='gradient-bg text-primary-foreground'>
          <Plus size={16} className='mr-1' /> Create Role
        </Button>
      </div>

      {!loading && (
        <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
          <Card>
            <CardContent className='p-4'>
              <p className='text-xs uppercase tracking-wide text-muted-foreground'>Roles</p>
              <p className='mt-1 text-2xl font-bold'>{roles.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='p-4'>
              <p className='text-xs uppercase tracking-wide text-muted-foreground'>
                Permission Assignments
              </p>
              <p className='mt-1 text-2xl font-bold'>{totalAssignedPermissions}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='p-4'>
              <p className='text-xs uppercase tracking-wide text-muted-foreground'>
                Avg per Role
              </p>
              <p className='mt-1 text-2xl font-bold'>{averagePermissions}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
        {loading
          ? [...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className='h-5 w-32' />
                </CardHeader>
                <CardContent className='space-y-3'>
                  <Skeleton className='h-4 w-full' />
                  <Skeleton className='h-4 w-3/4' />
                  <Skeleton className='h-4 w-1/2' />
                  <div className='flex gap-2 pt-2'>
                    <Skeleton className='h-8 w-20' />
                    <Skeleton className='h-8 w-20' />
                  </div>
                </CardContent>
              </Card>
            ))
          : roles.map((role, i) => (
              <motion.div
                key={role.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className='h-full border-border/80'>
                  <CardHeader className='pb-2'>
                    <div className='flex items-start justify-between gap-3'>
                      <div className='flex items-start gap-3'>
                        <div className='gradient-bg flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-primary-foreground shadow-sm'>
                          <ShieldCheck size={17} />
                        </div>
                        <div>
                          <CardTitle className='text-base'>{role.name}</CardTitle>
                          <p className='mt-1 text-xs text-muted-foreground'>
                            {Object.keys(buildGroupSummary(role.permissions)).length} modules
                            covered
                          </p>
                        </div>
                      </div>
                      {role.isDefault && (
                        <Badge variant='secondary' className='text-[10px] uppercase tracking-wide'>
                          Default
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className='space-y-3'>
                    <div className='flex flex-wrap gap-1.5'>
                      {Object.entries(buildGroupSummary(role.permissions))
                        .sort(([a], [b]) => a.localeCompare(b))
                        .slice(0, 4)
                        .map(([group, count]) => (
                          <Badge key={group} variant='outline' className='text-xs font-normal'>
                            {toTitleCase(group)} ({count})
                          </Badge>
                        ))}
                      {Object.keys(buildGroupSummary(role.permissions)).length > 4 && (
                        <Badge variant='outline' className='text-xs font-normal'>
                          +
                          {Object.keys(buildGroupSummary(role.permissions)).length - 4}{' '}
                          modules
                        </Badge>
                      )}
                    </div>
                    <p className='text-xs text-muted-foreground'>
                      {role.permissions.length} permission
                      {role.permissions.length !== 1 ? 's' : ''} including{' '}
                      {role.permissions
                        .slice(0, 2)
                        .map((perm) => formatPermissionLabel(perm))
                        .join(', ')}
                      {role.permissions.length > 2 && '...'}
                    </p>
                    {!role.isDefault && (
                      <div className='flex gap-2 pt-1'>
                        <Button size='sm' variant='outline' onClick={() => openEdit(role)}>
                          <Pencil size={14} className='mr-1' /> Edit
                        </Button>
                        <Button
                          size='sm'
                          variant='outline'
                          className='text-destructive hover:bg-destructive/10'
                          onClick={() => setDeleteTarget(role)}
                        >
                          <Trash2 size={14} className='mr-1' /> Delete
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={closeDialog}>
        <DialogContent className='flex max-h-[92dvh] flex-col overflow-hidden p-0 sm:max-w-3xl'>
          <DialogHeader className='shrink-0 border-b border-border px-6 py-5'>
            <DialogTitle>{editingRole ? 'Edit Role' : 'Create Role'}</DialogTitle>
            <DialogDescription>
              {editingRole
                ? 'Update the role name and permissions.'
                : 'Define a new role with specific permissions.'}
            </DialogDescription>
          </DialogHeader>
          <div className='min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5'>
            <div className='space-y-2'>
              <Label htmlFor='role-name'>Role Name</Label>
              <Input
                id='role-name'
                placeholder='e.g. Technician'
                value={roleName}
                onChange={(e) => {
                  setRoleName(e.target.value);
                  setNameError('');
                }}
                className={nameError ? 'border-destructive' : ''}
              />
              {nameError && <p className='text-xs text-destructive'>{nameError}</p>}
            </div>
            <div className='space-y-3'>
              <div className='flex items-center justify-between gap-3'>
                <Label>Permissions</Label>
                <Badge variant='secondary'>
                  {selectedPermissions.length} selected of {ALL_PERMISSIONS.length}
                </Badge>
              </div>

              <div className='rounded-xl border border-border p-3'>
                <div className='flex flex-wrap items-center gap-2'>
                  <div className='relative min-w-[220px] flex-1'>
                    <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                    <Input
                      value={permissionQuery}
                      onChange={(e) => setPermissionQuery(e.target.value)}
                      placeholder='Search permissions...'
                      className='pl-9'
                    />
                  </div>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={selectAllVisible}
                    disabled={visiblePermissions.length === 0}
                  >
                    Select visible
                  </Button>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={clearVisible}
                    disabled={visiblePermissions.length === 0}
                  >
                    Clear visible
                  </Button>
                </div>
              </div>

              {filteredPermissionGroups.length === 0 ? (
                <div className='rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground'>
                  No permissions match your search.
                </div>
              ) : (
                <div className='grid gap-3 md:grid-cols-2'>
                  {filteredPermissionGroups.map(([group, perms]) => {
                    const allChecked = perms.every((p) =>
                      selectedPermissions.includes(p),
                    );
                    const someChecked = perms.some((p) =>
                      selectedPermissions.includes(p),
                    );

                    return (
                      <div key={group} className='rounded-lg border border-border p-3'>
                        <div className='mb-2 flex items-start justify-between gap-2'>
                          <div>
                            <p className='text-sm font-semibold'>{toTitleCase(group)}</p>
                            <p className='text-xs text-muted-foreground'>
                              {permissionGroupDescriptions[group] ?? 'Permission set'}
                            </p>
                          </div>
                          <div className='flex items-center gap-2'>
                            <Badge variant='outline' className='text-[10px] font-medium'>
                              {
                                perms.filter((perm) =>
                                  selectedPermissions.includes(perm),
                                ).length
                              }
                              /{perms.length}
                            </Badge>
                            <Checkbox
                              checked={
                                allChecked ? true : someChecked ? 'indeterminate' : false
                              }
                              onCheckedChange={() => toggleGroup(perms)}
                            />
                          </div>
                        </div>
                        <div className='space-y-1.5'>
                          {perms.map((perm) => {
                            const checked = selectedPermissions.includes(perm);
                            return (
                              <label
                                key={perm}
                                className={`flex cursor-pointer items-center justify-between gap-3 rounded-md border px-2.5 py-2 text-sm transition-colors ${
                                  checked
                                    ? 'border-primary/30 bg-primary/5'
                                    : 'border-transparent hover:border-border hover:bg-muted/40'
                                }`}
                              >
                                <div className='min-w-0'>
                                  <p className='text-sm font-medium leading-none'>
                                    {formatPermissionAction(perm)}
                                  </p>
                                  <p className='mt-1 text-[11px] text-muted-foreground'>
                                    {formatPermissionLabel(perm)}
                                  </p>
                                </div>
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={() => togglePermission(perm)}
                                />
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {permissionError && (
                <p className='text-xs text-destructive'>{permissionError}</p>
              )}
            </div>
          </div>
          <DialogFooter className='shrink-0 border-t border-border px-6 py-4'>
            <Button variant='outline' onClick={() => closeDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className='gradient-bg text-primary-foreground'
              disabled={!roleName.trim() || selectedPermissions.length === 0}
            >
              <Check size={16} className='mr-1' />
              {editingRole ? 'Update Role' : 'Create Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title='Delete Role'
        description={`Are you sure you want to delete the "${deleteTarget?.name}" role? This action cannot be undone.`}
        confirmLabel='Delete'
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default Roles;

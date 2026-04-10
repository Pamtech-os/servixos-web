import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Plus, Pencil, Trash2, Check } from 'lucide-react';
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

const Roles = () => {
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<Role[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleName, setRoleName] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>([]);
  const [nameError, setNameError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setRoles(defaultRoles);
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const openCreate = () => {
    setEditingRole(null);
    setRoleName('');
    setSelectedPermissions([]);
    setNameError('');
    setDialogOpen(true);
  };

  const openEdit = (role: Role) => {
    setEditingRole(role);
    setRoleName(role.name);
    setSelectedPermissions([...role.permissions]);
    setNameError('');
    setDialogOpen(true);
  };

  const togglePermission = (perm: Permission) => {
    setSelectedPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const toggleGroup = (group: string) => {
    const groupPerms = permissionGroups[group];
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
      setNameError('Select at least one permission');
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
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setRoles((prev) => prev.filter((r) => r.id !== deleteTarget.id));
    toast.success('Role deleted', { description: `"${deleteTarget.name}" has been removed.` });
    setDeleteTarget(null);
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
                <Card className='h-full'>
                  <CardHeader className='pb-3'>
                    <CardTitle className='flex items-center gap-2 text-base'>
                      <ShieldCheck size={18} className='text-primary' />
                      {role.name}
                      {role.isDefault && (
                        <Badge variant='secondary' className='ml-auto text-xs'>
                          Default
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='mb-4 flex flex-wrap gap-1.5'>
                      {role.permissions.slice(0, 6).map((p) => (
                        <Badge key={p} variant='outline' className='text-xs font-normal'>
                          {p}
                        </Badge>
                      ))}
                      {role.permissions.length > 6 && (
                        <Badge variant='outline' className='text-xs font-normal'>
                          +{role.permissions.length - 6} more
                        </Badge>
                      )}
                    </div>
                    <p className='mb-4 text-xs text-muted-foreground'>
                      {role.permissions.length} permission{role.permissions.length !== 1 ? 's' : ''}
                    </p>
                    {!role.isDefault && (
                      <div className='flex gap-2'>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>{editingRole ? 'Edit Role' : 'Create Role'}</DialogTitle>
            <DialogDescription>
              {editingRole
                ? 'Update the role name and permissions.'
                : 'Define a new role with specific permissions.'}
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-5 py-2'>
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
              <Label>Permissions</Label>
              {Object.entries(permissionGroups).map(([group, perms]) => {
                const allChecked = perms.every((p) => selectedPermissions.includes(p));
                const someChecked = perms.some((p) => selectedPermissions.includes(p));
                return (
                  <div key={group} className='rounded-lg border border-border p-3'>
                    <div className='mb-2 flex items-center gap-2'>
                      <Checkbox
                        checked={allChecked}
                        onCheckedChange={() => toggleGroup(group)}
                        className={someChecked && !allChecked ? 'opacity-60' : ''}
                      />
                      <span className='text-sm font-semibold capitalize'>{group}</span>
                    </div>
                    <div className='ml-6 grid grid-cols-2 gap-2'>
                      {perms.map((perm) => (
                        <label key={perm} className='flex items-center gap-2 text-sm'>
                          <Checkbox
                            checked={selectedPermissions.includes(perm)}
                            onCheckedChange={() => togglePermission(perm)}
                          />
                          <span className='text-muted-foreground'>{perm.split('.')[1]}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} className='gradient-bg text-primary-foreground'>
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

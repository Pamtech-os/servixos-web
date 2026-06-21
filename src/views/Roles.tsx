'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, Pencil, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import ConfirmModal from '@/components/ConfirmModal';
import { toast } from '@/components/ui/sonner';
import { getApiErrorMessage } from '@/common/network/http-client';
import { splitPermission } from '@/common/auth/permissions';
import { useRoles } from '@/hooks/queries/use-roles';
import { useDeleteRole } from '@/hooks/mutations/use-roles';
import type { Role } from '@/lib/api-client';

const toTitleCase = (value: string) =>
  value.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const formatPermissionBadge = (perm: string) => {
  const { module: group, action } = splitPermission(perm);
  return `${toTitleCase(group)}:${toTitleCase(action)}`;
};

const countModules = (permissions: string[]) =>
  new Set(permissions.map((p) => splitPermission(p).module).filter(Boolean)).size;

function RoleCard({ role, index, onDelete, isDeleting }: {
  role: Role;
  index: number;
  onDelete: (role: Role) => void;
  isDeleting: boolean;
}) {
  const router = useRouter();
  const moduleCount = countModules(role.permissions);
  const permCount = role.permissions.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className='rounded-xl border border-border/80 bg-card p-4 sm:p-5'
    >
      {/* Top row */}
      <div className='flex items-start justify-between gap-4'>
        <div className='flex items-center gap-3 min-w-0'>
          <div className='gradient-bg flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-primary-foreground shadow-sm'>
            <ShieldCheck size={18} />
          </div>
          <div className='min-w-0'>
            <div className='flex items-center gap-2'>
              <h3 className='font-semibold leading-none'>{role.name}</h3>
              {role.isSystem && (
                <Badge variant='secondary' className='text-[10px] uppercase tracking-wide'>
                  System
                </Badge>
              )}
            </div>
            <p className='mt-1 text-xs text-muted-foreground'>
              {permCount} permission{permCount !== 1 ? 's' : ''} across {moduleCount} module{moduleCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className='flex shrink-0 items-center gap-2'>
          <Button
            size='sm'
            variant='outline'
            onClick={() => router.push(`/roles/${role._id}`)}
          >
            <Pencil size={13} className='mr-1.5' /> Edit
          </Button>
          {!role.isSystem && (
            <Button
              size='sm'
              variant='outline'
              className='text-destructive hover:bg-destructive/10'
              onClick={() => onDelete(role)}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 size={13} className='animate-spin' />
              ) : (
                <Trash2 size={13} className='mr-1.5' />
              )}
              {isDeleting ? '' : 'Delete'}
            </Button>
          )}
        </div>
      </div>

      {/* Permission badges */}
      {permCount > 0 && (
        <>
          <Separator className='my-3' />
          <div className='flex flex-wrap gap-1.5'>
            {role.permissions.slice(0, 6).map((perm) => (
              <span
                key={perm}
                className='inline-flex items-center rounded-md border border-border/70 bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground'
              >
                {formatPermissionBadge(perm)}
              </span>
            ))}
            {permCount > 6 && (
              <span className='inline-flex items-center rounded-md border border-border/70 bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground'>
                +{permCount - 6} more
              </span>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
}

const Roles = () => {
  const router = useRouter();
  const { data: roles = [], isLoading } = useRoles();
  const deleteRole = useDeleteRole();
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);

  const handleDelete = () => {
    if (!deleteTarget) return;
    const { _id, name } = deleteTarget;
    deleteRole.mutate(_id, {
      onSuccess: () => {
        toast.success('Role deleted', { description: `"${name}" has been removed.` });
      },
      onError: (err) => {
        toast.error('Failed to delete role', { description: getApiErrorMessage(err) });
      },
    });
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='font-display text-2xl font-bold md:text-3xl'>Roles</h1>
          <p className='text-sm text-muted-foreground'>
            Manage team roles and their access permissions
          </p>
        </div>
        <Button
          onClick={() => router.push('/roles/new')}
          className='gradient-bg text-primary-foreground'
        >
          <Plus size={16} className='mr-1' /> Create Role
        </Button>
      </div>

      {/* Role list */}
      <div className='space-y-3'>
        {isLoading
          ? [...Array(3)].map((_, i) => (
              <div key={i} className='rounded-xl border border-border/80 bg-card p-5'>
                <div className='flex items-start justify-between gap-4'>
                  <div className='flex items-center gap-3'>
                    <Skeleton className='h-10 w-10 rounded-xl' />
                    <div className='space-y-2'>
                      <Skeleton className='h-4 w-28' />
                      <Skeleton className='h-3 w-44' />
                    </div>
                  </div>
                  <div className='flex gap-2'>
                    <Skeleton className='h-8 w-16 rounded-md' />
                    <Skeleton className='h-8 w-16 rounded-md' />
                  </div>
                </div>
                <Separator className='my-3' />
                <div className='flex flex-wrap gap-1.5'>
                  {[...Array(5)].map((_, j) => (
                    <Skeleton key={j} className='h-5 w-20 rounded-md' />
                  ))}
                </div>
              </div>
            ))
          : roles.map((role, i) => (
              <RoleCard
                key={role._id}
                role={role}
                index={i}
                onDelete={setDeleteTarget}
                isDeleting={deleteRole.isPending && deleteRole.variables === role._id}
              />
            ))}
      </div>

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

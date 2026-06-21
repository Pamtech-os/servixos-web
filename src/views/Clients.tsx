'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Eye, Trash2, Users, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useClients } from '@/hooks/queries/use-clients';
import { useDeleteClient } from '@/hooks/mutations/use-clients';
import type { Client } from '@/lib/api-client';
import ConfirmModal from '@/components/ConfirmModal';
import { toast } from '@/components/ui/sonner';
import { getApiErrorMessage } from '@/common/network/http-client';

const Clients = () => {
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const router = useRouter();

  const { data, isLoading } = useClients({ search: search || undefined });
  const deleteClient = useDeleteClient();

  const clientList = data?.data ?? [];

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteClient.mutate(deleteTarget._id, {
      onSuccess: () => {
        toast.success('Client deleted', {
          description: `"${deleteTarget.name}" has been removed.`,
        });
        setDeleteTarget(null);
      },
      onError: (err) => {
        toast.error('Failed to delete', { description: getApiErrorMessage(err) });
      },
    });
  };

  return (
    <div className='space-y-4 sm:space-y-6'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='font-display text-xl font-bold sm:text-2xl md:text-3xl'>Clients</h1>
          <p className='text-sm text-muted-foreground'>Manage your client base</p>
        </div>
        <div className='relative w-full sm:w-72'>
          <Search
            size={16}
            className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground'
          />
          <Input
            placeholder='Search clients...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='pl-9'
          />
        </div>
      </div>

      <Card>
        <CardHeader className='pb-3 sm:pb-6'>
          <CardTitle className='flex items-center gap-2 text-base'>
            <Users size={18} className='text-primary' />
            All Clients ({isLoading ? '...' : (data?.meta.total ?? clientList.length)})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='space-y-4'>
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className='flex items-center justify-between rounded-lg border border-border p-4'
                >
                  <div className='flex items-center gap-3'>
                    <Skeleton className='h-10 w-10 rounded-full' />
                    <div className='space-y-1'>
                      <Skeleton className='h-4 w-32' />
                      <Skeleton className='h-3 w-40' />
                    </div>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Skeleton className='h-8 w-8 rounded' />
                    <Skeleton className='h-8 w-8 rounded' />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='space-y-3'>
              {clientList.map((client, i) => (
                <motion.div
                  key={client._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className='flex flex-col gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between sm:p-4'
                >
                  <div className='flex items-center gap-3'>
                    <div className='gradient-bg flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-primary-foreground'>
                      {client.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>
                    <div className='min-w-0'>
                      <p className='font-medium'>{client.name}</p>
                      <p className='truncate text-sm text-muted-foreground'>{client.email}</p>
                    </div>
                  </div>
                  <div className='flex items-center justify-end gap-2'>
                    <button
                      onClick={() => router.push(`/clients/${client._id}`)}
                      className='rounded-lg p-2 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary'
                      title='View'
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(client)}
                      className='rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive'
                      title='Delete'
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </motion.div>
              ))}
              {clientList.length === 0 && (
                <p className='py-8 text-center text-sm text-muted-foreground'>No clients found.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmModal
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title='Delete Client'
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel='Delete'
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default Clients;

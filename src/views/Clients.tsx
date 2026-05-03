'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Eye, Trash2, Users, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { mockClients } from '@/lib/mock-data';
import type { Client } from '@/lib/mock-data';
import ConfirmModal from '@/components/ConfirmModal';
import { toast } from '@/components/ui/sonner';

const Clients = () => {
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      setClients(mockClients);
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const filtered = clients.filter(
    (c) =>
      c.fullName.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = () => {
    if (!deleteTarget) return;
    setClients((prev) => prev.filter((c) => c.id !== deleteTarget.id));
    toast.success('Client deleted', {
      description: `"${deleteTarget.fullName}" has been removed.`,
    });
    setDeleteTarget(null);
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
            All Clients ({loading ? '...' : filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
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
                  <div className='flex items-center gap-4'>
                    <Skeleton className='h-4 w-16' />
                    <Skeleton className='h-8 w-8 rounded' />
                    <Skeleton className='h-8 w-8 rounded' />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='space-y-3'>
              {filtered.map((client, i) => (
                <motion.div
                  key={client.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className='flex flex-col gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between sm:p-4'
                >
                  <div className='flex items-center gap-3'>
                    <div className='gradient-bg flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-primary-foreground'>
                      {client.fullName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>
                    <div className='min-w-0'>
                      <p className='font-medium'>{client.fullName}</p>
                      <p className='truncate text-sm text-muted-foreground'>{client.email}</p>
                    </div>
                  </div>
                  <div className='flex items-center justify-between gap-3 sm:justify-end sm:gap-4'>
                    <span className='font-display text-sm font-semibold'>
                      ${client.price.toLocaleString()}
                    </span>
                    <div className='flex gap-2'>
                      <button
                        onClick={() => router.push(`/clients/${client.id}`)}
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
                  </div>
                </motion.div>
              ))}
              {filtered.length === 0 && (
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
        description={`Are you sure you want to delete "${deleteTarget?.fullName}"? This action cannot be undone.`}
        confirmLabel='Delete'
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default Clients;

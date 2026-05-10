'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Coffee, LogOut } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import PaginationControls from '@/components/ui/pagination-controls';
import { useEmployee, useEmployeeClockHistory } from '@/hooks/queries/use-employees';
import { useRoles } from '@/hooks/queries/use-roles';

const PAGE_SIZE = 5;

function formatDate(value?: string): string {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleDateString();
}

function formatTime(value?: string | null): string {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const ClockHistory = () => {
  const params = useParams<{ employeeId: string }>();
  const employeeId = typeof params?.employeeId === 'string' ? params.employeeId : '';
  const router = useRouter();
  const [page, setPage] = useState(1);

  const employeeQuery = useEmployee(employeeId);
  const historyQuery = useEmployeeClockHistory(employeeId, { page, limit: PAGE_SIZE });
  const rolesQuery = useRoles();

  const employee = employeeQuery.data;
  const history = historyQuery.data?.data ?? [];
  const paginationMeta =
    historyQuery.data?.meta ?? {
      page: 1,
      limit: PAGE_SIZE,
      total: 0,
      totalPages: 0,
    };

  const roleName = useMemo(() => {
    if (!employee) return 'Unknown role';
    const role = (rolesQuery.data ?? []).find((item) => item._id === employee.roleId);
    return role?.name ?? 'Unknown role';
  }, [employee, rolesQuery.data]);

  useEffect(() => {
    if (page !== paginationMeta.page) {
      setPage(paginationMeta.page);
    }
  }, [page, paginationMeta.page]);

  if (employeeQuery.isLoading) {
    return (
      <div className='space-y-6'>
        <Skeleton className='h-4 w-24 rounded-md' />
        <div className='space-y-1'>
          <Skeleton className='h-8 w-56 rounded-md' />
          <Skeleton className='h-4 w-40 rounded-md' />
        </div>
        <div className='space-y-3'>
          {[...Array(4)].map((_, index) => (
            <Card key={index}>
              <CardContent className='flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between'>
                <Skeleton className='h-4 w-24 rounded-md' />
                <Skeleton className='h-4 w-64 rounded-md' />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className='flex flex-col items-center justify-center py-20'>
        <p className='text-muted-foreground'>Employee not found.</p>
        <button
          onClick={() => router.push('/teams')}
          className='mt-4 text-sm text-primary hover:underline'
        >
          Back to Teams
        </button>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center gap-3'>
        <button
          onClick={() => router.push('/teams')}
          className='flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground'
        >
          <ArrowLeft size={16} /> Back to Teams
        </button>
      </div>

      <div>
        <h1 className='font-display text-2xl font-bold'>Clock History</h1>
        <p className='text-sm text-muted-foreground'>
          {employee.fullName} · {roleName}
        </p>
      </div>

      <div className='space-y-3'>
        {history.length === 0 ? (
          <Card>
            <CardContent className='py-12 text-center text-sm text-muted-foreground'>
              No clock history found.
            </CardContent>
          </Card>
        ) : (
          history.map((record, index) => (
            <motion.div
              key={record._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
            >
              <Card>
                <CardContent className='flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between'>
                  <div className='font-medium'>{formatDate(record.clockInAt)}</div>
                  <div className='flex flex-wrap items-center gap-3 text-sm'>
                    <span className='flex items-center gap-1.5 text-emerald-600'>
                      <Clock size={14} /> In: {formatTime(record.clockInAt)}
                    </span>
                    <span className='flex items-center gap-1.5 text-amber-600'>
                      <Coffee size={14} /> Break: {record.breakMinutes}m
                    </span>
                    <span className='flex items-center gap-1.5 text-destructive'>
                      <LogOut size={14} /> Out: {formatTime(record.clockOutAt)}
                    </span>
                    <Badge variant='secondary'>
                      {record.totalHours != null ? `${record.totalHours}h total` : '—'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      <PaginationControls
        meta={paginationMeta}
        onPageChange={setPage}
        layout='centered'
        className='pt-2'
        buttonSize='sm'
      />
    </div>
  );
};

export default ClockHistory;

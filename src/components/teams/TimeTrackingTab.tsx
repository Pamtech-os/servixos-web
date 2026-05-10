'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Clock, Coffee, LogOut, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import PaginationControls from '@/components/ui/pagination-controls';
import { useEmployees, useEmployeeClockHistory, useEmployeeClockStatus } from '@/hooks/queries/use-employees';
import { useRoles } from '@/hooks/queries/use-roles';
import type { Employee, EmployeeClockStatus } from '@/lib/api-client';

const PAGE_SIZE = 5;

function formatDateTime(value?: string | null): string {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(value?: string): string {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleDateString();
}

function statusBadge(status: EmployeeClockStatus): { className: string; label: string } {
  switch (status) {
    case 'clocked_in':
      return {
        className: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
        label: 'Clocked In',
      };
    case 'on_break':
      return {
        className: 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400',
        label: 'On Break',
      };
    case 'clocked_out':
    default:
      return {
        className: 'border-border bg-muted text-muted-foreground',
        label: 'Clocked Out',
      };
  }
}

function EmployeeTimeCard({
  employee,
  index,
  role,
}: {
  employee: Employee;
  index: number;
  role: string;
}) {
  const router = useRouter();
  const clockStatusQuery = useEmployeeClockStatus(employee._id);
  const historyQuery = useEmployeeClockHistory(employee._id, { page: 1, limit: 3 });

  const status = clockStatusQuery.data?.status ?? 'clocked_out';
  const statusConfig = statusBadge(status);
  const clockInAt = clockStatusQuery.data?.clockInAt ?? clockStatusQuery.data?.currentRecord?.clockInAt;
  const breakMinutes = clockStatusQuery.data?.breakMinutes ?? 0;
  const history = historyQuery.data?.data ?? [];

  return (
    <motion.div
      key={employee._id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <Card>
        <CardContent className='p-4'>
          <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
            <div className='flex items-center gap-3'>
              <div className='gradient-bg flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-primary-foreground'>
                {employee.fullName
                  .split(' ')
                  .filter(Boolean)
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()}
              </div>
              <div>
                <p className='font-medium'>{employee.fullName}</p>
                <p className='text-xs text-muted-foreground'>{role}</p>
              </div>
            </div>
            <div className='flex flex-wrap items-center gap-2'>
              <Badge variant='outline' className='font-mono'>
                Target {employee.weeklyHoursTarget}h/week
              </Badge>
              <Badge variant='outline' className={statusConfig.className}>
                {statusConfig.label}
              </Badge>
              <Button
                variant='ghost'
                size='sm'
                className='gap-1 text-xs'
                onClick={() => router.push(`/teams/clock-history/${employee._id}`)}
              >
                Full History <ExternalLink size={12} />
              </Button>
            </div>
          </div>

          {(clockStatusQuery.isLoading || historyQuery.isLoading) && (
            <div className='mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2'>
              <Skeleton className='h-8 w-full rounded-md' />
              <Skeleton className='h-8 w-full rounded-md' />
            </div>
          )}

          {!clockStatusQuery.isLoading && (
            <div className='mt-4 flex flex-wrap items-center gap-3 text-xs'>
              <span className='flex items-center gap-1 text-emerald-600'>
                <Clock size={12} /> In: {formatDateTime(clockInAt)}
              </span>
              <span className='flex items-center gap-1 text-amber-600'>
                <Coffee size={12} /> Break: {breakMinutes}m
              </span>
              <span className='flex items-center gap-1 text-destructive'>
                <LogOut size={12} /> Out:{' '}
                {formatDateTime(clockStatusQuery.data?.currentRecord?.clockOutAt ?? null)}
              </span>
            </div>
          )}

          {history.length > 0 && (
            <div className='mt-4 space-y-2'>
              <p className='text-xs font-medium text-muted-foreground'>Recent Clock History</p>
              <div className='space-y-1.5'>
                {history.map((record) => (
                  <div
                    key={record._id}
                    className='flex flex-col gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs sm:flex-row sm:items-center sm:justify-between'
                  >
                    <span className='font-medium'>{formatDate(record.clockInAt)}</span>
                    <div className='flex flex-wrap items-center gap-2 sm:gap-3'>
                      <span className='flex items-center gap-1 text-emerald-600'>
                        <Clock size={10} /> {formatDateTime(record.clockInAt)}
                      </span>
                      <span className='flex items-center gap-1 text-amber-600'>
                        <Coffee size={10} /> {record.breakMinutes}m
                      </span>
                      <span className='flex items-center gap-1 text-destructive'>
                        <LogOut size={10} /> {formatDateTime(record.clockOutAt)}
                      </span>
                      <Badge variant='secondary' className='text-[10px]'>
                        {record.totalHours != null ? `${record.totalHours}h` : '—'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

const TimeTrackingTab = () => {
  const [page, setPage] = useState(1);
  const employeesQuery = useEmployees({ page, limit: PAGE_SIZE });
  const rolesQuery = useRoles();

  const employees = employeesQuery.data?.data ?? [];
  const paginationMeta =
    employeesQuery.data?.meta ?? {
      page: 1,
      limit: PAGE_SIZE,
      total: 0,
      totalPages: 0,
    };

  const roleMap = useMemo(
    () => Object.fromEntries((rolesQuery.data ?? []).map((role) => [role._id, role.name])),
    [rolesQuery.data]
  );

  useEffect(() => {
    if (page !== paginationMeta.page) {
      setPage(paginationMeta.page);
    }
  }, [page, paginationMeta.page]);

  const renderBody = (): ReactNode => {
    if (employeesQuery.isLoading) {
      return (
        <div className='space-y-3'>
          {[...Array(4)].map((_, index) => (
            <Card key={index}>
              <CardContent className='space-y-4 p-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <Skeleton className='h-10 w-10 rounded-full' />
                    <div className='space-y-1.5'>
                      <Skeleton className='h-4 w-32' />
                      <Skeleton className='h-3 w-24' />
                    </div>
                  </div>
                  <Skeleton className='h-6 w-24 rounded-md' />
                </div>
                <Skeleton className='h-8 w-full rounded-md' />
                <Skeleton className='h-16 w-full rounded-md' />
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (employees.length === 0) {
      return <p className='py-8 text-center text-sm text-muted-foreground'>No employees found.</p>;
    }

    return (
      <div className='space-y-3'>
        {employees.map((employee, index) => (
          <EmployeeTimeCard
            key={employee._id}
            employee={employee}
            index={index}
            role={roleMap[employee.roleId] ?? 'Unknown role'}
          />
        ))}
      </div>
    );
  };

  return (
    <div className='mt-4 space-y-4'>
      <h3 className='font-display text-lg font-semibold'>Team Hours & Live Clock Status</h3>

      {renderBody()}

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

export default TimeTrackingTab;

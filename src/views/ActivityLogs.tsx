'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import {
  Search,
  Activity,
  Users,
  Briefcase,
  FileText,
  CreditCard,
  Settings,
  LogIn,
  Shield,
  CalendarIcon,
  UserCheck,
  CheckSquare,
  Inbox,
  Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import PaginationControls from '@/components/ui/pagination-controls';
import { getPaginationRange } from '@/lib/pagination';
import { useActivityLogs } from '@/hooks/queries/use-activity-logs';
import type { ActivityLogCategory } from '@/lib/api-client';

const ITEMS_PER_PAGE = 20;
const SEARCH_DEBOUNCE_MS = 400;

// The backend marks timestamp with Z but it's already in business local time — parse without conversion.
function parseLocalTimestamp(ts: string): Date {
  return new Date(ts.endsWith('Z') ? ts.slice(0, -1) : ts);
}

function parseUserAgent(ua?: string): string {
  if (!ua) return '—';
  let browser = 'Unknown browser';
  if (/Edg\//.test(ua)) browser = 'Edge';
  else if (/OPR\/|Opera\//.test(ua)) browser = 'Opera';
  else if (/Chrome\//.test(ua)) browser = 'Chrome';
  else if (/Firefox\//.test(ua)) browser = 'Firefox';
  else if (/Safari\//.test(ua) && !/Chrome/.test(ua)) browser = 'Safari';

  let os = 'Unknown OS';
  if (/Android/.test(ua)) os = 'Android';
  else if (/iPhone|iPad/.test(ua)) os = 'iOS';
  else if (/Windows/.test(ua)) os = 'Windows';
  else if (/Macintosh|Mac OS X/.test(ua)) os = 'macOS';
  else if (/Linux/.test(ua)) os = 'Linux';

  return `${browser} · ${os}`;
}

const categoryConfig: Record<
  ActivityLogCategory,
  { icon: typeof Activity; color: string; label: string }
> = {
  auth: {
    icon: LogIn,
    color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    label: 'Auth',
  },
  client: {
    icon: Users,
    color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    label: 'Client',
  },
  job: {
    icon: Briefcase,
    color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
    label: 'Job',
  },
  invoice: {
    icon: FileText,
    color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    label: 'Invoice',
  },
  payment: {
    icon: CreditCard,
    color: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
    label: 'Payment',
  },
  settings: {
    icon: Settings,
    color: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20',
    label: 'Settings',
  },
  role: {
    icon: Shield,
    color: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20',
    label: 'Role',
  },
  employee: {
    icon: UserCheck,
    color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
    label: 'Employee',
  },
  task: {
    icon: CheckSquare,
    color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
    label: 'Task',
  },
  request: {
    icon: Inbox,
    color: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
    label: 'Request',
  },
  website: {
    icon: Globe,
    color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    label: 'Website',
  },
};

const ActivityLogs = () => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState<ActivityLogCategory | 'all'>('all');
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  const query = useMemo(() => {
    const dateStr = dateFilter ? format(dateFilter, 'yyyy-MM-dd') : undefined;
    return {
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(categoryFilter !== 'all' ? { category: categoryFilter } : {}),
      ...(dateStr ? { dateFrom: dateStr, dateTo: dateStr } : {}),
      page,
      limit: ITEMS_PER_PAGE,
    };
  }, [debouncedSearch, categoryFilter, dateFilter, page]);

  const { data, isLoading, isError } = useActivityLogs(query);

  const logs = data?.data ?? [];
  const meta = data?.meta;
  const paginationRange = meta ? getPaginationRange(meta) : { from: 0, to: 0 };

  const resetPage = () => setPage(1);

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h1 className='text-2xl font-bold tracking-tight'>Activity Logs</h1>
        <p className='text-sm text-muted-foreground'>
          Track all business and employee actions across the system
        </p>
      </div>

      {/* Filters */}
      <div className='flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center'>
        <div className='relative w-full sm:max-w-sm sm:flex-1'>
          <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            placeholder='Search logs...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='pl-9'
          />
        </div>
        <Select
          value={categoryFilter}
          onValueChange={(v) => {
            setCategoryFilter(v as ActivityLogCategory | 'all');
            resetPage();
          }}
        >
          <SelectTrigger className='w-full sm:w-[160px]'>
            <SelectValue placeholder='All Categories' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Categories</SelectItem>
            <SelectItem value='auth'>Auth</SelectItem>
            <SelectItem value='client'>Client</SelectItem>
            <SelectItem value='job'>Job</SelectItem>
            <SelectItem value='invoice'>Invoice</SelectItem>
            <SelectItem value='payment'>Payment</SelectItem>
            <SelectItem value='settings'>Settings</SelectItem>
            <SelectItem value='role'>Role</SelectItem>
            <SelectItem value='employee'>Employee</SelectItem>
            <SelectItem value='task'>Task</SelectItem>
            <SelectItem value='request'>Request</SelectItem>
            <SelectItem value='website'>Website</SelectItem>
          </SelectContent>
        </Select>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant='outline'
              className={cn(
                'w-full justify-start text-left font-normal sm:w-[160px]',
                !dateFilter && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className='mr-2 h-4 w-4' />
              {dateFilter ? format(dateFilter, 'MMM dd, yyyy') : 'Filter by date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className='w-auto p-0' align='start'>
            <Calendar
              mode='single'
              selected={dateFilter}
              onSelect={(d) => {
                setDateFilter(d);
                resetPage();
              }}
              initialFocus
              className={cn('p-3 pointer-events-auto')}
            />
          </PopoverContent>
        </Popover>
        {dateFilter && (
          <Button
            variant='ghost'
            size='sm'
            className='self-start'
            onClick={() => {
              setDateFilter(undefined);
              resetPage();
            }}
          >
            Clear date
          </Button>
        )}
      </div>

      {/* Logs Table */}
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='text-base'>
            {meta != null
              ? `${meta.total} ${meta.total === 1 ? 'entry' : 'entries'} found`
              : 'Activity logs'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='space-y-3'>
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className='h-12 w-full' />
              ))}
            </div>
          ) : isError ? (
            <div className='py-12 text-center'>
              <Activity className='mx-auto mb-3 h-10 w-10 text-muted-foreground dark:text-muted-foreground/60' />
              <p className='text-sm text-muted-foreground'>
                Failed to load activity logs. Please try again.
              </p>
            </div>
          ) : logs.length === 0 ? (
            <div className='py-12 text-center'>
              <Activity className='mx-auto mb-3 h-10 w-10 text-muted-foreground dark:text-muted-foreground/60' />
              <p className='text-sm text-muted-foreground'>No activity logs found.</p>
            </div>
          ) : (
            <>
              <div className='space-y-3 md:hidden'>
                {logs.map((log, i) => {
                  const config = categoryConfig[log.category];
                  const Icon = config.icon;
                  return (
                    <motion.div
                      key={log._id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className='rounded-lg border border-border p-3'
                    >
                      <div className='flex items-start justify-between gap-2'>
                        <div className='min-w-0'>
                          <p className='truncate text-sm font-medium'>{log.actorName}</p>
                          <p className='mt-0.5 text-xs text-muted-foreground'>{log.actorRole}</p>
                          <p className='mt-1 text-xs text-muted-foreground'>
                            {format(parseLocalTimestamp(log.timestamp), "MMM dd, yyyy 'at' hh:mm a")}
                          </p>
                        </div>
                        <Badge variant='outline' className={config.color}>
                          {config.label}
                        </Badge>
                      </div>
                      <div className='mt-3 flex items-start gap-2'>
                        <div className={cn('mt-0.5 rounded-md p-1.5', config.color.split(' ')[0])}>
                          <Icon size={14} className={config.color.split(' ').slice(1).join(' ')} />
                        </div>
                        <p className='text-sm leading-snug'>{log.action}</p>
                      </div>
                      <div className='mt-2 space-y-0.5'>
                        {(log.city ?? log.country) && (
                          <p className='text-xs text-muted-foreground'>
                            {[log.city, log.country].filter(Boolean).join(', ')}
                          </p>
                        )}
                        {log.ipAddress && (
                          <p className='font-mono text-xs text-muted-foreground'>{log.ipAddress}</p>
                        )}
                        <p className='text-xs text-muted-foreground'>{parseUserAgent(log.userAgent)}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <div className='hidden overflow-x-auto md:block'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Origin</TableHead>
                      <TableHead>Device</TableHead>
                      <TableHead>Date & Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log, i) => {
                      const config = categoryConfig[log.category];
                      const Icon = config.icon;
                      return (
                        <motion.tr
                          key={log._id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className='border-b transition-colors hover:bg-muted/50'
                        >
                          <TableCell className='font-medium whitespace-nowrap'>
                            {log.actorName}
                          </TableCell>
                          <TableCell className='max-w-[300px]'>
                            <div className='flex items-center gap-2'>
                              <div className={cn('rounded-md p-1.5', config.color.split(' ')[0])}>
                                <Icon
                                  size={14}
                                  className={config.color.split(' ').slice(1).join(' ')}
                                />
                              </div>
                              <span className='text-sm'>{log.action}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant='outline' className={config.color}>
                              {config.label}
                            </Badge>
                          </TableCell>
                          <TableCell className='whitespace-nowrap text-sm text-muted-foreground'>
                            {log.actorRole}
                          </TableCell>
                          <TableCell className='text-sm text-muted-foreground'>
                            <div className='space-y-0.5'>
                              <p>{[log.city, log.country].filter(Boolean).join(', ') || '—'}</p>
                              {log.ipAddress && (
                                <p className='font-mono text-xs'>{log.ipAddress}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className='whitespace-nowrap text-sm text-muted-foreground'>
                            {parseUserAgent(log.userAgent)}
                          </TableCell>
                          <TableCell className='whitespace-nowrap text-sm text-muted-foreground'>
                            {format(parseLocalTimestamp(log.timestamp), "MMM dd, yyyy 'at' hh:mm a")}
                          </TableCell>
                        </motion.tr>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {meta && (
                <PaginationControls
                  meta={meta}
                  onPageChange={setPage}
                  hideWhenSinglePage={false}
                  className='mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'
                  labelClassName='text-xs text-muted-foreground'
                  label={`Showing ${paginationRange.from}–${paginationRange.to} of ${meta.total}`}
                  controlsClassName='flex gap-1 self-end sm:self-auto'
                  buttonClassName='h-8 w-8'
                />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivityLogs;

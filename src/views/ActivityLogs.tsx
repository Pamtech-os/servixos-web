'use client';

import { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Activity,
  Users,
  Briefcase,
  FileText,
  CreditCard,
  Settings,
  LogIn,
  Shield,
  CalendarIcon,
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

interface ActivityLog {
  id: string;
  user: string;
  role: 'owner' | 'admin' | 'employee';
  action: string;
  category: 'auth' | 'client' | 'job' | 'invoice' | 'payment' | 'settings' | 'role';
  timestamp: string;
}

const ITEMS_PER_PAGE = 10;

const categoryConfig: Record<
  ActivityLog['category'],
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
};

const roleColor = (role: ActivityLog['role']) => {
  switch (role) {
    case 'owner':
      return 'bg-primary/10 text-primary border-primary/20';
    case 'admin':
      return 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20';
    case 'employee':
      return 'bg-muted text-muted-foreground border-border';
  }
};

const mockLogs: ActivityLog[] = [
  {
    id: 'log1',
    user: 'John Doe (Owner)',
    role: 'owner',
    action: 'Logged into the system',
    category: 'auth',
    timestamp: '2024-04-22T14:30:00',
  },
  {
    id: 'log2',
    user: 'John Doe (Owner)',
    role: 'owner',
    action: 'Updated business profile in Settings',
    category: 'settings',
    timestamp: '2024-04-22T14:25:00',
  },
  {
    id: 'log3',
    user: 'Jane Smith',
    role: 'admin',
    action: "Created new client 'Benjamin Lee'",
    category: 'client',
    timestamp: '2024-04-22T13:45:00',
  },
  {
    id: 'log4',
    user: 'Mike Johnson',
    role: 'employee',
    action: "Started job 'Cloud Migration' for Olivia Davis",
    category: 'job',
    timestamp: '2024-04-22T12:00:00',
  },
  {
    id: 'log5',
    user: 'John Doe (Owner)',
    role: 'owner',
    action: 'Recorded payment of $3,500 from Sarah Johnson',
    category: 'payment',
    timestamp: '2024-04-22T11:30:00',
  },
  {
    id: 'log6',
    user: 'Jane Smith',
    role: 'admin',
    action: 'Sent invoice INV-007 to Olivia Davis',
    category: 'invoice',
    timestamp: '2024-04-22T10:15:00',
  },
  {
    id: 'log7',
    user: 'Mike Johnson',
    role: 'employee',
    action: "Completed job 'Website Redesign' for Sarah Johnson",
    category: 'job',
    timestamp: '2024-04-21T16:45:00',
  },
  {
    id: 'log8',
    user: 'John Doe (Owner)',
    role: 'owner',
    action: "Assigned 'Admin' role to Jane Smith",
    category: 'role',
    timestamp: '2024-04-21T15:30:00',
  },
  {
    id: 'log9',
    user: 'Jane Smith',
    role: 'admin',
    action: "Updated client Emma Williams' contact info",
    category: 'client',
    timestamp: '2024-04-21T14:00:00',
  },
  {
    id: 'log10',
    user: 'John Doe (Owner)',
    role: 'owner',
    action: 'Received payment of $4,100 from Emma Williams',
    category: 'payment',
    timestamp: '2024-04-21T12:30:00',
  },
  {
    id: 'log11',
    user: 'Mike Johnson',
    role: 'employee',
    action: "Created new job 'SEO Optimization' for Sarah Johnson",
    category: 'job',
    timestamp: '2024-04-21T10:00:00',
  },
  {
    id: 'log12',
    user: 'Jane Smith',
    role: 'admin',
    action: 'Generated invoice INV-010 for Sophia Martinez',
    category: 'invoice',
    timestamp: '2024-04-20T16:00:00',
  },
  {
    id: 'log13',
    user: 'John Doe (Owner)',
    role: 'owner',
    action: 'Updated notification preferences',
    category: 'settings',
    timestamp: '2024-04-20T14:30:00',
  },
  {
    id: 'log14',
    user: 'Mike Johnson',
    role: 'employee',
    action: 'Logged into the system',
    category: 'auth',
    timestamp: '2024-04-20T09:00:00',
  },
  {
    id: 'log15',
    user: 'Jane Smith',
    role: 'admin',
    action: 'Deleted client William Garcia',
    category: 'client',
    timestamp: '2024-04-19T17:00:00',
  },
  {
    id: 'log16',
    user: 'John Doe (Owner)',
    role: 'owner',
    action: 'Marked payment from Michael Chen as partial',
    category: 'payment',
    timestamp: '2024-04-19T15:00:00',
  },
  {
    id: 'log17',
    user: 'Mike Johnson',
    role: 'employee',
    action: "Started job 'Mobile App Development' for Michael Chen",
    category: 'job',
    timestamp: '2024-04-19T11:30:00',
  },
  {
    id: 'log18',
    user: 'John Doe (Owner)',
    role: 'owner',
    action: 'Changed account password',
    category: 'settings',
    timestamp: '2024-04-18T16:00:00',
  },
  {
    id: 'log19',
    user: 'Jane Smith',
    role: 'admin',
    action: "Created new client 'James Brown'",
    category: 'client',
    timestamp: '2024-04-18T10:45:00',
  },
  {
    id: 'log20',
    user: 'John Doe (Owner)',
    role: 'owner',
    action: "Removed 'Employee' role from Alex Turner",
    category: 'role',
    timestamp: '2024-04-17T14:00:00',
  },
];

const ActivityLogs = () => {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLogs(mockLogs);
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return logs.filter((log) => {
      const matchSearch =
        log.user.toLowerCase().includes(q) || log.action.toLowerCase().includes(q);
      const matchCategory = categoryFilter === 'all' || log.category === categoryFilter;
      const matchRole = roleFilter === 'all' || log.role === roleFilter;
      const matchDate = !dateFilter || log.timestamp.startsWith(format(dateFilter, 'yyyy-MM-dd'));
      return matchSearch && matchCategory && matchRole && matchDate;
    });
  }, [logs, search, categoryFilter, roleFilter, dateFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

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
        <div className='relative flex-1 max-w-sm'>
          <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            placeholder='Search logs...'
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className='pl-9'
          />
        </div>
        <Select
          value={categoryFilter}
          onValueChange={(v) => {
            setCategoryFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className='w-[150px]'>
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
          </SelectContent>
        </Select>
        <Select
          value={roleFilter}
          onValueChange={(v) => {
            setRoleFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className='w-[140px]'>
            <SelectValue placeholder='All Roles' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Roles</SelectItem>
            <SelectItem value='owner'>Owner</SelectItem>
            <SelectItem value='admin'>Admin</SelectItem>
            <SelectItem value='employee'>Employee</SelectItem>
          </SelectContent>
        </Select>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant='outline'
              className={cn(
                'w-[160px] justify-start text-left font-normal',
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
                setPage(1);
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
            onClick={() => {
              setDateFilter(undefined);
              setPage(1);
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
            {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'} found
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className='space-y-3'>
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className='h-12 w-full' />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className='py-12 text-center'>
              <Activity className='mx-auto mb-3 h-10 w-10 text-muted-foreground/40' />
              <p className='text-sm text-muted-foreground'>No activity logs found.</p>
            </div>
          ) : (
            <>
              <div className='overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Date & Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginated.map((log, i) => {
                      const config = categoryConfig[log.category];
                      const Icon = config.icon;
                      return (
                        <motion.tr
                          key={log.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className='border-b transition-colors hover:bg-muted/50'
                        >
                          <TableCell className='font-medium whitespace-nowrap'>
                            {log.user}
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
                          <TableCell>
                            <Badge variant='outline' className={roleColor(log.role)}>
                              {log.role.charAt(0).toUpperCase() + log.role.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className='whitespace-nowrap text-sm text-muted-foreground'>
                            {format(new Date(log.timestamp), "MMM dd, yyyy 'at' hh:mm a")}
                          </TableCell>
                        </motion.tr>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className='mt-4 flex items-center justify-between'>
                <p className='text-xs text-muted-foreground'>
                  Showing {(page - 1) * ITEMS_PER_PAGE + 1}–
                  {Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
                </p>
                <div className='flex gap-1'>
                  <Button
                    size='icon'
                    variant='outline'
                    className='h-8 w-8'
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft size={16} />
                  </Button>
                  <Button
                    size='icon'
                    variant='outline'
                    className='h-8 w-8'
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivityLogs;

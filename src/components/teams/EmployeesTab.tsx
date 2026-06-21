'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  Plus,
  Search,
  Mail,
  Phone,
  ShieldCheck,
  Eye,
  Pencil,
  Trash2,
  Loader2,
  CalendarIcon,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import PaginationControls from '@/components/ui/pagination-controls';
import ConfirmModal from '@/components/ConfirmModal';
import { useEmployees } from '@/hooks/queries/use-employees';
import { useRoles } from '@/hooks/queries/use-roles';
import {
  useCreateEmployee,
  useDeleteEmployee,
  useUpdateEmployee,
} from '@/hooks/mutations/use-employees';
import { toast } from '@/components/ui/sonner';
import { getApiErrorMessage } from '@/common/network/http-client';
import type { Employee } from '@/lib/api-client';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 5;

type EmployeeForm = {
  fullName: string;
  email: string;
  phone: string;
  roleId: string;
  weeklyHoursTarget: string;
  dateJoined: string;
};

const EMPTY_FORM: EmployeeForm = {
  fullName: '',
  email: '',
  phone: '',
  roleId: '',
  weeklyHoursTarget: '40',
  dateJoined: '',
};

function getInitials(fullName: string): string {
  return fullName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

function formatDate(value?: string): string {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleDateString();
}

function parseDateInputValue(value: string): Date | undefined {
  if (!value) return undefined;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return undefined;

  const parsed = new Date(year, month - 1, day);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed;
}

const EmployeesTab = () => {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState<Employee | null>(null);
  const [showDetail, setShowDetail] = useState<Employee | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [form, setForm] = useState<EmployeeForm>(EMPTY_FORM);

  const employeesQuery = useEmployees({
    search: search || undefined,
    roleId: roleFilter !== 'all' ? roleFilter : undefined,
    page,
    limit: PAGE_SIZE,
  });
  const rolesQuery = useRoles();

  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();
  const deleteEmployee = useDeleteEmployee();

  const employees = employeesQuery.data?.data ?? [];
  const paginationMeta =
    employeesQuery.data?.meta ?? {
      page: 1,
      limit: PAGE_SIZE,
      total: 0,
      totalPages: 0,
    };
  const roleList = useMemo(() => rolesQuery.data ?? [], [rolesQuery.data]);

  const roleNameById = useMemo(
    () => Object.fromEntries(roleList.map((role) => [role._id, role.name])),
    [roleList]
  );

  useEffect(() => {
    if (page !== paginationMeta.page) {
      setPage(paginationMeta.page);
    }
  }, [page, paginationMeta.page]);

  const isSubmitting = createEmployee.isPending || updateEmployee.isPending;

  const resetForm = () => setForm(EMPTY_FORM);

  const openAddDialog = () => {
    resetForm();
    setShowAdd(true);
  };

  const openEditDialog = (employee: Employee) => {
    setForm({
      fullName: employee.fullName,
      email: employee.email,
      phone: employee.phone ?? '',
      roleId: employee.roleId,
      weeklyHoursTarget: String(employee.weeklyHoursTarget),
      dateJoined: employee.dateJoined ? employee.dateJoined.split('T')[0] : '',
    });
    setShowEdit(employee);
  };

  const validateForm = (): { weeklyHoursTarget: number } | null => {
    if (!form.fullName.trim() || !form.email.trim() || !form.roleId) {
      toast.error('Please fill in all required fields.');
      return null;
    }

    const weeklyHoursTarget = Number(form.weeklyHoursTarget);
    if (!Number.isFinite(weeklyHoursTarget) || weeklyHoursTarget < 1 || weeklyHoursTarget > 168) {
      toast.error('Weekly hours target must be between 1 and 168.');
      return null;
    }

    return { weeklyHoursTarget };
  };

  const handleCreate = () => {
    const parsed = validateForm();
    if (!parsed) return;

    createEmployee.mutate(
      {
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim() || undefined,
        roleId: form.roleId,
        weeklyHoursTarget: parsed.weeklyHoursTarget,
        dateJoined: form.dateJoined || undefined,
      },
      {
        onSuccess: (employee) => {
          toast.success('Employee created', {
            description: `${employee.fullName} has been invited successfully.`,
          });
          setShowAdd(false);
          resetForm();
          setPage(1);
        },
        onError: (err) => {
          toast.error('Failed to create employee', { description: getApiErrorMessage(err) });
        },
      }
    );
  };

  const handleUpdate = () => {
    if (!showEdit) return;
    const parsed = validateForm();
    if (!parsed) return;

    updateEmployee.mutate(
      {
        id: showEdit._id,
        input: {
          fullName: form.fullName.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim() || undefined,
          roleId: form.roleId,
          weeklyHoursTarget: parsed.weeklyHoursTarget,
          dateJoined: form.dateJoined || undefined,
        },
      },
      {
        onSuccess: (employee) => {
          toast.success('Employee updated', {
            description: `${employee.fullName}'s details were updated.`,
          });
          setShowEdit(null);
          if (showDetail?._id === employee._id) {
            setShowDetail(employee);
          }
        },
        onError: (err) => {
          toast.error('Failed to update employee', { description: getApiErrorMessage(err) });
        },
      }
    );
  };

  const handleDelete = () => {
    if (!deleteTarget) return;

    deleteEmployee.mutate(deleteTarget._id, {
      onSuccess: () => {
        toast.success('Employee deleted', {
          description: `${deleteTarget.fullName} has been removed from your team.`,
        });
        if (showDetail?._id === deleteTarget._id) {
          setShowDetail(null);
        }
        setDeleteTarget(null);
      },
      onError: (err) => {
        toast.error('Failed to delete employee', { description: getApiErrorMessage(err) });
      },
    });
  };

  return (
    <div className='mt-4 space-y-4'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex w-full flex-col gap-3 sm:flex-row sm:items-center'>
          <div className='relative w-full flex-1 sm:max-w-xs'>
            <Search
              size={16}
              className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground'
            />
            <Input
              placeholder='Search employees...'
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className='pl-9'
            />
          </div>
          <Select
            value={roleFilter}
            onValueChange={(value) => {
              setRoleFilter(value);
              setPage(1);
            }}
          >
            <SelectTrigger className='w-full sm:w-48'>
              <SelectValue placeholder='Filter by role' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All roles</SelectItem>
              {roleList.map((role) => (
                <SelectItem key={role._id} value={role._id}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button size='sm' className='gap-1.5' onClick={openAddDialog}>
          <Plus size={14} /> Add Employee
        </Button>
      </div>

      {employeesQuery.isLoading ? (
        <div className='space-y-3'>
          {[...Array(4)].map((_, index) => (
            <Card key={index}>
              <CardContent className='flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between'>
                <div className='flex items-center gap-3'>
                  <Skeleton className='h-10 w-10 rounded-full' />
                  <div className='space-y-1.5'>
                    <Skeleton className='h-4 w-32' />
                    <Skeleton className='h-3 w-44' />
                  </div>
                </div>
                <div className='flex items-center gap-2'>
                  <Skeleton className='h-6 w-20 rounded-md' />
                  <Skeleton className='h-8 w-8 rounded-md' />
                  <Skeleton className='h-8 w-8 rounded-md' />
                  <Skeleton className='h-8 w-8 rounded-md' />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className='space-y-3'>
            {employees.map((employee, index) => (
              <motion.div
                key={employee._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
              >
                <Card className='transition-shadow hover:shadow-md'>
                  <CardContent className='flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between'>
                    <div className='flex items-center gap-3'>
                      <div className='gradient-bg flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-primary-foreground'>
                        {getInitials(employee.fullName)}
                      </div>
                      <div className='min-w-0'>
                        <p className='font-medium'>{employee.fullName}</p>
                        <div className='flex flex-wrap items-center gap-2 text-xs text-muted-foreground'>
                          <span className='flex items-center gap-1'>
                            <Mail size={12} />{' '}
                            <span className='truncate'>{employee.email}</span>
                          </span>
                          {employee.phone && (
                            <span className='flex items-center gap-1'>
                              <Phone size={12} /> {employee.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Badge variant='outline' className='gap-1'>
                        <ShieldCheck size={12} /> {roleNameById[employee.roleId] ?? 'Unknown role'}
                      </Badge>
                      <Button
                        size='icon'
                        variant='ghost'
                        onClick={() => setShowDetail(employee)}
                        title='View employee'
                      >
                        <Eye size={14} />
                      </Button>
                      <Button
                        size='icon'
                        variant='ghost'
                        onClick={() => openEditDialog(employee)}
                        title='Edit employee'
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        size='icon'
                        variant='ghost'
                        className='text-destructive hover:text-destructive'
                        onClick={() => setDeleteTarget(employee)}
                        title='Delete employee'
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
            {employees.length === 0 && (
              <p className='py-8 text-center text-sm text-muted-foreground'>No employees found.</p>
            )}
          </div>

          <PaginationControls
            meta={paginationMeta}
            onPageChange={setPage}
            layout='centered'
            className='pt-2'
            buttonSize='sm'
          />
        </>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className='max-h-[90dvh] overflow-y-auto sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
          </DialogHeader>
          <div className='space-y-4'>
            <div>
              <Label>Full Name *</Label>
              <Input
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder='John Doe'
              />
            </div>
            <div>
              <Label>Email *</Label>
              <Input
                type='email'
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder='john@servix.com'
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder='+1 555-0000'
              />
            </div>
            <div>
              <Label>Role *</Label>
              <Select value={form.roleId} onValueChange={(value) => setForm({ ...form, roleId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder='Select role' />
                </SelectTrigger>
                <SelectContent>
                  {roleList.map((role) => (
                    <SelectItem key={role._id} value={role._id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Weekly Hours Target *</Label>
              <Input
                type='number'
                min={1}
                max={168}
                value={form.weeklyHoursTarget}
                onChange={(e) => setForm({ ...form, weeklyHoursTarget: e.target.value })}
              />
            </div>
            <div>
              <Label>Date Joined</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant='outline'
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !form.dateJoined && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className='mr-2 h-4 w-4' />
                    {form.dateJoined ? (
                      format(parseDateInputValue(form.dateJoined) ?? new Date(), 'PPP')
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0' align='start'>
                  <Calendar
                    mode='single'
                    selected={parseDateInputValue(form.dateJoined)}
                    onSelect={(date) =>
                      setForm((prev) => ({
                        ...prev,
                        dateJoined: date ? format(date, 'yyyy-MM-dd') : '',
                      }))
                    }
                    initialFocus
                    className={cn('pointer-events-auto p-3')}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <p className='rounded-lg border border-border bg-muted/50 p-3 text-xs text-muted-foreground'>
              An invite email will be sent to the employee with account setup instructions.
            </p>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setShowAdd(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isSubmitting || rolesQuery.isLoading || roleList.length === 0}>
              {isSubmitting ? <Loader2 size={14} className='mr-1 animate-spin' /> : null}
              Add Employee
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showEdit} onOpenChange={(open) => !open && setShowEdit(null)}>
        <DialogContent className='max-h-[90dvh] overflow-y-auto sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
          </DialogHeader>
          <div className='space-y-4'>
            <div>
              <Label>Full Name *</Label>
              <Input
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder='John Doe'
              />
            </div>
            <div>
              <Label>Email *</Label>
              <Input
                type='email'
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder='john@servix.com'
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder='+1 555-0000'
              />
            </div>
            <div>
              <Label>Role *</Label>
              <Select value={form.roleId} onValueChange={(value) => setForm({ ...form, roleId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder='Select role' />
                </SelectTrigger>
                <SelectContent>
                  {roleList.map((role) => (
                    <SelectItem key={role._id} value={role._id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Weekly Hours Target *</Label>
              <Input
                type='number'
                min={1}
                max={168}
                value={form.weeklyHoursTarget}
                onChange={(e) => setForm({ ...form, weeklyHoursTarget: e.target.value })}
              />
            </div>
            <div>
              <Label>Date Joined</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant='outline'
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !form.dateJoined && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className='mr-2 h-4 w-4' />
                    {form.dateJoined ? (
                      format(parseDateInputValue(form.dateJoined) ?? new Date(), 'PPP')
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0' align='start'>
                  <Calendar
                    mode='single'
                    selected={parseDateInputValue(form.dateJoined)}
                    onSelect={(date) =>
                      setForm((prev) => ({
                        ...prev,
                        dateJoined: date ? format(date, 'yyyy-MM-dd') : '',
                      }))
                    }
                    initialFocus
                    className={cn('pointer-events-auto p-3')}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setShowEdit(null)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={isSubmitting || rolesQuery.isLoading || roleList.length === 0}>
              {isSubmitting ? <Loader2 size={14} className='mr-1 animate-spin' /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showDetail} onOpenChange={(open) => !open && setShowDetail(null)}>
        <DialogContent className='max-h-[90dvh] overflow-y-auto sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>Employee Details</DialogTitle>
          </DialogHeader>
          {showDetail && (
            <div className='space-y-4'>
              <div className='flex items-center gap-4'>
                <div className='gradient-bg flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold text-primary-foreground'>
                  {getInitials(showDetail.fullName)}
                </div>
                <div>
                  <h3 className='font-display text-lg font-bold'>{showDetail.fullName}</h3>
                  <Badge variant='outline'>
                    {roleNameById[showDetail.roleId] ?? 'Unknown role'}
                  </Badge>
                </div>
              </div>
              <div className='grid grid-cols-1 gap-3 rounded-lg border border-border p-4 sm:grid-cols-2'>
                <div>
                  <p className='text-xs text-muted-foreground'>Email</p>
                  <p className='text-sm font-medium'>{showDetail.email}</p>
                </div>
                <div>
                  <p className='text-xs text-muted-foreground'>Phone</p>
                  <p className='text-sm font-medium'>{showDetail.phone ?? '—'}</p>
                </div>
                <div>
                  <p className='text-xs text-muted-foreground'>Date Joined</p>
                  <p className='text-sm font-medium'>{formatDate(showDetail.dateJoined)}</p>
                </div>
                <div>
                  <p className='text-xs text-muted-foreground'>Weekly Hours Target</p>
                  <p className='text-sm font-medium'>{showDetail.weeklyHoursTarget}h</p>
                </div>
              </div>
              <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
                <Button
                  variant='outline'
                  onClick={() => {
                    setShowDetail(null);
                    openEditDialog(showDetail);
                  }}
                >
                  Edit Employee
                </Button>
                <Button
                  variant='outline'
                  onClick={() => {
                    setShowDetail(null);
                    router.push(`/teams/clock-history/${showDetail._id}`);
                  }}
                >
                  View Clock History
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmModal
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title='Delete Employee'
        description={`Are you sure you want to remove "${deleteTarget?.fullName}"? This action cannot be undone.`}
        confirmLabel='Delete'
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default EmployeesTab;

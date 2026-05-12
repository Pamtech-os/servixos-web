'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/sonner';
import { useSchedules } from '@/hooks/queries/use-schedules';
import { useCreateShift, useDeleteShift } from '@/hooks/mutations/use-schedules';
import { useEmployees } from '@/hooks/queries/use-employees';
import { getApiErrorMessage } from '@/common/network/http-client';
import type { Shift } from '@/lib/api-client';

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function toLocalDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function resolveEmployeeId(s: Shift): string {
  return typeof s.employeeId === 'string' ? s.employeeId : s.employeeId._id;
}

function resolveEmployeeName(s: Shift): string | undefined {
  return typeof s.employeeId === 'object' ? s.employeeId.fullName : undefined;
}

const TIME_SLOTS = Array.from({ length: 10 }, (_, i) => {
  const hour = i + 8;
  const label = hour < 12 ? `${hour}:00 AM` : hour === 12 ? '12:00 PM' : `${hour - 12}:00 PM`;
  return { hour, label };
});

const COLORS = [
  'bg-primary/15 text-primary border-primary/30',
  'bg-secondary/15 text-secondary border-secondary/30',
  'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
  'bg-amber-500/15 text-amber-600 border-amber-500/30',
  'bg-violet-500/15 text-violet-600 border-violet-500/30',
  'bg-rose-500/15 text-rose-600 border-rose-500/30',
];

function getWeekMonday(date = new Date()): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return toLocalDate(d);
}

function addWeeks(mondayStr: string, delta: number): string {
  const d = new Date(mondayStr + 'T00:00:00');
  d.setDate(d.getDate() + delta * 7);
  return toLocalDate(d);
}

function getWeekDates(mondayStr: string): string[] {
  const monday = new Date(mondayStr + 'T00:00:00');
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return toLocalDate(d);
  });
}

function shiftColumnIndex(shiftDate: string, mondayStr: string): number {
  const s = new Date(shiftDate.slice(0, 10) + 'T00:00:00');
  const m = new Date(mondayStr + 'T00:00:00');
  return Math.round((s.getTime() - m.getTime()) / 86400000);
}

function parseHour(time: string): number {
  return parseInt(time.split(':')[0], 10);
}

function formatWeekRange(mondayStr: string): string {
  const monday = new Date(mondayStr + 'T00:00:00');
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(monday)} – ${fmt(sunday)}`;
}

const SchedulingTab = () => {
  const [weekMonday, setWeekMonday] = useState(getWeekMonday);
  const [showAdd, setShowAdd] = useState(false);
  const [showDetail, setShowDetail] = useState<Shift | null>(null);
  const [form, setForm] = useState({
    employeeId: '',
    dayOffset: '',
    startTime: '',
    endTime: '',
    notes: '',
  });

  const { data: scheduleData, isLoading } = useSchedules({ weekStartDate: weekMonday });
  const { data: employeesData } = useEmployees({ limit: 50 });
  const createShift = useCreateShift();
  const deleteShift = useDeleteShift();

  const shifts = scheduleData?.data ?? [];
  const employeeList = employeesData?.data ?? [];
  const weekDates = getWeekDates(weekMonday);

  const empColorMap: Record<string, string> = {};
  employeeList.forEach((e, i) => {
    empColorMap[e._id] = COLORS[i % COLORS.length];
  });
  shifts.forEach((s) => {
    const id = resolveEmployeeId(s);
    if (!empColorMap[id]) empColorMap[id] = COLORS[Object.keys(empColorMap).length % COLORS.length];
  });

  function getShiftsForCell(colIndex: number, hour: number): Shift[] {
    return shifts.filter((s) => {
      const col = shiftColumnIndex(s.shiftDate, weekMonday);
      const startHour = parseHour(s.startTime);
      const endHour = parseHour(s.endTime);
      return col === colIndex && hour >= startHour && hour < endHour;
    });
  }

  async function handleAdd() {
    if (!form.employeeId || form.dayOffset === '' || !form.startTime || !form.endTime) {
      toast.error('Please fill all required fields.');
      return;
    }
    const shiftDate = weekDates[parseInt(form.dayOffset, 10)];
    try {
      await createShift.mutateAsync({
        employeeId: form.employeeId,
        shiftDate,
        startTime: form.startTime,
        endTime: form.endTime,
        notes: form.notes || undefined,
      });
      setForm({ employeeId: '', dayOffset: '', startTime: '', endTime: '', notes: '' });
      setShowAdd(false);
      toast.success('Shift added.');
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteShift.mutateAsync(id);
      setShowDetail(null);
      toast.success('Shift deleted.');
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  const detailEmployee = showDetail
    ? employeeList.find((e) => e._id === resolveEmployeeId(showDetail))
    : null;

  return (
    <div className='mt-4 space-y-4'>
      <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
        <h3 className='font-display text-lg font-semibold'>Weekly Schedule</h3>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size='icon'
            className='h-8 w-8'
            onClick={() => setWeekMonday((m) => addWeeks(m, -1))}
          >
            <ChevronLeft size={16} />
          </Button>
          <span className='min-w-[140px] text-center text-sm font-medium'>
            {formatWeekRange(weekMonday)}
          </span>
          <Button
            variant='outline'
            size='icon'
            className='h-8 w-8'
            onClick={() => setWeekMonday((m) => addWeeks(m, 1))}
          >
            <ChevronRight size={16} />
          </Button>
          <Button size='sm' className='ml-2 gap-1.5' onClick={() => setShowAdd(true)}>
            <Plus size={14} /> Add Shift
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className='overflow-x-auto p-0'>
          <div className='min-w-[760px] sm:min-w-[900px]'>
            {/* Header */}
            <div className='grid grid-cols-8 border-b border-border'>
              <div className='border-r border-border p-3 text-xs font-semibold text-muted-foreground'>
                Time
              </div>
              {DAY_NAMES.map((name, i) => {
                const d = new Date(weekDates[i] + 'T00:00:00');
                return (
                  <div
                    key={name}
                    className='border-r border-border p-3 text-center last:border-r-0'
                  >
                    <div className='text-xs font-semibold'>{name}</div>
                    <div className='text-[11px] text-muted-foreground'>
                      {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Body */}
            {isLoading ? (
              <div className='py-12 text-center text-sm text-muted-foreground'>
                Loading schedule&hellip;
              </div>
            ) : (
              TIME_SLOTS.map(({ hour, label }) => (
                <div key={hour} className='grid grid-cols-8 border-b border-border last:border-b-0'>
                  <div className='flex items-center border-r border-border px-3 py-2 text-xs text-muted-foreground'>
                    {label}
                  </div>
                  {DAY_NAMES.map((_, colIndex) => {
                    const cellShifts = getShiftsForCell(colIndex, hour);
                    return (
                      <div
                        key={colIndex}
                        className='min-h-[48px] border-r border-border p-1 last:border-r-0'
                      >
                        {cellShifts.map(
                          (s) =>
                            parseHour(s.startTime) === hour && (
                              <button
                                key={s._id}
                                onClick={() => setShowDetail(s)}
                                className={`w-full rounded-md border px-2 py-1 text-left text-[11px] font-medium transition-all hover:opacity-80 ${
                                  empColorMap[resolveEmployeeId(s)] ?? COLORS[0]
                                }`}
                              >
                                {(
                                  resolveEmployeeName(s) ??
                                  employeeList.find((e) => e._id === resolveEmployeeId(s))?.fullName
                                )?.split(' ')[0] ?? '—'}
                              </button>
                            )
                        )}
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Shift Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className='max-h-[90dvh] overflow-y-auto sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Add Shift</DialogTitle>
          </DialogHeader>
          <div className='space-y-4'>
            <div>
              <Label>Employee *</Label>
              <Select
                value={form.employeeId}
                onValueChange={(v) => setForm({ ...form, employeeId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select employee' />
                </SelectTrigger>
                <SelectContent>
                  {employeeList.map((e) => (
                    <SelectItem key={e._id} value={e._id}>
                      {e.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Day *</Label>
              <Select
                value={form.dayOffset}
                onValueChange={(v) => setForm({ ...form, dayOffset: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select day' />
                </SelectTrigger>
                <SelectContent>
                  {DAY_NAMES.map((name, i) => {
                    const d = new Date(weekDates[i] + 'T00:00:00');
                    return (
                      <SelectItem key={i} value={String(i)}>
                        {name} — {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
              <div>
                <Label>Start Time *</Label>
                <Input
                  type='time'
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                />
              </div>
              <div>
                <Label>End Time *</Label>
                <Input
                  type='time'
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder='Shift notes&hellip;'
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={createShift.isPending}>
              {createShift.isPending ? 'Saving…' : 'Add Shift'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Shift Detail Dialog */}
      <Dialog open={!!showDetail} onOpenChange={(open) => !open && setShowDetail(null)}>
        <DialogContent className='max-h-[90dvh] overflow-y-auto sm:max-w-sm'>
          <DialogHeader>
            <DialogTitle>Shift Details</DialogTitle>
          </DialogHeader>
          {showDetail && (
            <div className='space-y-3'>
              <div className='space-y-2 rounded-lg border border-border p-4'>
                <div>
                  <p className='text-xs text-muted-foreground'>Employee</p>
                  <p className='font-medium'>
                    {detailEmployee?.fullName ?? resolveEmployeeName(showDetail) ?? resolveEmployeeId(showDetail)}
                  </p>
                </div>
                <div>
                  <p className='text-xs text-muted-foreground'>Date</p>
                  <p className='font-medium'>
                    {new Date(showDetail.shiftDate.slice(0, 10) + 'T00:00:00').toLocaleDateString(
                      'en-US',
                      {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                      }
                    )}
                  </p>
                </div>
                <div className='flex flex-col gap-2 sm:flex-row sm:gap-4'>
                  <div>
                    <p className='text-xs text-muted-foreground'>Start</p>
                    <p className='font-medium'>{showDetail.startTime}</p>
                  </div>
                  <div>
                    <p className='text-xs text-muted-foreground'>End</p>
                    <p className='font-medium'>{showDetail.endTime}</p>
                  </div>
                </div>
                {showDetail.notes && (
                  <div>
                    <p className='text-xs text-muted-foreground'>Notes</p>
                    <p className='text-sm'>{showDetail.notes}</p>
                  </div>
                )}
              </div>
              <Button
                variant='destructive'
                size='sm'
                className='w-full gap-2'
                onClick={() => handleDelete(showDetail._id)}
                disabled={deleteShift.isPending}
              >
                <Trash2 size={14} />
                {deleteShift.isPending ? 'Deleting…' : 'Delete Shift'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SchedulingTab;

import { useState } from 'react';
import { Plus } from 'lucide-react';
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
import { mockShifts, mockEmployees, days, timeSlots, Shift } from '@/lib/team-mock-data';
import { toast } from 'sonner';

const parseTime = (t: string): number => {
  const [h] = t.split(':').map(Number);
  return h;
};

const SchedulingTab = () => {
  const [shifts, setShifts] = useState<Shift[]>(mockShifts);
  const [showAdd, setShowAdd] = useState(false);
  const [showDetail, setShowDetail] = useState<Shift | null>(null);
  const [form, setForm] = useState({
    employeeId: '',
    day: '',
    startTime: '',
    endTime: '',
    notes: '',
  });

  const getShiftsForSlot = (day: string, hour: number) =>
    shifts.filter((s) => {
      const start = parseTime(s.startTime);
      const end = parseTime(s.endTime);
      return s.day === day && hour >= start && hour < end;
    });

  const handleAdd = () => {
    if (!form.employeeId || !form.day || !form.startTime || !form.endTime) {
      toast.error('Please fill all required fields.');
      return;
    }
    const emp = mockEmployees.find((e) => e.id === form.employeeId);
    const newShift: Shift = {
      id: `sh${Date.now()}`,
      employeeId: form.employeeId,
      employeeName: emp?.fullName || 'Unknown',
      day: form.day,
      startTime: form.startTime,
      endTime: form.endTime,
      notes: form.notes,
    };
    setShifts((prev) => [...prev, newShift]);
    setForm({ employeeId: '', day: '', startTime: '', endTime: '', notes: '' });
    setShowAdd(false);
    toast.success('Shift added successfully!');
  };

  const colors = [
    'bg-primary/15 text-primary border-primary/30',
    'bg-secondary/15 text-secondary border-secondary/30',
    'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
    'bg-amber-500/15 text-amber-600 border-amber-500/30',
    'bg-violet-500/15 text-violet-600 border-violet-500/30',
    'bg-rose-500/15 text-rose-600 border-rose-500/30',
  ];
  const empColorMap: Record<string, string> = {};
  mockEmployees.forEach((e, i) => {
    empColorMap[e.id] = colors[i % colors.length];
  });

  return (
    <div className='mt-4 space-y-4'>
      <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
        <h3 className='font-display text-lg font-semibold'>Weekly Schedule</h3>
        <Button size='sm' className='gap-1.5' onClick={() => setShowAdd(true)}>
          <Plus size={14} /> Add Shift
        </Button>
      </div>

      <Card>
        <CardContent className='overflow-x-auto p-0'>
          <div className='min-w-[760px] sm:min-w-[900px]'>
            {/* Header */}
            <div className='grid grid-cols-8 border-b border-border'>
              <div className='border-r border-border p-3 text-xs font-semibold text-muted-foreground'>
                Time
              </div>
              {days.map((day) => (
                <div
                  key={day}
                  className='border-r border-border p-3 text-center text-xs font-semibold last:border-r-0'
                >
                  {day}
                </div>
              ))}
            </div>
            {/* Body */}
            {timeSlots.map((slot, slotIndex) => {
              const actualHour = slotIndex + 8;
              return (
                <div key={slot} className='grid grid-cols-8 border-b border-border last:border-b-0'>
                  <div className='flex items-center border-r border-border px-3 py-2 text-xs text-muted-foreground'>
                    {slot}
                  </div>
                  {days.map((day) => {
                    const slotShifts = getShiftsForSlot(day, actualHour);
                    return (
                      <div
                        key={day}
                        className='border-r border-border p-1 last:border-r-0 min-h-[48px]'
                      >
                        {slotShifts.map(
                          (s) =>
                            parseTime(s.startTime) === actualHour && (
                              <button
                                key={s.id}
                                onClick={() => setShowDetail(s)}
                                className={`w-full rounded-md border px-2 py-1 text-left text-[11px] font-medium transition-all hover:opacity-80 ${
                                  empColorMap[s.employeeId] || colors[0]
                                }`}
                              >
                                {s.employeeName.split(' ')[0]}
                              </button>
                            )
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
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
                  {mockEmployees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Day *</Label>
              <Select value={form.day} onValueChange={(v) => setForm({ ...form, day: v })}>
                <SelectTrigger>
                  <SelectValue placeholder='Select day' />
                </SelectTrigger>
                <SelectContent>
                  {days.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
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
                placeholder='Shift notes...'
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd}>Add Shift</Button>
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
              <div className='rounded-lg border border-border p-4 space-y-2'>
                <div>
                  <p className='text-xs text-muted-foreground'>Employee</p>
                  <p className='font-medium'>{showDetail.employeeName}</p>
                </div>
                <div>
                  <p className='text-xs text-muted-foreground'>Day</p>
                  <p className='font-medium'>{showDetail.day}</p>
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
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SchedulingTab;

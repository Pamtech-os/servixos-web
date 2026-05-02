import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Mail,
  Phone,
  ShieldCheck,
  Eye,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { mockEmployees, Employee } from '@/lib/team-mock-data';
import { toast } from 'sonner';

const PAGE_SIZE = 5;

const EmployeesTab = () => {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showAdd, setShowAdd] = useState(false);
  const [showDetail, setShowDetail] = useState<Employee | null>(null);
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', role: '' });

  const filtered = employees.filter(
    (e) =>
      e.fullName.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase()) ||
      e.role.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleAdd = () => {
    if (!form.fullName || !form.email || !form.role) {
      toast.error('Please fill in all required fields.');
      return;
    }
    const newEmp: Employee = {
      id: `e${Date.now()}`,
      fullName: form.fullName,
      email: form.email,
      phone: form.phone,
      role: form.role,
      dateJoined: new Date().toISOString().split('T')[0],
      weeklyHours: 0,
      defaultPassword: 'Servix@2024',
      clockHistory: [],
    };
    setEmployees((prev) => [newEmp, ...prev]);
    setForm({ fullName: '', email: '', phone: '', role: '' });
    setShowAdd(false);
    toast.success(`Employee added! Default password: Servix@2024`);
  };

  return (
    <div className='mt-4 space-y-4'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
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
        <Button size='sm' className='gap-1.5' onClick={() => setShowAdd(true)}>
          <Plus size={14} /> Add Employee
        </Button>
      </div>

      <div className='space-y-3'>
        {paginated.map((emp, i) => (
          <motion.div
            key={emp.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <Card className='hover:shadow-md transition-shadow'>
              <CardContent className='flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between'>
                <div className='flex items-center gap-3'>
                  <div className='gradient-bg flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-primary-foreground'>
                    {emp.fullName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </div>
                  <div className='min-w-0'>
                    <p className='font-medium'>{emp.fullName}</p>
                    <div className='flex flex-wrap items-center gap-2 text-xs text-muted-foreground'>
                      <span className='flex items-center gap-1'>
                        <Mail size={12} /> <span className='truncate'>{emp.email}</span>
                      </span>
                      <span className='flex items-center gap-1'>
                        <Phone size={12} /> {emp.phone}
                      </span>
                    </div>
                  </div>
                </div>
                <div className='flex items-center gap-2'>
                  <Badge variant='outline' className='gap-1'>
                    <ShieldCheck size={12} /> {emp.role}
                  </Badge>
                  <Button
                    size='sm'
                    variant='ghost'
                    className='gap-1'
                    onClick={() => setShowDetail(emp)}
                  >
                    <Eye size={14} /> View
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
        {paginated.length === 0 && (
          <p className='py-8 text-center text-sm text-muted-foreground'>No employees found.</p>
        )}
      </div>

      {totalPages > 1 && (
        <div className='flex items-center justify-center gap-2 pt-2'>
          <Button
            size='sm'
            variant='outline'
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            <ChevronLeft size={14} />
          </Button>
          <span className='text-sm text-muted-foreground'>
            Page {page} of {totalPages}
          </span>
          <Button
            size='sm'
            variant='outline'
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            <ChevronRight size={14} />
          </Button>
        </div>
      )}

      {/* Add Employee Dialog */}
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
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger>
                  <SelectValue placeholder='Select role' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='Manager'>Manager</SelectItem>
                  <SelectItem value='Technician'>Technician</SelectItem>
                  <SelectItem value='Designer'>Designer</SelectItem>
                  <SelectItem value='Support'>Support</SelectItem>
                  <SelectItem value='Admin'>Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className='rounded-lg border border-border bg-muted/50 p-3 text-xs text-muted-foreground'>
              Default login credentials will be created. The employee must change their password on
              first login.
              <br />
              <strong>Default Password:</strong> Servix@2024
            </p>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd}>Add Employee</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Employee Detail Dialog */}
      <Dialog open={!!showDetail} onOpenChange={(open) => !open && setShowDetail(null)}>
        <DialogContent className='max-h-[90dvh] overflow-y-auto sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>Employee Details</DialogTitle>
          </DialogHeader>
          {showDetail && (
            <div className='space-y-4'>
              <div className='flex items-center gap-4'>
                <div className='gradient-bg flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold text-primary-foreground'>
                  {showDetail.fullName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
                <div>
                  <h3 className='font-display text-lg font-bold'>{showDetail.fullName}</h3>
                  <Badge variant='outline'>{showDetail.role}</Badge>
                </div>
              </div>
              <div className='grid grid-cols-1 gap-3 rounded-lg border border-border p-4 sm:grid-cols-2'>
                <div>
                  <p className='text-xs text-muted-foreground'>Email</p>
                  <p className='text-sm font-medium'>{showDetail.email}</p>
                </div>
                <div>
                  <p className='text-xs text-muted-foreground'>Phone</p>
                  <p className='text-sm font-medium'>{showDetail.phone}</p>
                </div>
                <div>
                  <p className='text-xs text-muted-foreground'>Date Joined</p>
                  <p className='text-sm font-medium'>{showDetail.dateJoined}</p>
                </div>
                <div>
                  <p className='text-xs text-muted-foreground'>Hours This Week</p>
                  <p className='text-sm font-medium'>{showDetail.weeklyHours}h</p>
                </div>
              </div>
              <Button
                variant='outline'
                className='w-full'
                onClick={() => {
                  setShowDetail(null);
                  router.push(`/teams/clock-history/${showDetail.id}`);
                }}
              >
                View Clock History
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeesTab;

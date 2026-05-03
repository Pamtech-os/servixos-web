'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import ConfirmModal from '@/components/ConfirmModal';
import SubscriptionTab from '@/components/settings/SubscriptionTab';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';
import { Building2, Bell, Shield, CreditCard } from 'lucide-react';

const Settings = () => {
  const router = useRouter();
  const { logout } = useAuth();

  const [business, setBusiness] = useState({
    name: 'Servix Solutions',
    type: 'Field Services',
    email: 'info@servix.com',
    phone: '+1 (555) 123-4567',
    address: '123 Business Ave, Suite 100, New York, NY 10001',
    description:
      'Professional field service management company specializing in HVAC, plumbing, and electrical services.',
  });

  const [notifications, setNotifications] = useState({
    email: true,
    newClient: true,
    payment: false,
  });
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');

  const handleBusinessSave = () =>
    toast.success('Profile updated', { description: 'Your business profile has been saved.' });
  const handleNotificationSave = () =>
    toast.success('Notifications updated', {
      description: 'Your notification preferences have been saved.',
    });

  const handlePasswordUpdate = () => {
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      toast.error('Missing fields', { description: 'Please fill in all password fields.' });
      return;
    }
    if (passwords.new !== passwords.confirm) {
      toast.error('Mismatch', { description: 'New password and confirmation do not match.' });
      return;
    }
    if (passwords.new.length < 8) {
      toast.error('Too short', { description: 'Password must be at least 8 characters.' });
      return;
    }
    setPasswords({ current: '', new: '', confirm: '' });
    toast.success('Password updated', {
      description: 'Your password has been changed successfully.',
    });
  };

  const handleDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    setShowPasswordConfirm(true);
  };
  const handleFinalDelete = () => {
    if (!deletePassword) {
      toast.error('Password required', { description: 'Please enter your password to confirm.' });
      return;
    }
    setShowPasswordConfirm(false);
    setDeletePassword('');
    toast.success('Account deleted', {
      description: 'Your account has been successfully deleted.',
    });
    logout();
    router.push('/login');
  };

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-bold tracking-tight'>Settings</h1>
        <p className='text-muted-foreground'>
          Manage your business profile, notifications, and account.
        </p>
      </div>

      <Tabs defaultValue='business' className='space-y-6'>
        <TabsList className='flex h-auto w-full min-h-0 flex-nowrap justify-start gap-1 overflow-x-auto p-1 lg:w-[520px]'>
          <TabsTrigger value='business' className='shrink-0 gap-1.5 px-3'>
            <Building2 size={16} /> Business
          </TabsTrigger>
          <TabsTrigger value='notifications' className='shrink-0 gap-1.5 px-3'>
            <Bell size={16} /> Notifications
          </TabsTrigger>
          <TabsTrigger value='account' className='shrink-0 gap-1.5 px-3'>
            <Shield size={16} /> Account
          </TabsTrigger>
          <TabsTrigger value='subscription' className='shrink-0 gap-1.5 px-3'>
            <CreditCard size={16} /> Subscription
          </TabsTrigger>
        </TabsList>

        {/* Business Tab */}
        <TabsContent value='business'>
          <Card>
            <CardHeader>
              <CardTitle>Business Profile</CardTitle>
              <CardDescription>
                Update your business information visible on invoices and client communications.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid gap-4 sm:grid-cols-2'>
                <div className='space-y-2'>
                  <Label htmlFor='biz-name'>Business Name</Label>
                  <Input
                    id='biz-name'
                    value={business.name}
                    onChange={(e) => setBusiness((p) => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='biz-type'>Business Type</Label>
                  <Input
                    id='biz-type'
                    value={business.type}
                    onChange={(e) => setBusiness((p) => ({ ...p, type: e.target.value }))}
                  />
                </div>
              </div>
              <div className='grid gap-4 sm:grid-cols-2'>
                <div className='space-y-2'>
                  <Label htmlFor='biz-email'>Email</Label>
                  <Input
                    id='biz-email'
                    type='email'
                    value={business.email}
                    onChange={(e) => setBusiness((p) => ({ ...p, email: e.target.value }))}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='biz-phone'>Phone</Label>
                  <Input
                    id='biz-phone'
                    value={business.phone}
                    onChange={(e) => setBusiness((p) => ({ ...p, phone: e.target.value }))}
                  />
                </div>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='biz-address'>Address</Label>
                <Input
                  id='biz-address'
                  value={business.address}
                  onChange={(e) => setBusiness((p) => ({ ...p, address: e.target.value }))}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='biz-desc'>Description</Label>
                <Textarea
                  id='biz-desc'
                  rows={3}
                  value={business.description}
                  onChange={(e) => setBusiness((p) => ({ ...p, description: e.target.value }))}
                />
              </div>
              <div className='flex justify-end'>
                <Button onClick={handleBusinessSave} className='w-full sm:w-auto'>
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value='notifications'>
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose which notifications you would like to receive.</CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                <div className='space-y-0.5'>
                  <Label>Email Notifications</Label>
                  <p className='text-sm text-muted-foreground'>
                    Receive general updates and announcements via email.
                  </p>
                </div>
                <Switch
                  checked={notifications.email}
                  onCheckedChange={(v) => setNotifications((p) => ({ ...p, email: v }))}
                />
              </div>
              <Separator />
              <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                <div className='space-y-0.5'>
                  <Label>New Client Alert</Label>
                  <p className='text-sm text-muted-foreground'>
                    Get notified when a new client is added to your account.
                  </p>
                </div>
                <Switch
                  checked={notifications.newClient}
                  onCheckedChange={(v) => setNotifications((p) => ({ ...p, newClient: v }))}
                />
              </div>
              <Separator />
              <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                <div className='space-y-0.5'>
                  <Label>Payment Alert</Label>
                  <p className='text-sm text-muted-foreground'>
                    Get notified when a payment is received or overdue.
                  </p>
                </div>
                <Switch
                  checked={notifications.payment}
                  onCheckedChange={(v) => setNotifications((p) => ({ ...p, payment: v }))}
                />
              </div>
              <div className='flex justify-end pt-4'>
                <Button onClick={handleNotificationSave} className='w-full sm:w-auto'>
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value='account' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Update Password</CardTitle>
              <CardDescription>
                Change your account password. Use a strong password with at least 8 characters.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='current-pw'>Current Password</Label>
                <Input
                  id='current-pw'
                  type='password'
                  value={passwords.current}
                  onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))}
                />
              </div>
              <div className='grid gap-4 sm:grid-cols-2'>
                <div className='space-y-2'>
                  <Label htmlFor='new-pw'>New Password</Label>
                  <Input
                    id='new-pw'
                    type='password'
                    value={passwords.new}
                    onChange={(e) => setPasswords((p) => ({ ...p, new: e.target.value }))}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='confirm-pw'>Confirm Password</Label>
                  <Input
                    id='confirm-pw'
                    type='password'
                    value={passwords.confirm}
                    onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
                  />
                </div>
              </div>
              <div className='flex justify-end'>
                <Button onClick={handlePasswordUpdate} className='w-full sm:w-auto'>
                  Update Password
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card className='border-destructive/30'>
            <CardHeader>
              <CardTitle className='text-destructive'>Delete Account</CardTitle>
              <CardDescription>
                Permanently delete your account and all associated data. This action cannot be
                undone.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant='destructive'
                className='w-full sm:w-auto'
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscription Tab */}
        <TabsContent value='subscription'>
          <SubscriptionTab />
        </TabsContent>
      </Tabs>

      <ConfirmModal
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title='Are you sure you want to perform this action?'
        description='This will permanently delete your account and all associated data. This action cannot be undone.'
        confirmLabel='Yes, Delete'
        onConfirm={handleDeleteConfirm}
        variant='destructive'
      />

      <Dialog open={showPasswordConfirm} onOpenChange={setShowPasswordConfirm}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Confirm Your Password</DialogTitle>
            <DialogDescription>
              Enter your password to permanently delete your account.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-2'>
            <div className='space-y-2'>
              <Label htmlFor='delete-pw'>Password</Label>
              <Input
                id='delete-pw'
                type='password'
                placeholder='Enter your password'
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className='flex-col-reverse gap-2 sm:flex-row sm:justify-end'>
            <Button
              variant='outline'
              className='w-full sm:w-auto'
              onClick={() => {
                setShowPasswordConfirm(false);
                setDeletePassword('');
              }}
            >
              Cancel
            </Button>
            <Button variant='destructive' className='w-full sm:w-auto' onClick={handleFinalDelete}>
              Delete My Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;

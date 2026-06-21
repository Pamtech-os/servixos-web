'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import ConfirmModal from '@/components/ConfirmModal';
import SubscriptionTab from '@/components/settings/SubscriptionTab';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';
import { HttpError } from '@/common/network/http-client';
import { Building2, Bell, Shield, CreditCard, Loader2 } from 'lucide-react';
import { useBusinessProfileSettings, useNotificationPreferences } from '@/hooks/queries/use-settings';
import {
  useUpdateBusinessProfileMutation,
  useUpdateNotificationsMutation,
  useUpdatePasswordMutation,
  useDeleteAccountMutation,
} from '@/hooks/mutations/use-settings';
import type { NotificationPreferences } from '@/lib/api-client';

// ─── Business tab ─────────────────────────────────────────────────────────────

interface BusinessForm {
  name: string;
  email: string;
  phone: string;
  address: string;
  description: string;
}

const BusinessTab = () => {
  const { data: profileData, isLoading } = useBusinessProfileSettings();
  const mutation = useUpdateBusinessProfileMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<BusinessForm>({
    defaultValues: { name: '', email: '', phone: '', address: '', description: '' },
  });

  useEffect(() => {
    if (profileData) {
      reset({
        name: profileData.name ?? '',
        email: profileData.email ?? '',
        phone: profileData.phone ?? '',
        address: profileData.address ?? '',
        description: profileData.description ?? '',
      });
    }
  }, [profileData, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await mutation.mutateAsync(values);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save profile');
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Business Profile</CardTitle>
          <CardDescription>
            Update your business information visible on invoices and client communications.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid gap-4 sm:grid-cols-2'>
            <Skeleton className='h-10 w-full' />
            <Skeleton className='h-10 w-full' />
          </div>
          <div className='grid gap-4 sm:grid-cols-2'>
            <Skeleton className='h-10 w-full' />
            <Skeleton className='h-10 w-full' />
          </div>
          <Skeleton className='h-10 w-full' />
          <Skeleton className='h-20 w-full' />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Business Profile</CardTitle>
        <CardDescription>
          Update your business information visible on invoices and client communications.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className='space-y-4'>
          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='biz-name'>Business Name</Label>
              <Input
                id='biz-name'
                {...register('name', { required: 'Business name is required' })}
              />
              {errors.name && (
                <p className='text-xs text-destructive'>{errors.name.message}</p>
              )}
            </div>
            <div className='space-y-2'>
              <Label htmlFor='biz-type'>Business Type</Label>
              <Input
                id='biz-type'
                value={profileData?.categoryName ?? ''}
                readOnly
                disabled
                className='cursor-not-allowed opacity-60'
              />
            </div>
          </div>
          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='biz-email'>Email</Label>
              <Input
                id='biz-email'
                type='email'
                {...register('email', {
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' },
                })}
              />
              {errors.email && (
                <p className='text-xs text-destructive'>{errors.email.message}</p>
              )}
            </div>
            <div className='space-y-2'>
              <Label htmlFor='biz-phone'>Phone</Label>
              <Input id='biz-phone' {...register('phone')} />
            </div>
          </div>
          <div className='space-y-2'>
            <Label htmlFor='biz-address'>Address</Label>
            <Input id='biz-address' {...register('address')} />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='biz-desc'>Description</Label>
            <Textarea id='biz-desc' rows={3} {...register('description')} />
          </div>
          <div className='flex justify-end'>
            <Button
              type='submit'
              className='w-full sm:w-auto'
              disabled={mutation.isPending || !isDirty}
            >
              {mutation.isPending && <Loader2 size={14} className='mr-2 animate-spin' />}
              Save Changes
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

// ─── Notifications tab ────────────────────────────────────────────────────────

const NotificationsTab = () => {
  const { data: notifData, isLoading } = useNotificationPreferences();
  const mutation = useUpdateNotificationsMutation();
  const [prefs, setPrefs] = useState<NotificationPreferences>({
    email: true,
    newClient: true,
    payment: true,
  });
  const [savingKey, setSavingKey] = useState<keyof NotificationPreferences | null>(null);

  useEffect(() => {
    if (notifData) setPrefs(notifData);
  }, [notifData]);

  const handleToggle = async (key: keyof NotificationPreferences, value: boolean) => {
    setPrefs((prev) => ({ ...prev, [key]: value }));
    setSavingKey(key);
    try {
      await mutation.mutateAsync({ [key]: value });
    } catch {
      setPrefs((prev) => ({ ...prev, [key]: !value }));
      toast.error('Failed to save preference');
    } finally {
      setSavingKey(null);
    }
  };

  const items: { key: keyof NotificationPreferences; label: string; description: string }[] = [
    {
      key: 'email',
      label: 'Email Notifications',
      description: 'Receive general updates and announcements via email.',
    },
    {
      key: 'newClient',
      label: 'New Client Alert',
      description: 'Get notified when a new client is added to your account.',
    },
    {
      key: 'payment',
      label: 'Payment Alert',
      description: 'Get notified when a payment is received or overdue.',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>Choose which notifications you would like to receive.</CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        {items.map((item, i) => (
          <div key={item.key}>
            {i > 0 && <Separator className='mb-6' />}
            <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
              <div className='space-y-0.5'>
                <Label>{item.label}</Label>
                <p className='text-sm text-muted-foreground'>{item.description}</p>
              </div>
              <div className='flex items-center gap-2'>
                {savingKey === item.key && (
                  <Loader2 size={14} className='animate-spin text-muted-foreground' />
                )}
                <Switch
                  checked={prefs[item.key]}
                  onCheckedChange={(v) => void handleToggle(item.key, v)}
                  disabled={isLoading || savingKey === item.key}
                />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

// ─── Account tab ──────────────────────────────────────────────────────────────

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const AccountTab = () => {
  const router = useRouter();
  const { logout } = useAuth();
  const passwordMutation = useUpdatePasswordMutation();
  const deleteMutation = useDeleteAccountMutation();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<PasswordForm>({
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onPasswordSubmit = handleSubmit(async (values) => {
    try {
      await passwordMutation.mutateAsync(values);
      toast.success('Password updated');
      reset();
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      const isWrongPassword =
        (err instanceof HttpError && err.status === 401) ||
        msg.toLowerCase().includes('incorrect');

      if (isWrongPassword) {
        setError('currentPassword', { message: 'Current password is incorrect' });
      } else if (msg.includes('uppercase')) {
        setError('newPassword', { message: msg });
      } else if (msg.includes('number')) {
        setError('newPassword', { message: msg });
      } else if (msg.includes('8 characters')) {
        setError('newPassword', { message: msg });
      } else if (msg.toLowerCase().includes('match')) {
        setError('confirmPassword', { message: msg });
      } else {
        toast.error(msg || 'Failed to update password');
      }
    }
  });

  const handleDeleteConfirm = async () => {
    setShowDeleteConfirm(false);
    try {
      await deleteMutation.mutateAsync();
      logout();
      router.push('/login');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete account');
    }
  };

  return (
    <>
      <div className='space-y-6'>
        <Card>
          <CardHeader>
            <CardTitle>Update Password</CardTitle>
            <CardDescription>
              Change your account password. Use a strong password with at least 8 characters.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onPasswordSubmit} className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='current-pw'>Current Password</Label>
                <Input
                  id='current-pw'
                  type='password'
                  {...register('currentPassword', { required: 'Current password is required' })}
                />
                {errors.currentPassword && (
                  <p className='text-xs text-destructive'>{errors.currentPassword.message}</p>
                )}
              </div>
              <div className='grid gap-4 sm:grid-cols-2'>
                <div className='space-y-2'>
                  <Label htmlFor='new-pw'>New Password</Label>
                  <Input
                    id='new-pw'
                    type='password'
                    {...register('newPassword', { required: 'New password is required' })}
                  />
                  {errors.newPassword && (
                    <p className='text-xs text-destructive'>{errors.newPassword.message}</p>
                  )}
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='confirm-pw'>Confirm Password</Label>
                  <Input
                    id='confirm-pw'
                    type='password'
                    {...register('confirmPassword', { required: 'Please confirm your password' })}
                  />
                  {errors.confirmPassword && (
                    <p className='text-xs text-destructive'>{errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>
              <div className='flex justify-end'>
                <Button
                  type='submit'
                  className='w-full sm:w-auto'
                  disabled={passwordMutation.isPending}
                >
                  {passwordMutation.isPending && (
                    <Loader2 size={14} className='mr-2 animate-spin' />
                  )}
                  Update Password
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className='border-destructive/30'>
          <CardHeader>
            <CardTitle className='text-destructive'>Delete Account</CardTitle>
            <CardDescription>
              Permanently delete your account and all associated data. This action cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant='destructive'
              className='w-full sm:w-auto'
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 size={14} className='mr-2 animate-spin' />}
              Delete Account
            </Button>
          </CardContent>
        </Card>
      </div>

      <ConfirmModal
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title='Are you sure you want to perform this action?'
        description='This will permanently delete your account and all associated data. This action cannot be undone.'
        confirmLabel='Yes, Delete'
        onConfirm={() => void handleDeleteConfirm()}
        variant='destructive'
      />
    </>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const Settings = () => {
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

        <TabsContent value='business'>
          <BusinessTab />
        </TabsContent>

        <TabsContent value='notifications'>
          <NotificationsTab />
        </TabsContent>

        <TabsContent value='account'>
          <AccountTab />
        </TabsContent>

        <TabsContent value='subscription'>
          <SubscriptionTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;

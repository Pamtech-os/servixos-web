'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/sonner';
import LearningModeSwitch from '@/components/learning/LearningModeSwitch';
import { getApiErrorMessage } from '@/common/network/http-client';
import { useLearningPreferences } from '@/hooks/queries/use-learning';
import { useUpdateLearningPreferences } from '@/hooks/mutations/use-learning';
import type { BusinessExperience } from '@/lib/api-client';

const PREFER_NOT_TO_SAY = 'unset';

const EXPERIENCE_OPTIONS: { value: BusinessExperience; label: string }[] = [
  { value: 'new', label: 'New to running a business' },
  { value: 'growing', label: 'Growing' },
  { value: 'experienced', label: 'Experienced' },
];

const AiLearningTab = () => {
  const { data, isLoading } = useLearningPreferences();
  const update = useUpdateLearningPreferences();

  const handleExperienceChange = (value: string) => {
    const experience = value === PREFER_NOT_TO_SAY ? null : (value as BusinessExperience);
    update.mutate(
      { experience },
      {
        onError: (err) =>
          toast.error('Failed to save preference', { description: getApiErrorMessage(err) }),
      }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI explanations</CardTitle>
        <CardDescription>
          Choose how much the AI explains when it helps you. This follows you on every device.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div className='space-y-2'>
          <Label>How should the AI help?</Label>
          {isLoading ? <Skeleton className='h-8 w-72 rounded-full' /> : <LearningModeSwitch showHelper />}
        </div>

        <Separator />

        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div className='space-y-0.5'>
            <Label htmlFor='learning-experience'>About you</Label>
            <p className='text-sm text-muted-foreground'>
              Optional. Helps the AI pitch its explanations at the right level.
            </p>
          </div>
          {isLoading ? (
            <Skeleton className='h-10 w-full sm:w-64' />
          ) : (
            <Select
              value={data?.experience ?? PREFER_NOT_TO_SAY}
              onValueChange={handleExperienceChange}
            >
              <SelectTrigger id='learning-experience' className='w-full sm:w-64'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPERIENCE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
                <SelectItem value={PREFER_NOT_TO_SAY}>Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AiLearningTab;

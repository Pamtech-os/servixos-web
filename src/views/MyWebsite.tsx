'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Globe,
  Edit3,
  Eye,
  Palette,
  Type,
  Layout,
  Sparkles,
  Save,
  ExternalLink,
  FileText,
  CalendarIcon,
  User,
  Mail,
  Phone,
  Wrench,
  ClipboardList,
  Loader2,
  Upload,
  ImageIcon,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useWebsiteConfig } from '@/hooks/queries/use-website';
import {
  useSaveBookingFormMutation,
  useSaveDesignMutation,
  useSaveContentMutation,
  usePublishWebsiteMutation,
  useUploadLogoMutation,
} from '@/hooks/mutations/use-website';
import { getApiErrorMessage } from '@/common/network/http-client';
import type { WebsiteBookingFieldKey, WebsiteAiContent } from '@/lib/api-client';
import type { LucideIcon } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BookingField {
  id: WebsiteBookingFieldKey;
  label: string;
  type: 'text' | 'email' | 'tel' | 'textarea' | 'date' | 'select';
  placeholder: string;
  required: boolean;
  options?: string[];
  icon: LucideIcon;
}

interface SectionContents {
  hero: { headline: string; subheadline: string; ctaText: string };
  services: string; // comma-separated names
  about: { title: string; body: string };
  contact: string; // callToAction text
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'servixos.com';

const FIELD_META: Record<WebsiteBookingFieldKey, { type: BookingField['type']; icon: LucideIcon }> = {
  clientName: { type: 'text', icon: User },
  clientEmail: { type: 'email', icon: Mail },
  clientPhone: { type: 'tel', icon: Phone },
  service: { type: 'select', icon: Wrench },
  requestedDate: { type: 'date', icon: CalendarIcon },
  requestedEndDate: { type: 'date', icon: CalendarIcon },
  message: { type: 'textarea', icon: ClipboardList },
};

const DEFAULT_BOOKING_FIELDS: BookingField[] = [
  { id: 'clientName', label: 'Full Name', type: 'text', placeholder: 'John Doe', required: true, icon: User },
  { id: 'clientEmail', label: 'Email Address', type: 'email', placeholder: 'john@example.com', required: true, icon: Mail },
  { id: 'clientPhone', label: 'Phone Number', type: 'tel', placeholder: '+1 (555) 000-0000', required: false, icon: Phone },
  { id: 'service', label: 'Service Required', type: 'select', placeholder: 'Select a service', required: true, options: [], icon: Wrench },
  { id: 'requestedDate', label: 'Start Date', type: 'date', placeholder: 'Select start date', required: true, icon: CalendarIcon },
  { id: 'requestedEndDate', label: 'End Date', type: 'date', placeholder: 'Select end date', required: false, icon: CalendarIcon },
  { id: 'message', label: 'Job Details', type: 'textarea', placeholder: 'Describe what you need done...', required: false, icon: ClipboardList },
];

const websiteSections: Array<{ id: keyof SectionContents; label: string; icon: LucideIcon }> = [
  { id: 'hero', label: 'Hero Section', icon: Layout },
  { id: 'services', label: 'Services', icon: FileText },
  { id: 'about', label: 'About Us', icon: Edit3 },
  { id: 'contact', label: 'Contact', icon: Globe },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildSectionContents(aiContent?: WebsiteAiContent): SectionContents {
  return {
    hero: {
      headline: aiContent?.hero.headline ?? '',
      subheadline: aiContent?.hero.subheadline ?? '',
      ctaText: aiContent?.hero.ctaText ?? 'Book a Service',
    },
    services: aiContent?.services?.map((s) => s.name).join(', ') ?? '',
    about: {
      title: aiContent?.about.title ?? '',
      body: aiContent?.about.body ?? '',
    },
    contact: aiContent?.contact.callToAction ?? '',
  };
}

function getSectionDisplayText(id: keyof SectionContents, contents: SectionContents): string {
  switch (id) {
    case 'hero':
      return contents.hero.headline
        ? `${contents.hero.headline} — ${contents.hero.subheadline}`
        : 'Hero content will appear here after generation.';
    case 'services':
      return contents.services || 'Services will appear here after generation.';
    case 'about':
      return contents.about.body || 'About section will appear here after generation.';
    case 'contact':
      return contents.contact || 'Contact information will appear here after generation.';
  }
}

function buildBookingFields(
  apiFields?: Array<{ key: WebsiteBookingFieldKey; label: string; placeholder?: string; required: boolean }>,
): BookingField[] {
  if (!apiFields?.length) return DEFAULT_BOOKING_FIELDS;
  return apiFields.map((f) => ({
    id: f.key,
    label: f.label,
    type: FIELD_META[f.key].type,
    placeholder: f.placeholder ?? '',
    required: f.required,
    options: f.key === 'service' ? [] : undefined,
    icon: FIELD_META[f.key].icon,
  }));
}

// ─── Component ────────────────────────────────────────────────────────────────

const MyWebsite = () => {
  const { auth } = useAuth();
  const { data: websiteData, isLoading, isError } = useWebsiteConfig();
  const saveBookingForm = useSaveBookingFormMutation();
  const saveDesign = useSaveDesignMutation();
  const saveContent = useSaveContentMutation();
  const publishWebsite = usePublishWebsiteMutation();
  const uploadLogo = useUploadLogoMutation();

  const websiteUrl = websiteData?.subdomain
    ? `${websiteData.subdomain}.${ROOT_DOMAIN}`
    : auth.user?.subdomain
      ? `${auth.user.subdomain}.${ROOT_DOMAIN}`
      : null;

  const [initialized, setInitialized] = useState(false);
  const [editingSection, setEditingSection] = useState<keyof SectionContents | null>(null);
  const [sectionContents, setSectionContents] = useState<SectionContents>(buildSectionContents());
  const [primaryColor, setPrimaryColor] = useState('#3B82F6');
  const [secondaryColor, setSecondaryColor] = useState('#8B5CF6');
  const [fontFamily, setFontFamily] = useState('Inter');
  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined);

  const [bookingFields, setBookingFields] = useState<BookingField[]>(DEFAULT_BOOKING_FIELDS);
  const [bookingTitle, setBookingTitle] = useState('Book a Service');
  const [bookingDescription, setBookingDescription] = useState(
    "Fill out the form below to request a service. We'll get back to you within 24 hours.",
  );

  useEffect(() => {
    if (!websiteData || initialized) return;
    setPrimaryColor(websiteData.colorPrimary);
    setSecondaryColor(websiteData.colorSecondary);
    setFontFamily(websiteData.font);
    setLogoUrl(websiteData.logoUrl);
    setSectionContents(buildSectionContents(websiteData.aiContent));
    if (websiteData.bookingForm) {
      setBookingTitle(websiteData.bookingForm.title);
      setBookingDescription(websiteData.bookingForm.description ?? '');
    }
    setBookingFields(buildBookingFields(websiteData.bookingForm?.fields));
    setInitialized(true);
  }, [websiteData, initialized]);

  // Preload all font options so the picker buttons render in their own typeface
  useEffect(() => {
    const fonts = ['Poppins', 'DM+Sans', 'Space+Grotesk', 'Nunito', 'Montserrat', 'Playfair+Display', 'Lato', 'Raleway'];
    const id = 'my-website-font-preload';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?${fonts.map((f) => `family=${f}:wght@400;500;600;700`).join('&')}&display=swap`;
    document.head.appendChild(link);
  }, []);

  const handleSaveSection = async (sectionId: keyof SectionContents) => {
    try {
      switch (sectionId) {
        case 'hero':
          await saveContent.mutateAsync({ hero: sectionContents.hero });
          break;
        case 'services':
          await saveContent.mutateAsync({
            services: sectionContents.services
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
              .map((name) => ({ name, description: '' })),
          });
          break;
        case 'about':
          await saveContent.mutateAsync({ about: sectionContents.about });
          break;
        case 'contact':
          await saveContent.mutateAsync({ contact: { callToAction: sectionContents.contact } });
          break;
      }
      setEditingSection(null);
      toast.success('Section saved');
    } catch (err) {
      toast.error('Save failed', { description: getApiErrorMessage(err) });
    }
  };

  const handlePublish = async () => {
    try {
      const result = await publishWebsite.mutateAsync();
      toast.success('Website published!', { description: `Live at ${result.url}` });
    } catch (err) {
      toast.error('Publish failed', { description: getApiErrorMessage(err) });
    }
  };

  const handleSaveBookingForm = async () => {
    try {
      await saveBookingForm.mutateAsync({
        title: bookingTitle,
        description: bookingDescription || undefined,
        fields: bookingFields.map((f) => ({
          key: f.id,
          label: f.label,
          placeholder: f.placeholder || undefined,
          required: f.required,
        })),
      });
      toast.success('Booking form saved!', {
        description: 'Changes will be reflected on your website.',
      });
    } catch (err) {
      toast.error('Save failed', { description: getApiErrorMessage(err) });
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await uploadLogo.mutateAsync(file);
      setLogoUrl(result.logoUrl);
      toast.success('Logo updated!');
    } catch (err) {
      toast.error('Upload failed', { description: getApiErrorMessage(err) });
    }
    e.target.value = '';
  };

  const handleSaveDesign = async () => {
    try {
      await saveDesign.mutateAsync({
        colorPrimary: primaryColor,
        colorSecondary: secondaryColor,
        font: fontFamily,
      });
      toast.success('Design saved!');
    } catch (err) {
      toast.error('Save failed', { description: getApiErrorMessage(err) });
    }
  };

  const handleUpdateFieldLabel = (fieldId: string, newLabel: string) => {
    setBookingFields((prev) =>
      prev.map((f) => (f.id === fieldId ? { ...f, label: newLabel } : f)),
    );
  };

  const handleUpdateFieldPlaceholder = (fieldId: string, newPlaceholder: string) => {
    setBookingFields((prev) =>
      prev.map((f) => (f.id === fieldId ? { ...f, placeholder: newPlaceholder } : f)),
    );
  };

  const handleToggleRequired = (fieldId: string) => {
    setBookingFields((prev) =>
      prev.map((f) => (f.id === fieldId ? { ...f, required: !f.required } : f)),
    );
  };

  const handleUpdateServiceOptions = (newOptions: string) => {
    setBookingFields((prev) =>
      prev.map((f) =>
        f.id === 'service'
          ? {
              ...f,
              options: newOptions.split(',').map((o) => o.trim()).filter(Boolean),
            }
          : f,
      ),
    );
  };

  const isPublished = websiteData?.isPublished ?? false;

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='font-display text-2xl font-bold md:text-3xl'>My Website</h1>
          <p className='text-sm text-muted-foreground'>
            Manage your AI-generated business website.
          </p>
        </div>
        <div className='flex items-center gap-2'>
          {isLoading ? (
            <Loader2 size={16} className='animate-spin text-muted-foreground' />
          ) : (
            <Badge
              variant={isPublished ? 'default' : 'secondary'}
              className={
                isPublished ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600' : ''
              }
            >
              {isPublished ? 'Published' : isError ? 'Not Generated' : 'Draft'}
            </Badge>
          )}
          <Button
            variant='outline'
            size='sm'
            className='gap-1.5'
            disabled={!websiteUrl}
            onClick={() => {
              if (websiteUrl) window.open(`https://${websiteUrl}`, '_blank');
              else toast.error('No website URL found. Complete onboarding first.');
            }}
          >
            <Eye size={14} /> Preview
          </Button>
          <Button
            size='sm'
            className='gradient-bg gap-1.5 text-primary-foreground'
            disabled={publishWebsite.isPending}
            onClick={handlePublish}
          >
            {publishWebsite.isPending ? (
              <Loader2 size={14} className='animate-spin' />
            ) : (
              <ExternalLink size={14} />
            )}{' '}
            Publish
          </Button>
        </div>
      </div>

      {/* Website URL */}
      <Card>
        <CardContent className='flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <p className='text-xs font-medium text-muted-foreground'>Website URL</p>
            {isLoading ? (
              <div className='mt-1 h-4 w-48 animate-pulse rounded bg-muted' />
            ) : websiteUrl ? (
              <a
                href={`https://${websiteUrl}`}
                target='_blank'
                rel='noreferrer'
                className='font-mono text-sm font-bold text-primary hover:underline'
              >
                {websiteUrl}
              </a>
            ) : (
              <p className='text-sm text-muted-foreground'>No website generated yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue='content' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='content' className='gap-1.5'>
            <Edit3 size={14} /> Content
          </TabsTrigger>
          <TabsTrigger value='bookings' className='gap-1.5'>
            <ClipboardList size={14} /> Bookings
          </TabsTrigger>
          <TabsTrigger value='design' className='gap-1.5'>
            <Palette size={14} /> Design
          </TabsTrigger>
        </TabsList>

        {/* Content Tab */}
        <TabsContent value='content' className='space-y-4'>
          {websiteSections.map((section) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader className='flex flex-row items-center justify-between pb-2'>
                  <div className='flex items-center gap-2'>
                    <section.icon size={16} className='text-primary' />
                    <CardTitle className='text-sm'>{section.label}</CardTitle>
                  </div>
                  <Button
                    variant='ghost'
                    size='sm'
                    className='h-7 gap-1 text-xs'
                    onClick={() =>
                      setEditingSection(editingSection === section.id ? null : section.id)
                    }
                  >
                    <Edit3 size={12} /> {editingSection === section.id ? 'Cancel' : 'Edit'}
                  </Button>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className='h-4 w-3/4 animate-pulse rounded bg-muted' />
                  ) : editingSection === section.id ? (
                    <div className='space-y-3'>
                      <SectionEditor
                        sectionId={section.id}
                        contents={sectionContents}
                        onChange={setSectionContents}
                      />
                      <div className='flex gap-2'>
                        <Button
                          size='sm'
                          className='gap-1.5'
                          disabled={saveContent.isPending}
                          onClick={() => handleSaveSection(section.id)}
                        >
                          {saveContent.isPending ? (
                            <Loader2 size={12} className='animate-spin' />
                          ) : (
                            <Save size={12} />
                          )}{' '}
                          Save
                        </Button>
                        <Button
                          size='sm'
                          variant='outline'
                          className='gap-1.5'
                          onClick={() => toast.info('AI updating section...')}
                        >
                          <Sparkles size={12} /> AI Rewrite
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className='text-sm text-muted-foreground'>
                      {getSectionDisplayText(section.id, sectionContents)}
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </TabsContent>

        {/* Bookings Tab */}
        <TabsContent value='bookings' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-base'>
                <ClipboardList size={18} className='text-primary' /> Booking Form Setup
              </CardTitle>
              <CardDescription>
                Configure the booking form that clients see on your website. Submissions appear in
                your Requests page.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-5'>
              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                <div className='space-y-1.5'>
                  <Label className='text-xs'>Form Title</Label>
                  <Input value={bookingTitle} onChange={(e) => setBookingTitle(e.target.value)} />
                </div>
                <div className='space-y-1.5'>
                  <Label className='text-xs'>Form Description</Label>
                  <Input
                    value={bookingDescription}
                    onChange={(e) => setBookingDescription(e.target.value)}
                  />
                </div>
              </div>

              <Separator />

              <div className='space-y-3'>
                <p className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                  Form Fields
                </p>
                {bookingFields.map((field) => (
                  <motion.div
                    key={field.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className='space-y-2 rounded-lg border border-border p-3'
                  >
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-2'>
                        <field.icon size={14} className='text-primary' />
                        <span className='text-xs font-semibold'>{field.label}</span>
                        <Badge variant='outline' className='px-1.5 text-[9px]'>
                          {field.type}
                        </Badge>
                      </div>
                      <div className='flex items-center gap-2'>
                        <Label className='text-[10px] text-muted-foreground'>Required</Label>
                        <Switch
                          checked={field.required}
                          onCheckedChange={() => handleToggleRequired(field.id)}
                          className='scale-75'
                        />
                      </div>
                    </div>
                    <div className='grid grid-cols-2 gap-2'>
                      <div className='space-y-1'>
                        <Label className='text-[10px] text-muted-foreground'>Label</Label>
                        <Input
                          value={field.label}
                          onChange={(e) => handleUpdateFieldLabel(field.id, e.target.value)}
                          className='h-7 text-xs'
                        />
                      </div>
                      <div className='space-y-1'>
                        <Label className='text-[10px] text-muted-foreground'>Placeholder</Label>
                        <Input
                          value={field.placeholder}
                          onChange={(e) =>
                            handleUpdateFieldPlaceholder(field.id, e.target.value)
                          }
                          className='h-7 text-xs'
                        />
                      </div>
                    </div>
                    {field.type === 'select' && field.options !== undefined && (
                      <div className='space-y-1'>
                        <Label className='text-[10px] text-muted-foreground'>
                          Options (comma-separated)
                        </Label>
                        <Input
                          value={field.options.join(', ')}
                          onChange={(e) => handleUpdateServiceOptions(e.target.value)}
                          className='h-7 text-xs'
                        />
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              <div className='flex justify-end gap-2'>
                <Button
                  size='sm'
                  className='gap-1.5'
                  disabled={saveBookingForm.isPending}
                  onClick={handleSaveBookingForm}
                >
                  {saveBookingForm.isPending ? (
                    <Loader2 size={12} className='animate-spin' />
                  ) : (
                    <Save size={14} />
                  )}{' '}
                  Save Booking Form
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle className='text-base'>Form Preview</CardTitle>
              <CardDescription>
                This is how clients see the booking form on your website.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4 rounded-xl border border-border bg-muted/20 p-5'>
                <div className='space-y-1 text-center'>
                  <h3 className='font-display text-lg font-bold'>{bookingTitle}</h3>
                  <p className='text-xs text-muted-foreground'>{bookingDescription}</p>
                </div>
                <div className='space-y-3'>
                  {bookingFields.map((field) => (
                    <div key={field.id} className='space-y-1'>
                      <Label className='flex items-center gap-1.5 text-xs'>
                        <field.icon size={10} />
                        {field.label}{' '}
                        {field.required && <span className='text-destructive'>*</span>}
                      </Label>
                      {field.type === 'textarea' ? (
                        <Textarea
                          placeholder={field.placeholder}
                          className='text-xs'
                          rows={2}
                          disabled
                        />
                      ) : field.type === 'select' ? (
                        <select
                          className='w-full rounded-md border border-input bg-background px-3 py-2 text-xs'
                          disabled
                        >
                          <option>{field.placeholder}</option>
                          {field.options?.map((o) => <option key={o}>{o}</option>)}
                        </select>
                      ) : (
                        <Input
                          type={field.type}
                          placeholder={field.placeholder}
                          className='text-xs'
                          disabled
                        />
                      )}
                    </div>
                  ))}
                </div>
                <Button className='gradient-bg w-full text-primary-foreground' disabled>
                  Submit Booking
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Design Tab */}
        <TabsContent value='design' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle className='text-base'>Brand Identity</CardTitle>
              <CardDescription>Customize your website look and feel.</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <Separator />

              {/* Logo upload */}
              <div className='space-y-2'>
                <Label className='flex items-center gap-1.5 text-xs'>
                  <ImageIcon size={12} /> Logo
                </Label>
                <div className='flex items-center gap-4'>
                  {logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoUrl} alt='Business logo' className='h-14 w-auto rounded-lg border border-border object-contain p-1' />
                  ) : (
                    <div className='flex h-14 w-14 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30'>
                      <ImageIcon size={20} className='text-muted-foreground' />
                    </div>
                  )}
                  <div>
                    <Label
                      htmlFor='logo-upload'
                      className='inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted'
                    >
                      {uploadLogo.isPending ? (
                        <Loader2 size={12} className='animate-spin' />
                      ) : (
                        <Upload size={12} />
                      )}
                      {logoUrl ? 'Replace Logo' : 'Upload Logo'}
                    </Label>
                    <input
                      id='logo-upload'
                      type='file'
                      accept='image/jpeg,image/jpg,image/png'
                      className='sr-only'
                      disabled={uploadLogo.isPending}
                      onChange={handleLogoUpload}
                    />
                    <p className='mt-1 text-[10px] text-muted-foreground'>JPEG or PNG, max 5 MB</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label className='flex items-center gap-1.5 text-xs'>
                    <Palette size={12} /> Primary Color
                  </Label>
                  <div className='flex items-center gap-2'>
                    <input
                      type='color'
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className='h-8 w-8 cursor-pointer rounded border border-border'
                    />
                    <Input
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className='flex-1 font-mono text-xs'
                    />
                  </div>
                </div>
                <div className='space-y-2'>
                  <Label className='flex items-center gap-1.5 text-xs'>
                    <Palette size={12} /> Secondary Color
                  </Label>
                  <div className='flex items-center gap-2'>
                    <input
                      type='color'
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className='h-8 w-8 cursor-pointer rounded border border-border'
                    />
                    <Input
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className='flex-1 font-mono text-xs'
                    />
                  </div>
                </div>
              </div>

              <div className='space-y-2'>
                <Label className='flex items-center gap-1.5 text-xs'>
                  <Type size={12} /> Font Family
                </Label>
                <div className='flex flex-wrap gap-2'>
                  {['Inter', 'Poppins', 'DM Sans', 'Space Grotesk', 'Nunito', 'Montserrat', 'Georgia', 'Playfair Display', 'Lato', 'Raleway'].map((f) => (
                    <Button
                      key={f}
                      variant={fontFamily === f ? 'default' : 'outline'}
                      size='sm'
                      className='text-xs'
                      style={{ fontFamily: f }}
                      onClick={() => setFontFamily(f)}
                    >
                      {f}
                    </Button>
                  ))}
                </div>
              </div>

              <div className='flex justify-end'>
                <Button
                  className='gap-1.5'
                  disabled={saveDesign.isPending}
                  onClick={handleSaveDesign}
                >
                  {saveDesign.isPending ? (
                    <Loader2 size={14} className='animate-spin' />
                  ) : (
                    <Save size={14} />
                  )}{' '}
                  Save Design
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// ─── Section Editor ───────────────────────────────────────────────────────────

function SectionEditor({
  sectionId,
  contents,
  onChange,
}: {
  sectionId: keyof SectionContents;
  contents: SectionContents;
  onChange: React.Dispatch<React.SetStateAction<SectionContents>>;
}) {
  switch (sectionId) {
    case 'hero':
      return (
        <div className='space-y-2'>
          <Input
            placeholder='Headline'
            value={contents.hero.headline}
            onChange={(e) =>
              onChange((p) => ({ ...p, hero: { ...p.hero, headline: e.target.value } }))
            }
          />
          <Input
            placeholder='Subheadline'
            value={contents.hero.subheadline}
            onChange={(e) =>
              onChange((p) => ({ ...p, hero: { ...p.hero, subheadline: e.target.value } }))
            }
          />
          <Input
            placeholder='CTA Button Text (e.g. Book Now)'
            value={contents.hero.ctaText}
            onChange={(e) =>
              onChange((p) => ({ ...p, hero: { ...p.hero, ctaText: e.target.value } }))
            }
          />
        </div>
      );
    case 'services':
      return (
        <Textarea
          placeholder='House Cleaning, Plumbing Repair, Electrical Work…'
          value={contents.services}
          onChange={(e) => onChange((p) => ({ ...p, services: e.target.value }))}
          rows={2}
        />
      );
    case 'about':
      return (
        <div className='space-y-2'>
          <Input
            placeholder='Section title (e.g. About Us)'
            value={contents.about.title}
            onChange={(e) =>
              onChange((p) => ({ ...p, about: { ...p.about, title: e.target.value } }))
            }
          />
          <Textarea
            placeholder='Tell customers about your business…'
            value={contents.about.body}
            onChange={(e) =>
              onChange((p) => ({ ...p, about: { ...p.about, body: e.target.value } }))
            }
            rows={3}
          />
        </div>
      );
    case 'contact':
      return (
        <Input
          placeholder='Call to action text (e.g. Ready to get started? Contact us today.)'
          value={contents.contact}
          onChange={(e) => onChange((p) => ({ ...p, contact: e.target.value }))}
        />
      );
  }
}

export default MyWebsite;

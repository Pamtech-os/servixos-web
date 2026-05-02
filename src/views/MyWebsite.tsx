'use client';

import { useState } from 'react';
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
import { toast } from 'sonner';

const websiteSections = [
  {
    id: 'hero',
    label: 'Hero Section',
    icon: Layout,
    content:
      'Welcome to Servix Solutions – Professional field services you can trust.',
  },
  {
    id: 'services',
    label: 'Services',
    icon: FileText,
    content:
      'House Cleaning, Plumbing Repair, Electrical Work, HVAC Services, Painting, Landscaping',
  },
  {
    id: 'about',
    label: 'About Us',
    icon: Edit3,
    content:
      'We are a team of dedicated professionals providing top-quality field services since 2020.',
  },
  {
    id: 'contact',
    label: 'Contact',
    icon: Globe,
    content:
      'Email: info@servix.com | Phone: +1 (555) 123-4567 | Address: 123 Business Ave, NY',
  },
];

interface BookingField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'textarea' | 'date' | 'select';
  placeholder: string;
  required: boolean;
  options?: string[];
  icon: typeof User;
}

const MyWebsite = () => {
  const [websiteUrl] = useState('servixsolutions.servixos.com');
  const [isPublished] = useState(true);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [sectionContents, setSectionContents] = useState<
    Record<string, string>
  >(Object.fromEntries(websiteSections.map((s) => [s.id, s.content])));
  const [primaryColor, setPrimaryColor] = useState('#3B82F6');
  const [secondaryColor, setSecondaryColor] = useState('#8B5CF6');
  const [fontFamily, setFontFamily] = useState('Inter');
  const [siteName, setSiteName] = useState('Servix Solutions');

  // Booking form config
  const [bookingFields, setBookingFields] = useState<BookingField[]>([
    {
      id: 'name',
      label: 'Full Name',
      type: 'text',
      placeholder: 'John Doe',
      required: true,
      icon: User,
    },
    {
      id: 'email',
      label: 'Email Address',
      type: 'email',
      placeholder: 'john@example.com',
      required: true,
      icon: Mail,
    },
    {
      id: 'phone',
      label: 'Phone Number',
      type: 'tel',
      placeholder: '+1 (555) 000-0000',
      required: true,
      icon: Phone,
    },
    {
      id: 'service',
      label: 'Service Required',
      type: 'select',
      placeholder: 'Select a service',
      required: true,
      options: [
        'House Cleaning',
        'Plumbing Repair',
        'Electrical Work',
        'HVAC Services',
        'Painting',
        'Landscaping',
      ],
      icon: Wrench,
    },
    {
      id: 'startDate',
      label: 'Start Date',
      type: 'date',
      placeholder: 'Select start date',
      required: true,
      icon: CalendarIcon,
    },
    {
      id: 'endDate',
      label: 'End Date',
      type: 'date',
      placeholder: 'Select end date',
      required: false,
      icon: CalendarIcon,
    },
    {
      id: 'details',
      label: 'Job Details',
      type: 'textarea',
      placeholder: 'Describe what you need done...',
      required: true,
      icon: ClipboardList,
    },
  ]);
  const [bookingTitle, setBookingTitle] = useState('Book a Service');
  const [bookingDescription, setBookingDescription] = useState(
    "Fill out the form below to request a service. We'll get back to you within 24 hours.",
  );
  const [requireEndDate, setRequireEndDate] = useState(false);

  const handleSaveSection = (sectionId: string) => {
    setEditingSection(null);
    toast.success('Section updated', {
      description: `${sectionId} section has been saved.`,
    });
  };

  const handlePublish = () => {
    toast.success('Website published!', {
      description: `Changes are live at ${websiteUrl}`,
    });
  };

  const handleSaveBookingForm = () => {
    const updated = bookingFields.map((f) =>
      f.id === 'endDate' ? { ...f, required: requireEndDate } : f,
    );
    setBookingFields(updated);
    toast.success('Booking form saved!', {
      description: 'Changes will be reflected on your website.',
    });
  };

  const handleUpdateFieldLabel = (fieldId: string, newLabel: string) => {
    setBookingFields((prev) =>
      prev.map((f) => (f.id === fieldId ? { ...f, label: newLabel } : f)),
    );
  };

  const handleUpdateFieldPlaceholder = (
    fieldId: string,
    newPlaceholder: string,
  ) => {
    setBookingFields((prev) =>
      prev.map((f) =>
        f.id === fieldId ? { ...f, placeholder: newPlaceholder } : f,
      ),
    );
  };

  const handleToggleRequired = (fieldId: string) => {
    if (fieldId === 'endDate') {
      setRequireEndDate(!requireEndDate);
      return;
    }
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
              options: newOptions
                .split(',')
                .map((o) => o.trim())
                .filter(Boolean),
            }
          : f,
      ),
    );
  };

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='font-display text-2xl font-bold md:text-3xl'>
            My Website
          </h1>
          <p className='text-sm text-muted-foreground'>
            Manage your AI-generated business website.
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Badge
            variant={isPublished ? 'default' : 'secondary'}
            className={
              isPublished
                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                : ''
            }
          >
            {isPublished ? 'Published' : 'Draft'}
          </Badge>
          <Button
            variant='outline'
            size='sm'
            className='gap-1.5'
            onClick={() => toast.info('Opening preview...')}
          >
            <Eye size={14} /> Preview
          </Button>
          <Button
            size='sm'
            className='gap-1.5 gradient-bg text-primary-foreground'
            onClick={handlePublish}
          >
            <ExternalLink size={14} /> Publish
          </Button>
        </div>
      </div>

      {/* Website URL Card */}
      <Card>
        <CardContent className='flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <p className='text-xs font-medium text-muted-foreground'>
              Website URL
            </p>
            <p className='font-mono text-sm font-bold text-primary'>
              {websiteUrl}
            </p>
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
                    className='gap-1 h-7 text-xs'
                    onClick={() =>
                      setEditingSection(
                        editingSection === section.id ? null : section.id,
                      )
                    }
                  >
                    <Edit3 size={12} />{' '}
                    {editingSection === section.id ? 'Cancel' : 'Edit'}
                  </Button>
                </CardHeader>
                <CardContent>
                  {editingSection === section.id ? (
                    <div className='space-y-3'>
                      <Textarea
                        value={sectionContents[section.id]}
                        onChange={(e) =>
                          setSectionContents((p) => ({
                            ...p,
                            [section.id]: e.target.value,
                          }))
                        }
                        rows={3}
                      />
                      <div className='flex gap-2'>
                        <Button
                          size='sm'
                          className='gap-1.5'
                          onClick={() => handleSaveSection(section.id)}
                        >
                          <Save size={12} /> Save
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
                      {sectionContents[section.id]}
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
              <CardTitle className='text-base flex items-center gap-2'>
                <ClipboardList size={18} className='text-primary' /> Booking
                Form Setup
              </CardTitle>
              <CardDescription>
                Configure the booking form that clients see on your website.
                Submissions appear in your Requests page.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-5'>
              {/* Form Title & Description */}
              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                <div className='space-y-1.5'>
                  <Label className='text-xs'>Form Title</Label>
                  <Input
                    value={bookingTitle}
                    onChange={(e) => setBookingTitle(e.target.value)}
                  />
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

              {/* Form Fields */}
              <div className='space-y-3'>
                <p className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                  Form Fields
                </p>
                {bookingFields.map((field) => (
                  <motion.div
                    key={field.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className='rounded-lg border border-border p-3 space-y-2'
                  >
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-2'>
                        <field.icon size={14} className='text-primary' />
                        <span className='text-xs font-semibold'>
                          {field.label}
                        </span>
                        <Badge variant='outline' className='text-[9px] px-1.5'>
                          {field.type}
                        </Badge>
                      </div>
                      <div className='flex items-center gap-2'>
                        <Label className='text-[10px] text-muted-foreground'>
                          Required
                        </Label>
                        <Switch
                          checked={
                            field.id === 'endDate'
                              ? requireEndDate
                              : field.required
                          }
                          onCheckedChange={() => handleToggleRequired(field.id)}
                          className='scale-75'
                        />
                      </div>
                    </div>
                    <div className='grid grid-cols-2 gap-2'>
                      <div className='space-y-1'>
                        <Label className='text-[10px] text-muted-foreground'>
                          Label
                        </Label>
                        <Input
                          value={field.label}
                          onChange={(e) =>
                            handleUpdateFieldLabel(field.id, e.target.value)
                          }
                          className='h-7 text-xs'
                        />
                      </div>
                      <div className='space-y-1'>
                        <Label className='text-[10px] text-muted-foreground'>
                          Placeholder
                        </Label>
                        <Input
                          value={field.placeholder}
                          onChange={(e) =>
                            handleUpdateFieldPlaceholder(
                              field.id,
                              e.target.value,
                            )
                          }
                          className='h-7 text-xs'
                        />
                      </div>
                    </div>
                    {field.type === 'select' && field.options && (
                      <div className='space-y-1'>
                        <Label className='text-[10px] text-muted-foreground'>
                          Options (comma-separated)
                        </Label>
                        <Input
                          value={field.options.join(', ')}
                          onChange={(e) =>
                            handleUpdateServiceOptions(e.target.value)
                          }
                          className='h-7 text-xs'
                        />
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              <div className='flex justify-end gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  className='gap-1.5'
                  onClick={() => toast.info('AI optimizing booking form...')}
                >
                  <Sparkles size={12} /> AI Optimize
                </Button>
                <Button
                  size='sm'
                  className='gap-1.5'
                  onClick={handleSaveBookingForm}
                >
                  <Save size={14} /> Save Booking Form
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
              <div className='rounded-xl border border-border bg-muted/20 p-5 space-y-4'>
                <div className='text-center space-y-1'>
                  <h3 className='text-lg font-bold font-display'>
                    {bookingTitle}
                  </h3>
                  <p className='text-xs text-muted-foreground'>
                    {bookingDescription}
                  </p>
                </div>
                <div className='space-y-3'>
                  {bookingFields.map((field) => (
                    <div key={field.id} className='space-y-1'>
                      <Label className='text-xs flex items-center gap-1.5'>
                        <field.icon size={10} />
                        {field.label}{' '}
                        {field.required && (
                          <span className='text-destructive'>*</span>
                        )}
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
                          {field.options?.map((o) => (
                            <option key={o}>{o}</option>
                          ))}
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
                <Button
                  className='w-full gradient-bg text-primary-foreground'
                  disabled
                >
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
              <CardDescription>
                Customize your website look and feel.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label className='text-xs'>Site Name</Label>
                <Input
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                />
              </div>

              <Separator />

              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label className='text-xs flex items-center gap-1.5'>
                    <Palette size={12} /> Primary Color
                  </Label>
                  <div className='flex items-center gap-2'>
                    <input
                      type='color'
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className='h-8 w-8 rounded border border-border cursor-pointer'
                    />
                    <Input
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className='flex-1 font-mono text-xs'
                    />
                  </div>
                </div>
                <div className='space-y-2'>
                  <Label className='text-xs flex items-center gap-1.5'>
                    <Palette size={12} /> Secondary Color
                  </Label>
                  <div className='flex items-center gap-2'>
                    <input
                      type='color'
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className='h-8 w-8 rounded border border-border cursor-pointer'
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
                <Label className='text-xs flex items-center gap-1.5'>
                  <Type size={12} /> Font Family
                </Label>
                <div className='flex gap-2 flex-wrap'>
                  {['Inter', 'Georgia', 'Nunito', 'Montserrat'].map((f) => (
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
                  onClick={() => toast.success('Design saved!')}
                >
                  <Save size={14} /> Save Design
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MyWebsite;

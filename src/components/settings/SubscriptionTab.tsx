import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles, Crown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface PlanFeature {
  text: string;
}

interface Plan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: PlanFeature[];
  popular?: boolean;
}

const plans: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    description:
      'Launch with the essentials-guided business setup, job tracking, invoicing, and client management with built-in AI assistance.',
    monthlyPrice: 29,
    yearlyPrice: 278,
    features: [
      { text: 'AI Business Setup' },
      { text: 'Jobs Management (up to 10)' },
      { text: 'Invoicing (up to 10)' },
      { text: 'Client Management (up to 10)' },
      { text: 'AI Insights' },
      { text: 'AI Suggestions (up to 5)' },
      { text: 'Team Members (1)' },
      { text: 'Support Center' },
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    description:
      'Built for growing teams-unlock more automation, smarter pricing and contracts, and higher limits to run more jobs and invoices.',
    monthlyPrice: 79,
    yearlyPrice: 758,
    popular: true,
    features: [
      { text: 'Everything in Starter +' },
      { text: 'AI Suggestions (up to 50)' },
      { text: 'AI Pricing Assistant' },
      { text: 'AI Contract Generator' },
      { text: 'Invoicing (up to 50)' },
      { text: 'Client Management (up to 50)' },
      { text: 'Team Members (up to 10)' },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    description:
      'For scale and operations-unlimited usage, advanced AI support, and streamlined workflows built for high-volume teams.',
    monthlyPrice: 100,
    yearlyPrice: 960,
    features: [
      { text: 'Everything in Growth +' },
      { text: 'AI Suggestions (unlimited)' },
      { text: 'Invoicing (unlimited)' },
      { text: 'Client Management (unlimited)' },
      { text: 'Team Members (unlimited)' },
    ],
  },
];

const currentPlanId = 'starter';

const SubscriptionTab = () => {
  const [isYearly, setIsYearly] = useState(true);

  return (
    <div className='space-y-6'>
      {/* Billing toggle */}
      <div className='flex items-center justify-center gap-3'>
        <div className='flex items-center gap-3 rounded-full border border-border bg-muted/50 px-4 py-2'>
          <Label
            htmlFor='billing-toggle'
            className={`text-sm cursor-pointer transition-colors ${
              !isYearly ? 'text-foreground font-semibold' : 'text-muted-foreground'
            }`}
          >
            Monthly
          </Label>
          <Switch id='billing-toggle' checked={isYearly} onCheckedChange={setIsYearly} />
          <Label
            htmlFor='billing-toggle'
            className={`text-sm cursor-pointer transition-colors ${
              isYearly ? 'text-foreground font-semibold' : 'text-muted-foreground'
            }`}
          >
            Yearly
          </Label>
        </div>
        {isYearly && (
          <motion.p
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className='text-sm font-medium text-primary'
          >
            Save 20% with annual billing
          </motion.p>
        )}
      </div>

      {/* Plans grid */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
        {plans.map((plan, i) => {
          const isCurrent = plan.id === currentPlanId;
          const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
          const period = isYearly ? '/year' : '/month';

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card
                className={`relative overflow-hidden transition-all h-full ${
                  plan.popular
                    ? 'border-primary/50 shadow-[0_0_30px_-8px_hsl(var(--primary)/0.3)]'
                    : 'border-border'
                } ${isCurrent ? 'ring-2 ring-emerald-500/50' : ''}`}
              >
                {plan.popular && (
                  <div className='absolute left-0 right-0 top-0 bg-gradient-to-r from-primary to-secondary py-1 text-center'>
                    <span className='text-[10px] font-bold text-primary-foreground uppercase tracking-wider'>
                      Most Popular
                    </span>
                  </div>
                )}
                <CardContent className={`flex flex-col h-full p-6 ${plan.popular ? 'pt-10' : ''}`}>
                  <div className='flex-1 space-y-4'>
                    <div>
                      <h3 className='text-lg font-bold font-display'>{plan.name}</h3>
                      <p className='text-xs text-muted-foreground mt-1 leading-relaxed'>
                        {plan.description}
                      </p>
                    </div>

                    <div className='flex items-baseline gap-1'>
                      <span
                        className={`font-display text-4xl font-bold ${
                          plan.popular ? 'text-primary' : ''
                        }`}
                      >
                        ${price}
                      </span>
                      <span className='text-sm text-muted-foreground'>{period}</span>
                    </div>

                    {isYearly && (
                      <p className='text-xs text-muted-foreground'>20% off annual plan</p>
                    )}

                    <div className='space-y-2.5 pt-2'>
                      {plan.features.map((f) => (
                        <div key={f.text} className='flex items-start gap-2'>
                          <Check
                            size={14}
                            className={`mt-0.5 shrink-0 ${
                              plan.popular ? 'text-primary' : 'text-emerald-500'
                            }`}
                          />
                          <span className='text-xs leading-relaxed'>{f.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className='mt-6'>
                    {isCurrent ? (
                      <Button variant='outline' className='w-full gap-1.5' disabled>
                        <Crown size={14} /> Current Plan
                      </Button>
                    ) : (
                      <Button
                        className={`w-full gap-1.5 ${
                          plan.popular ? 'gradient-bg text-primary-foreground' : ''
                        }`}
                        variant={plan.popular ? 'default' : 'outline'}
                        onClick={() => toast.info(`Upgrade to ${plan.name} coming soon!`)}
                      >
                        <Sparkles size={14} />{' '}
                        {plan.id === 'starter' ? 'Start Free Trial' : 'Upgrade'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default SubscriptionTab;

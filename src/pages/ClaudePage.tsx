import { useMemo, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Check,
  Copy,
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  Building2,
  ShieldCheck,
  Zap,
  Clock,
  MessageCircle,
  Mail,
  User,
  Phone,
  Sparkles,
  AlertTriangle,
  Loader2,
  ArrowRight,
  BadgeCheck,
  Package,
  Users,
  Lock,
  Rocket,
  HelpCircle,
  LayoutDashboard,
  Crown,
  Gauge,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import SEO from '@/components/seo/SEO';
import { cn, getCountry } from '@/lib/utils';
import { generateOrderId } from '@/lib/store';
import { useCreateOrder } from '@/hooks/useOrders';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  amountDueNow,
  remainingBalance,
  buildClaudeOrderWhatsAppUrl,
  type ClaudePaymentMode,
  CLAUDE_RESERVE_RATE,
} from '@/lib/claudePreorder';
import { motion } from 'framer-motion';

const WHATSAPP_FALLBACK = '94787767869';

type PlanId = 'pro' | 'max5x';

interface ClaudePlan {
  id: PlanId;
  name: string;
  shortLabel: string;
  fullPrice: number;
  badge?: string;
  description: string;
  highlights: string[];
}

const PLANS: ClaudePlan[] = [
  {
    id: 'pro',
    name: 'Pro Seat',
    shortLabel: 'Pro',
    fullPrice: 2599,
    description: 'Claude Team Pro access via private workspace invite — on the account email you provide.',
    highlights: ['Private workspace invite', 'Pro-level access', 'Your email · 1 month'],
  },
  {
    id: 'max5x',
    name: 'Max 5X Seat',
    shortLabel: 'Max 5X',
    fullPrice: 4599,
    badge: 'Popular',
    description: 'Higher Max 5X limits in a private Team workspace — invited to your own Claude email.',
    highlights: ['Private workspace invite', 'Max 5X limits', 'Your email · 1 month'],
  },
];

const INCLUDED = [
  {
    icon: Users,
    title: 'Private workspace invite',
    text: 'You get invited into a private Team workspace with Pro / Max plan access.',
  },
  {
    icon: LayoutDashboard,
    title: 'Use your own account',
    text: 'Invite goes to your Claude email — log in as you always do.',
  },
  {
    icon: Crown,
    title: 'Pro or Max 5X seat',
    text: 'Pick the seat level you need for the full 1-month period.',
  },
  {
    icon: ShieldCheck,
    title: '20 day warranty',
    text: 'Coverage after activation if something goes wrong on our side.',
  },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Pre-order your seat',
    text: 'Choose Pro or Max 5X, pick full pay or 50% reserve, upload the bank receipt.',
    icon: Package,
  },
  {
    step: '02',
    title: 'We verify & prepare',
    text: 'We confirm your payment and prepare a private Team workspace slot.',
    icon: BadgeCheck,
  },
  {
    step: '03',
    title: 'Invite to your email',
    text: 'You receive a workspace invite on the Claude account email you entered.',
    icon: Mail,
  },
  {
    step: '04',
    title: 'Accept & enjoy Pro/Max',
    text: 'Join the private workspace and use Pro / Max plan features for 1 month.',
    icon: Rocket,
  },
];

const FAQ_ITEMS = [
  {
    q: 'What exactly do I get?',
    a: 'You are invited to a private Claude Team workspace. Inside that workspace you have access at Pro or Max 5X level (depending on the seat you ordered), using your own Claude account email — for 1 month.',
  },
  {
    q: 'Is this on my own Claude account?',
    a: 'Yes. You provide the email for your Claude / Anthropic account. We send the Team workspace invite to that email. You log in as usual and accept the invite — no shared login passwords needed for daily use.',
  },
  {
    q: 'What is a “private workspace”?',
    a: 'It is a Claude Team organization/workspace where your seat lives. After you accept the invite, you work inside that workspace with Pro or Max plan capabilities according to your seat.',
  },
  {
    q: 'Pro vs Max 5X — which should I pick?',
    a: 'Pro Seat is the standard Team Pro experience at LKR 2,599. Max 5X is for heavier usage with higher limits at LKR 4,599. If you hit Pro limits often, choose Max 5X.',
  },
  {
    q: 'Should I pay full or only 50%?',
    a: 'Pay in full (recommended) if you want the fastest path — one transfer, no balance later, priority when slots open. Choose 50% reserve only if you want to hold a slot now and pay the rest at activation. Full prices: Pro LKR 2,599 · Max 5X LKR 4,599.',
  },
  {
    q: 'How long until I get the invite?',
    a: 'After we verify your bank transfer and when your slot is ready. Full-payment orders are prioritized. We message you on WhatsApp with your Order ID. If you chose 50% reserve, the remaining 50% is due before the workspace invite.',
  },
  {
    q: 'What email should I enter?',
    a: 'The exact email you use to log into Claude.ai / Anthropic. Wrong email = invite won’t reach you. Double-check before paying.',
  },
  {
    q: 'What is the 20 day warranty?',
    a: 'After activation, if the seat fails due to our side (e.g. invite/access issues we control), we support you within the 20-day warranty window via WhatsApp.',
  },
  {
    q: 'Can I order via WhatsApp instead?',
    a: 'Yes. Message +94 78 776 7869 with your preferred plan (Pro or Max 5X) and Claude email. Online pre-order is faster because you get an Order ID and can upload the receipt here.',
  },
  {
    q: 'Is stock limited?',
    a: 'Yes. Slots are limited. Full payment or a 50% reserve holds your place — first come, first served. Full pay gets priority when invites go out.',
  },
];

const formatLkr = (amount: number) =>
  `LKR ${amount.toLocaleString('en-LK', { maximumFractionDigits: 0 })}`;

const ClaudePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const createOrder = useCreateOrder();
  const { data: settings } = useSiteSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const orderIdRef = useRef(generateOrderId());
  const orderId = orderIdRef.current;
  const checkoutRef = useRef<HTMLDivElement>(null);
  const plansRef = useRef<HTMLDivElement>(null);
  const faqRef = useRef<HTMLDivElement>(null);

  const [selectedPlanId, setSelectedPlanId] = useState<PlanId>('max5x');
  const [paymentMode, setPaymentMode] = useState<ClaudePaymentMode>('full');
  const [formData, setFormData] = useState({
    name: '',
    whatsapp: '',
    claudeEmail: '',
    contactEmail: '',
    notes: '',
  });
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'details' | 'payment'>('details');

  const selectedPlan = useMemo(
    () => PLANS.find((p) => p.id === selectedPlanId) ?? PLANS[0],
    [selectedPlanId]
  );

  const amountDue = amountDueNow(selectedPlan.fullPrice, paymentMode);
  const remaining = remainingBalance(selectedPlan.fullPrice, paymentMode);
  const isFullPay = paymentMode === 'full';
  const reservePct = Math.round(CLAUDE_RESERVE_RATE * 100);

  const bankName = settings?.bank_name || 'Sampath Bank';
  const bankBranch = settings?.bank_branch || 'Horana';
  const bankAccountName = settings?.bank_account_name || 'M A MUSAMMIL';
  const bankAccountNumber = settings?.bank_account_number || '105752093919';
  const whatsappNumber = (settings?.whatsapp_number || WHATSAPP_FALLBACK).replace(/\D/g, '');

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied!', description: `${label} copied to clipboard` });
  };

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload JPG, PNG, WebP, or PDF.',
        variant: 'destructive',
      });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Max file size is 10MB.',
        variant: 'destructive',
      });
      return;
    }
    setProofFile(file);
  };

  const removeFile = () => {
    setProofFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validateDetails = () => {
    const whatsappRegex = /^\+?[\d\s-]{10,}$/;
    if (!formData.name.trim()) {
      toast({ title: 'Name required', description: 'Enter your full name.', variant: 'destructive' });
      return false;
    }
    if (!formData.whatsapp || !whatsappRegex.test(formData.whatsapp)) {
      toast({
        title: 'Invalid WhatsApp',
        description: 'Enter a valid WhatsApp number (e.g. +94787767869).',
        variant: 'destructive',
      });
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.claudeEmail || !emailRegex.test(formData.claudeEmail.trim())) {
      toast({
        title: 'Claude email required',
        description: 'Enter the Claude account email that will receive the workspace invite.',
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  const handleContinueToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateDetails()) return;
    setStep('payment');
    setTimeout(() => scrollTo(checkoutRef), 50);
  };

  const handleSubmitPreorder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateDetails()) {
      setStep('details');
      return;
    }
    if (!proofFile) {
      toast({
        title: 'Payment proof required',
        description: `Upload a receipt for ${formatLkr(amountDue)}.`,
        variant: 'destructive',
      });
      return;
    }

    // Open blank tab immediately (same user gesture) so popup blockers don't kill WhatsApp after await
    const waWindow = window.open('about:blank', '_blank');

    setIsSubmitting(true);
    try {
      const fileExt = proofFile.name.split('.').pop();
      const fileName = `${orderId}-claude-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(fileName, proofFile);

      if (uploadError) {
        throw new Error(uploadError.message || 'Failed to upload payment proof');
      }

      const customerCountry = await getCountry();
      const productName = `Claude Team Plan – ${selectedPlan.name}`;
      const planName = isFullPay
        ? '1 Month · Full payment · Private Workspace'
        : `1 Month · ${reservePct}% reserve · Private Workspace`;

      const notesParts = [
        '=== CLAUDE PRE-ORDER ===',
        `Plan: ${selectedPlan.name}`,
        `Payment mode: ${isFullPay ? 'Full payment (100%)' : `Reserve (${reservePct}% now)`}`,
        `Delivery: Private Team workspace invite (Pro/Max access)`,
        `Full price: ${formatLkr(selectedPlan.fullPrice)}`,
        isFullPay
          ? `Amount paid now: ${formatLkr(amountDue)}`
          : `Deposit paid (${reservePct}%): ${formatLkr(amountDue)}`,
        isFullPay
          ? 'Balance due: LKR 0'
          : `Balance due on activation (${100 - reservePct}%): ${formatLkr(remaining)}`,
        `Claude account email: ${formData.claudeEmail.trim()}`,
        `Order ID: ${orderId}`,
        formData.notes?.trim() ? `Customer notes: ${formData.notes.trim()}` : null,
      ].filter(Boolean);

      await createOrder.mutateAsync({
        order_number: orderId,
        customer_name: formData.name.trim(),
        customer_whatsapp: formData.whatsapp.trim(),
        customer_email: formData.contactEmail.trim() || formData.claudeEmail.trim(),
        total_amount: amountDue,
        payment_method: 'bank_transfer',
        payment_proof_url: fileName,
        notes: notesParts.join('\n'),
        customer_country: customerCountry,
        currency_code: 'LKR',
        currency_symbol: 'Rs.',
        currency_rate: 1,
        user_agent: navigator.userAgent,
        security_metadata: {
          screen_resolution: `${window.screen.width}x${window.screen.height}`,
          language: navigator.language,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          product: 'claude_preorder',
          plan_id: selectedPlan.id,
          payment_mode: paymentMode,
          full_price: selectedPlan.fullPrice,
          deposit_rate: isFullPay ? 1 : CLAUDE_RESERVE_RATE,
          deposit_amount: amountDue,
          remaining_amount: remaining,
          claude_email: formData.claudeEmail.trim(),
          delivery: 'private_workspace_invite',
          timestamp: new Date().toISOString(),
        },
        items: [
          {
            product_name: productName,
            plan_name: planName,
            variant_name: selectedPlan.shortLabel,
            quantity: 1,
            unit_price: amountDue,
            total_price: amountDue,
            customer_credentials: {
              email: formData.claudeEmail.trim(),
              service: 'claude',
              plan: selectedPlan.id,
              preorder: true,
              payment_mode: paymentMode,
              full_payment: isFullPay,
              delivery: 'private_workspace_invite',
              full_price: selectedPlan.fullPrice,
              deposit_amount: amountDue,
              remaining_amount: remaining,
            },
          },
        ],
      });

      const waPayload = {
        orderId,
        name: formData.name.trim(),
        customerWhatsapp: formData.whatsapp.trim(),
        claudeEmail: formData.claudeEmail.trim(),
        plan: selectedPlan.name,
        paymentMode,
        fullPrice: selectedPlan.fullPrice,
        amountPaid: amountDue,
        remaining,
      };
      const whatsappConfirmUrl = buildClaudeOrderWhatsAppUrl(whatsappNumber, waPayload);

      const orderData = {
        orderId,
        whatsapp: formData.whatsapp.trim(),
        name: formData.name.trim(),
        notes: notesParts.join('\n'),
        currency: 'LKR',
        rate: 1,
        items: [
          {
            name: `${productName} (${isFullPay ? 'Full payment' : `${reservePct}% reserve`})`,
            price: amountDue,
            quantity: 1,
          },
        ],
        total: amountDue,
        paymentMethod: 'bank_transfer' as const,
        isPreOrder: true,
        whatsappConfirmUrl,
        autoOpenWhatsApp: true,
        preOrder: {
          service: 'Claude Team',
          plan: selectedPlan.name,
          fullPrice: selectedPlan.fullPrice,
          deposit: amountDue,
          remaining,
          claudeEmail: formData.claudeEmail.trim(),
          depositRate: isFullPay ? 1 : CLAUDE_RESERVE_RATE,
          paymentMode,
          isFullPayment: isFullPay,
        },
      };

      sessionStorage.setItem('lastOrder', JSON.stringify(orderData));

      // Point the pre-opened tab at WhatsApp (survives popup blockers better than open-after-await)
      if (waWindow && !waWindow.closed) {
        waWindow.location.href = whatsappConfirmUrl;
        sessionStorage.removeItem('waNeedsRetry');
      } else {
        // Popup blocked — success page shows big CTA + one more auto attempt
        sessionStorage.setItem('waNeedsRetry', '1');
      }

      toast({
        title: 'Order placed!',
        description: waWindow && !waWindow.closed
          ? 'WhatsApp opened with your order details — just hit Send.'
          : 'Order saved. Tap “Send order on WhatsApp” on the next screen.',
      });

      navigate('/order-success');
    } catch (error) {
      if (waWindow && !waWindow.closed) {
        waWindow.close();
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Claude pre-order failed:', error);
      toast({
        title: 'Pre-order failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const whatsappPreorderLink = () => {
    const msg = encodeURIComponent(
      `Hi! I want Claude Team (${selectedPlan.name}).\nPayment: ${isFullPay ? 'FULL' : `${reservePct}% reserve`}\nAmount now: ${formatLkr(amountDue)}\nOrder ID: ${orderId}\nClaude email: ${formData.claudeEmail || '(not filled yet)'}\nPrivate workspace invite with Pro/Max access.`
    );
    return `https://wa.me/${whatsappNumber}?text=${msg}`;
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <SEO
        title="Claude Team Plan – Private Workspace Invite · 1 Month"
        description="Claude Team Pro or Max 5X — private workspace invite on your own account. Pay in full (recommended) or reserve with 50%. 20 day warranty."
        type="product"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: 'Claude Team Plan – Private Workspace · 1 Month',
          description:
            'Invite to a private Claude Team workspace with Pro or Max 5X seat on your own account. Full pay or 50% reserve.',
          offers: PLANS.map((p) => ({
            '@type': 'Offer',
            name: p.name,
            price: p.fullPrice,
            priceCurrency: 'LKR',
            availability: 'https://schema.org/PreOrder',
          })),
        }}
      />

      {/* Sticky mobile CTA bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 md:hidden border-t border-border/80 bg-background/95 backdrop-blur-lg px-3 py-2.5 safe-area-pb">
        <div className="flex items-center gap-2 max-w-lg mx-auto">
          <div className="flex-1 min-w-0 pl-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">
              {selectedPlan.shortLabel} · {isFullPay ? 'Full pay' : `${reservePct}% now`}
            </p>
            <p className="text-sm font-black text-foreground">{formatLkr(amountDue)}</p>
          </div>
          <Button
            size="sm"
            className="h-11 px-4 rounded-xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 text-white shrink-0"
            onClick={() => scrollTo(checkoutRef)}
          >
            Pre-order
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Hero */}
      <section className="relative pt-20 sm:pt-24 pb-12 sm:pb-16 lg:pt-32 lg:pb-24 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[10%] left-[-10%] w-64 sm:w-96 h-64 sm:h-96 bg-orange-500/15 rounded-full blur-[80px] sm:blur-[100px]" />
          <div className="absolute bottom-[5%] right-[-15%] w-72 sm:w-[28rem] h-72 sm:h-[28rem] bg-amber-400/10 rounded-full blur-[90px] sm:blur-[120px]" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex flex-wrap items-center justify-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-5 sm:mb-6"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500" />
              </span>
              Pre-Order · Private workspace · Limited slots
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-display font-black text-foreground tracking-tight mb-3 sm:mb-4 leading-[1.1] px-1"
            >
              Claude Team Plan{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500">
                – 1 Month ⚡
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-5 sm:mb-8 leading-relaxed px-1"
            >
              You will be{' '}
              <strong className="text-foreground">invited to a private workspace</strong> where you
              get access to a <strong className="text-foreground">Pro or Max plan</strong> seat —
              on <strong className="text-foreground">your own Claude account</strong>.{' '}
              <strong className="text-orange-400">Pay in full</strong> for priority, or reserve with{' '}
              <strong className="text-orange-400">{reservePct}% now</strong>.
            </motion.p>

            {/* Hero highlight cards */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 max-w-3xl mx-auto mb-7 sm:mb-9"
            >
              {[
                { icon: Users, label: 'Private workspace invite' },
                { icon: Crown, label: 'Pro / Max seat access' },
                { icon: Lock, label: 'Your Claude email only' },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 sm:py-3 rounded-2xl bg-card/80 border border-border text-xs sm:text-sm font-semibold text-foreground"
                >
                  <Icon className="w-4 h-4 text-orange-400 shrink-0" />
                  {label}
                </div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 justify-center items-stretch sm:items-center px-1"
            >
              <Button
                size="lg"
                className="h-12 sm:h-12 px-6 sm:px-8 rounded-2xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white shadow-lg shadow-orange-500/25 w-full sm:w-auto"
                onClick={() => scrollTo(checkoutRef)}
              >
                Secure my slot
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-6 sm:px-8 rounded-2xl font-bold border-2 w-full sm:w-auto"
                onClick={() => scrollTo(plansRef)}
              >
                Compare plans
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-6 sm:px-8 rounded-2xl font-bold border-2 w-full sm:w-auto"
                asChild
              >
                <a href={whatsappPreorderLink()} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  <span className="sm:hidden">WhatsApp us</span>
                  <span className="hidden sm:inline">+94 78 776 7869</span>
                </a>
              </Button>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="mt-5 sm:mt-6 text-xs sm:text-sm text-amber-500/90 font-medium flex items-center justify-center gap-2 px-2"
            >
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Slots available for pre-order · Limited stock — secure yours NOW</span>
            </motion.p>
          </div>
        </div>
      </section>

      {/* How workspace works */}
      <section className="pb-12 sm:pb-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="rounded-3xl border border-orange-500/25 bg-gradient-to-br from-orange-500/10 via-card to-amber-500/5 p-5 sm:p-8 md:p-10 overflow-hidden relative">
              <div className="absolute -top-20 -right-20 w-56 h-56 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10">
                <div className="flex flex-col md:flex-row md:items-start gap-6 md:gap-10">
                  <div className="md:flex-1">
                    <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-orange-400 mb-2">
                      How you get access
                    </p>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-display font-black text-foreground mb-3 leading-tight">
                      Private workspace invite → Pro / Max access
                    </h2>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                      After activation, you are invited into a{' '}
                      <strong className="text-foreground">private Claude Team workspace</strong>.
                      Inside that workspace you use a{' '}
                      <strong className="text-foreground">Pro or Max plan</strong> seat (your choice)
                      while logged into <strong className="text-foreground">your own account</strong>.
                      No shared password for daily use — accept the invite on the email you give us.
                    </p>
                    <ul className="space-y-2.5">
                      {[
                        'Invite lands on your Claude account email',
                        'Accept → join private Team workspace',
                        'Enjoy Pro or Max 5X seat features for 1 month',
                      ].map((line) => (
                        <li key={line} className="flex items-start gap-2.5 text-sm text-foreground">
                          <Check className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
                          {line}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="md:w-[280px] lg:w-[300px] shrink-0 space-y-2.5">
                    {[
                      { icon: Gauge, t: 'Pro seat', d: 'Standard Team Pro access' },
                      { icon: Crown, t: 'Max 5X seat', d: 'Higher usage limits' },
                      { icon: ShieldCheck, t: '20 day warranty', d: 'After activation' },
                    ].map(({ icon: Icon, t, d }) => (
                      <div
                        key={t}
                        className="flex items-center gap-3 p-3.5 rounded-2xl bg-background/70 border border-border"
                      >
                        <div className="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center shrink-0">
                          <Icon className="w-5 h-5 text-orange-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">{t}</p>
                          <p className="text-xs text-muted-foreground">{d}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Plans */}
      <section ref={plansRef} className="pb-12 sm:pb-16 scroll-mt-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-display font-black text-center mb-2">
              Available plans
            </h2>
            <p className="text-center text-muted-foreground mb-6 sm:mb-8 text-sm px-2">
              Both seats include a private workspace invite · Full pay recommended · or {reservePct}% reserve
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
              {PLANS.map((plan) => {
                const planFull = plan.fullPrice;
                const planReserve = amountDueNow(plan.fullPrice, 'reserve');
                const selected = selectedPlanId === plan.id;
                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => {
                      setSelectedPlanId(plan.id);
                      scrollTo(checkoutRef);
                    }}
                    className={cn(
                      'relative text-left p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border-2 transition-all duration-300 active:scale-[0.99]',
                      selected
                        ? 'border-orange-500 bg-orange-500/5 shadow-xl shadow-orange-500/10 md:scale-[1.02]'
                        : 'border-border bg-card hover:border-orange-500/40 hover:bg-secondary/30'
                    )}
                  >
                    {plan.badge && (
                      <span className="absolute -top-2.5 right-4 sm:right-6 px-2.5 sm:px-3 py-1 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[9px] sm:text-[10px] font-black uppercase tracking-widest shadow-lg">
                        {plan.badge}
                      </span>
                    )}
                    <div className="flex items-start justify-between gap-3 mb-3 sm:mb-4">
                      <div>
                        <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
                          Claude Team
                        </p>
                        <h3 className="text-xl sm:text-2xl font-black text-foreground">{plan.name}</h3>
                      </div>
                      <div
                        className={cn(
                          'w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                          selected ? 'border-orange-500 bg-orange-500' : 'border-muted-foreground/40'
                        )}
                      >
                        {selected && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 sm:mb-5 leading-relaxed">
                      {plan.description}
                    </p>
                    <div className="flex flex-wrap items-end gap-2 mb-3 sm:mb-4">
                      <span className="text-2xl sm:text-3xl font-black text-foreground">
                        {formatLkr(planFull)}
                      </span>
                      <span className="text-sm text-muted-foreground mb-1">full price</span>
                    </div>
                    <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-secondary/60 border border-border mb-4 space-y-1.5">
                      <div className="flex justify-between items-baseline gap-2">
                        <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-green-500">
                          Pay full (best)
                        </span>
                        <span className="text-sm font-black text-foreground">{formatLkr(planFull)}</span>
                      </div>
                      <div className="flex justify-between items-baseline gap-2">
                        <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-orange-400">
                          Or reserve {reservePct}%
                        </span>
                        <span className="text-sm font-black text-orange-400">{formatLkr(planReserve)}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground pt-1 border-t border-border/60">
                        Reserve: balance {formatLkr(remainingBalance(plan.fullPrice, 'reserve'))} at activation
                      </p>
                    </div>
                    <ul className="space-y-2">
                      {plan.highlights.map((h) => (
                        <li key={h} className="flex items-center gap-2 text-sm text-foreground/90">
                          <Check className="w-4 h-4 text-orange-400 shrink-0" />
                          {h}
                        </li>
                      ))}
                    </ul>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* What's included */}
      <section className="py-12 sm:py-16 border-y border-border/50 bg-secondary/20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-display font-black text-center mb-6 sm:mb-8 flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-orange-400" />
              What&apos;s included
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {INCLUDED.map((item) => (
                <div
                  key={item.title}
                  className="flex items-start gap-3 p-4 sm:p-5 rounded-2xl bg-card border border-border"
                >
                  <div className="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center shrink-0">
                    <item.icon className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground mb-0.5">{item.title}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {item.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works steps */}
      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-display font-black text-center mb-2">
              How it works
            </h2>
            <p className="text-center text-muted-foreground text-sm mb-8 max-w-xl mx-auto">
              From payment to private workspace invite
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {HOW_IT_WORKS.map((item) => (
                <div
                  key={item.step}
                  className="relative p-5 rounded-2xl bg-card border border-border"
                >
                  <span className="text-[10px] font-black text-orange-400/80 tracking-widest">
                    STEP {item.step}
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center my-3">
                    <item.icon className="w-5 h-5 text-orange-400" />
                  </div>
                  <h3 className="text-sm font-black text-foreground mb-1.5">{item.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Checkout */}
      <section ref={checkoutRef} className="py-12 sm:py-16 lg:py-20 scroll-mt-20 pb-28 md:pb-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8 sm:mb-10">
              <h2 className="text-2xl sm:text-3xl font-display font-black mb-2">
                Pre-order checkout
              </h2>
              <p className="text-muted-foreground text-sm px-2">
                Details → choose payment → transfer → upload receipt → Order ID
              </p>
            </div>

            {/* Progress */}
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-6 sm:mb-8">
              {(['details', 'payment'] as const).map((s, i) => (
                <div key={s} className="flex items-center gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => s === 'details' && setStep('details')}
                    className={cn(
                      'w-8 h-8 sm:w-9 sm:h-9 rounded-full text-sm font-black flex items-center justify-center transition-colors',
                      step === s || (s === 'details' && step === 'payment')
                        ? 'bg-orange-500 text-white'
                        : 'bg-secondary text-muted-foreground'
                    )}
                  >
                    {i + 1}
                  </button>
                  <span
                    className={cn(
                      'text-[10px] sm:text-xs font-bold uppercase tracking-wider',
                      step === s ? 'text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {s === 'details' ? 'Details' : 'Pay'}
                  </span>
                  {i === 0 && <div className="w-6 sm:w-8 h-0.5 bg-border" />}
                </div>
              ))}
            </div>

            {/* Order summary strip */}
            <div className="mb-5 sm:mb-6 p-4 rounded-2xl bg-gradient-to-r from-orange-500/10 to-amber-500/5 border border-orange-500/20 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-orange-400 mb-1">
                  Selected plan
                </p>
                <p className="font-bold text-foreground text-sm sm:text-base">
                  Claude Team · {selectedPlan.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isFullPay ? 'Full payment' : `${reservePct}% reserve`} · Pay now{' '}
                  {formatLkr(amountDue)}
                  {!isFullPay && ` · later ${formatLkr(remaining)}`}
                </p>
              </div>
              <div className="sm:text-right">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                  Your Order ID
                </p>
                <button
                  type="button"
                  onClick={() => copyToClipboard(orderId, 'Order ID')}
                  className="inline-flex items-center gap-2 font-mono font-black text-primary text-sm hover:opacity-80"
                >
                  {orderId}
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {step === 'details' ? (
              <form
                onSubmit={handleContinueToPayment}
                className="space-y-4 sm:space-y-5 p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl bg-card border border-border shadow-xl"
              >
                <div className="p-3 rounded-xl bg-orange-500/5 border border-orange-500/15 text-xs text-muted-foreground leading-relaxed">
                  <strong className="text-orange-400">Reminder:</strong> You will receive a{' '}
                  <strong className="text-foreground">private workspace invite</strong> on the Claude
                  email below, with access to a <strong className="text-foreground">Pro / Max</strong>{' '}
                  seat for 1 month.
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-2 text-sm">
                      <User className="w-3.5 h-3.5" /> Full name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                      placeholder="Your name"
                      className="h-11 rounded-xl text-base"
                      required
                      autoComplete="name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp" className="flex items-center gap-2 text-sm">
                      <Phone className="w-3.5 h-3.5" /> WhatsApp <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="whatsapp"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData((p) => ({ ...p, whatsapp: e.target.value }))}
                      placeholder="+94787767869"
                      className="h-11 rounded-xl text-base"
                      required
                      inputMode="tel"
                      autoComplete="tel"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="claudeEmail" className="flex items-center gap-2 text-sm">
                    <Zap className="w-3.5 h-3.5 text-orange-400" />
                    Claude account email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="claudeEmail"
                    type="email"
                    value={formData.claudeEmail}
                    onChange={(e) => setFormData((p) => ({ ...p, claudeEmail: e.target.value }))}
                    placeholder="you@email.com (receives workspace invite)"
                    className="h-11 rounded-xl border-orange-500/30 focus-visible:ring-orange-500 text-base"
                    required
                    autoComplete="email"
                  />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Exact email you use for Claude.ai — this is where the private workspace invite is sent.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactEmail" className="flex items-center gap-2 text-sm">
                    <Mail className="w-3.5 h-3.5" /> Contact email (optional)
                  </Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData((p) => ({ ...p, contactEmail: e.target.value }))}
                    placeholder="Order confirmation (defaults to Claude email)"
                    className="h-11 rounded-xl text-base"
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm">Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
                    placeholder="Any special requests..."
                    className="rounded-xl min-h-[72px] text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">
                    Plan <span className="text-destructive">*</span>
                  </Label>
                  <div className="grid grid-cols-1 xs:grid-cols-2 gap-2.5 sm:gap-3">
                    {PLANS.map((plan) => (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => setSelectedPlanId(plan.id)}
                        className={cn(
                          'p-3 sm:p-3.5 rounded-xl border text-left transition-all',
                          selectedPlanId === plan.id
                            ? 'border-orange-500 bg-orange-500/10'
                            : 'border-border hover:border-orange-500/40'
                        )}
                      >
                        <p className="font-bold text-sm text-foreground">{plan.name}</p>
                        <p className="text-xs text-muted-foreground">{formatLkr(plan.fullPrice)}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">
                    How do you want to pay? <span className="text-destructive">*</span>
                  </Label>
                  <div className="grid grid-cols-1 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setPaymentMode('full')}
                      className={cn(
                        'p-4 rounded-2xl border-2 text-left transition-all',
                        paymentMode === 'full'
                          ? 'border-green-500 bg-green-500/10'
                          : 'border-border hover:border-green-500/40'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-black text-sm text-foreground flex items-center gap-2">
                            Pay in full
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-green-500 text-white uppercase tracking-wider">
                              Recommended
                            </span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            One transfer · no balance later · priority when slots open
                          </p>
                        </div>
                        <p className="text-base font-black text-foreground shrink-0">
                          {formatLkr(selectedPlan.fullPrice)}
                        </p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMode('reserve')}
                      className={cn(
                        'p-4 rounded-2xl border-2 text-left transition-all',
                        paymentMode === 'reserve'
                          ? 'border-orange-500 bg-orange-500/10'
                          : 'border-border hover:border-orange-500/40'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-black text-sm text-foreground">
                            Reserve with {reservePct}% now
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            Hold your slot · pay remaining {formatLkr(remainingBalance(selectedPlan.fullPrice, 'reserve'))} at activation
                          </p>
                        </div>
                        <p className="text-base font-black text-orange-400 shrink-0">
                          {formatLkr(amountDueNow(selectedPlan.fullPrice, 'reserve'))}
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full h-12 sm:h-12 rounded-2xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white"
                >
                  Continue · pay {formatLkr(amountDue)}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>
            ) : (
              <form
                onSubmit={handleSubmitPreorder}
                className="space-y-5 sm:space-y-6 p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl bg-card border border-border shadow-xl"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-black text-base sm:text-lg flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary shrink-0" />
                    Bank transfer
                  </h3>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setStep('details')}>
                    Edit
                  </Button>
                </div>

                <div className={cn(
                  'p-4 sm:p-5 rounded-2xl border text-center',
                  isFullPay
                    ? 'bg-green-500/10 border-green-500/25'
                    : 'bg-orange-500/10 border-orange-500/25'
                )}>
                  <p className={cn(
                    'text-[10px] sm:text-xs font-black uppercase tracking-widest mb-1',
                    isFullPay ? 'text-green-500' : 'text-orange-400'
                  )}>
                    {isFullPay ? 'Pay in full now' : `Pay ${reservePct}% reserve now`}
                  </p>
                  <p className="text-3xl sm:text-4xl font-black text-foreground mb-1">
                    {formatLkr(amountDue)}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {isFullPay
                      ? `Full plan price · no balance later`
                      : `of ${formatLkr(selectedPlan.fullPrice)} · remaining ${formatLkr(remaining)} at activation`}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 text-sm">
                  <div className="p-3 rounded-xl bg-secondary/50 border border-border">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Name</p>
                    <p className="font-medium text-foreground break-words">{formData.name}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-secondary/50 border border-border">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">WhatsApp</p>
                    <p className="font-medium text-foreground break-all">{formData.whatsapp}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-secondary/50 border border-border sm:col-span-2">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">
                      Claude email (workspace invite)
                    </p>
                    <p className="font-medium text-foreground font-mono break-all">
                      {formData.claudeEmail}
                    </p>
                  </div>
                </div>

                <div className="p-3.5 sm:p-4 rounded-2xl bg-secondary/50 border border-border space-y-2 text-sm">
                  <p className="font-semibold text-foreground mb-2 sm:mb-3">Bank details</p>
                  {[
                    { label: 'Bank', value: bankName },
                    { label: 'Branch', value: bankBranch },
                    { label: 'Account name', value: bankAccountName, copy: true },
                    { label: 'Account number', value: bankAccountNumber, copy: true, mono: true },
                  ].map((row) => (
                    <div key={row.label} className="flex items-start sm:items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-muted-foreground">{row.label}: </span>
                        <span
                          className={cn(
                            'font-medium text-foreground break-all',
                            row.mono && 'font-mono'
                          )}
                        >
                          {row.value}
                        </span>
                      </div>
                      {row.copy && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => copyToClipboard(row.value, row.label)}
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">
                        Beneficiary remarks / reference
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => copyToClipboard(orderId, 'Order ID')}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <p className="text-sm font-mono font-bold text-primary break-all">{orderId}</p>
                    <p className="text-xs text-primary/80 mt-1">
                      ⚡ Put this Order ID in the transfer remarks
                    </p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm">
                    Upload payment receipt <span className="text-destructive">*</span>
                  </Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Screenshot of the {formatLkr(amountDue)} transfer (JPG, PNG, PDF · max 10MB)
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {!proofFile ? (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full p-5 sm:p-6 border-2 border-dashed border-border rounded-2xl hover:border-orange-500/50 hover:bg-orange-500/5 transition-colors flex flex-col items-center gap-2 active:scale-[0.99]"
                    >
                      <Upload className="w-8 h-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Tap to upload receipt</p>
                    </button>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl border border-border">
                      {proofFile.type === 'application/pdf' ? (
                        <FileText className="w-5 h-5 text-destructive shrink-0" />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-primary shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{proofFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(proofFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <Button type="button" variant="ghost" size="icon" onClick={removeFile}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-sm text-muted-foreground space-y-1">
                  <p className="font-bold text-amber-500 flex items-center gap-2">
                    <Package className="w-4 h-4" /> Order terms
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm">
                    {isFullPay ? (
                      <>
                        <li>Full payment now — no second transfer.</li>
                        <li>Priority processing when workspace slots open.</li>
                      </>
                    ) : (
                      <>
                        <li>{reservePct}% now holds your private workspace slot.</li>
                        <li>Remaining {100 - reservePct}% is due before the invite is sent.</li>
                      </>
                    )}
                    <li>Invite goes to the Claude email you provided (Pro or Max seat).</li>
                    <li>20 day warranty after activation.</li>
                    <li>Payment is non-refundable once the invite is sent (contact us for issues covered by warranty).</li>
                  </ul>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-full h-12 sm:h-14 rounded-2xl font-black text-sm sm:text-base bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white shadow-lg shadow-orange-500/20"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Submitting order...
                    </>
                  ) : (
                    <>
                      Submit · WhatsApp auto-opens · {formatLkr(amountDue)}
                      <Check className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>

                <p className="text-center text-xs text-muted-foreground leading-relaxed px-1">
                  After submit, WhatsApp opens with Order ID, plan, payment, Claude email — just hit{' '}
                  <strong className="text-foreground">Send</strong>. Or message{' '}
                  <a
                    href={whatsappPreorderLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#25D366] font-semibold hover:underline"
                  >
                    +94 78 776 7869
                  </a>{' '}
                  manually.
                </p>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section ref={faqRef} className="py-12 sm:py-16 border-t border-border/50 scroll-mt-20 pb-28 md:pb-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-orange-500/10 mb-3">
                <HelpCircle className="w-6 h-6 text-orange-400" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-display font-black mb-2">
                Questions & answers
              </h2>
              <p className="text-sm text-muted-foreground">
                Private workspace, Pro/Max seats, deposit, warranty
              </p>
            </div>

            <Accordion type="single" collapsible className="w-full space-y-2">
              {FAQ_ITEMS.map((item, i) => (
                <AccordionItem
                  key={item.q}
                  value={`faq-${i}`}
                  className="border border-border rounded-2xl px-4 sm:px-5 bg-card data-[state=open]:border-orange-500/30"
                >
                  <AccordionTrigger className="text-left text-sm sm:text-base font-bold text-foreground hover:no-underline py-4 gap-3">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            <div className="mt-8 p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-border bg-card text-center">
              <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-2">
                Still unsure?
              </p>
              <p className="text-base sm:text-lg font-black text-foreground mb-4">
                Chat with us on WhatsApp — we&apos;ll guide you
              </p>
              <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 justify-center">
                <Button
                  className="rounded-2xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 text-white h-11"
                  onClick={() => scrollTo(checkoutRef)}
                >
                  Pre-order now
                </Button>
                <Button variant="outline" className="rounded-2xl font-bold h-11" asChild>
                  <a
                    href={`https://wa.me/${whatsappNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    +94 78 776 7869
                  </a>
                </Button>
              </div>
              <p className="mt-5 text-xs text-muted-foreground">
                <Link to="/track-order" className="underline hover:text-foreground">
                  Track order
                </Link>
                {' · '}
                <Link to="/products" className="underline hover:text-foreground">
                  All products
                </Link>
                {' · '}
                <button
                  type="button"
                  className="underline hover:text-foreground"
                  onClick={() => scrollTo(plansRef)}
                >
                  Plans
                </button>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ClaudePage;

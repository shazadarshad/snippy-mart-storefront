import { MessageCircle, Mail, Clock, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import SEO from '@/components/seo/SEO';
import PageHero from '@/components/layout/PageHero';

const ContactPage = () => {
  const faqs = [
    {
      question: 'How do I receive my subscription after purchase?',
      answer:
        'After payment is confirmed, Auto products appear on Track Order with your Order ID. Other products may be delivered via WhatsApp depending on the item.',
    },
    {
      question: 'What payment methods do you accept?',
      answer:
        'Bank transfer and crypto options at checkout. Upload your payment proof when you place the order.',
    },
    {
      question: 'How do I track my order?',
      answer:
        'Use your Order ID on the Track Order page. Status moves from pending payment → payment confirmed → processing → completed.',
    },
    {
      question: 'Can I get a refund if something fails?',
      answer:
        'See our Refund Policy. Non Warranty products and provider-side issues are not refundable. Contact WhatsApp with your Order ID for help.',
    },
    {
      question: 'How long do subscriptions last?',
      answer:
        'Durations vary by product (often 1 month to 1 year). Check the plan name on each product before checkout.',
    },
  ];

  const contacts = [
    {
      icon: MessageCircle,
      title: 'WhatsApp',
      detail: '+94 78 776 7869',
      hint: 'Fastest for order help',
      href: 'https://wa.me/94787767869',
      cta: 'Chat on WhatsApp',
      variant: 'whatsapp' as const,
    },
    {
      icon: Mail,
      title: 'Email',
      detail: 'hello@snippymart.com',
      hint: 'We reply as soon as we can',
      href: 'mailto:hello@snippymart.com',
      cta: 'Send email',
      variant: 'default' as const,
    },
  ];

  return (
    <div className="min-h-dvh page-mesh pb-safe pb-16 sm:pb-20">
      <SEO
        title="Contact Us"
        description="Contact Snippy Mart on WhatsApp or email hello@snippymart.com. FAQs on delivery, payments, and tracking."
      />

      <PageHero
        eyebrow="Support"
        title={
          <>
            Get in <span className="gradient-text">touch</span>
          </>
        }
        description="WhatsApp is fastest. Or email us — include your Order ID if you have one."
      />

      <section className="container mx-auto px-3 sm:px-4 pb-10 sm:pb-14">
        {/* Contact cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-3xl mx-auto mb-8 sm:mb-12">
          {contacts.map((c) => (
            <div
              key={c.title}
              className="surface-card p-5 sm:p-6 flex flex-col h-full border border-border"
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <c.icon className="w-5 h-5 text-primary" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                {c.title}
              </p>
              <p className="font-bold text-foreground text-base sm:text-lg break-all">{c.detail}</p>
              <p className="text-xs text-muted-foreground mt-1 mb-5">{c.hint}</p>
              <Button
                variant={c.variant}
                className="w-full h-11 rounded-xl font-bold mt-auto touch-manipulation"
                asChild
              >
                <a href={c.href} target={c.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">
                  <c.icon className="w-4 h-4 mr-2" />
                  {c.cta}
                  <ExternalLink className="w-3.5 h-3.5 ml-2 opacity-70" />
                </a>
              </Button>
            </div>
          ))}
        </div>

        {/* Hours note */}
        <div className="max-w-3xl mx-auto mb-10 sm:mb-14 flex items-start gap-3 p-4 rounded-2xl bg-secondary/40 border border-border">
          <Clock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground">Reply times</p>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mt-0.5">
              We usually reply within a few hours. WhatsApp is best for urgent order issues.
            </p>
          </div>
        </div>

        {/* FAQs */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-lg sm:text-xl font-display font-bold text-foreground mb-4">
            FAQs
          </h2>
          <Accordion type="single" collapsible className="space-y-2">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={faq.question}
                value={`faq-${i}`}
                className="surface-card px-4 border data-[state=open]:border-primary/25"
              >
                <AccordionTrigger className="text-left text-sm font-semibold hover:no-underline py-4">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;

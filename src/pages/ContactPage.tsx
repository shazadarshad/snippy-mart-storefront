import { useState } from 'react';
import { MessageCircle, Mail, Clock, Send } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import SEO from '@/components/seo/SEO';
import PageHero from '@/components/layout/PageHero';

const ContactPage = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

  const faqs = [
    {
      question: 'How do I receive my subscription after purchase?',
      answer:
        "After payment is confirmed, you'll receive access details via WhatsApp and/or the track-order page, depending on the product.",
    },
    {
      question: 'What payment methods do you accept?',
      answer:
        'Bank transfer is the primary method. Upload your receipt at checkout. Other options may be shown depending on the product.',
    },
    {
      question: 'How do I track my order?',
      answer:
        'Use your Order ID on the Track Order page. Status updates from pending payment → payment confirmed → processing → completed.',
    },
    {
      question: 'Can I get a refund if something fails?',
      answer:
        "Yes, within our refund policy. Contact WhatsApp with your Order ID and we'll help resolve issues quickly.",
    },
    {
      question: 'How long do subscriptions last?',
      answer:
        'Durations vary by product (often 1 month to 1 year). Check the plan name on each product before checkout.',
    },
    {
      question: 'Do you offer team or family plans?',
      answer:
        'Many products include multi-seat options. Check plan variants on the product, or ask us on WhatsApp.',
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: 'Message noted',
      description: 'For fastest reply, also message us on WhatsApp with your Order ID if you have one.',
    });
    setFormData({ name: '', email: '', message: '' });
  };

  return (
    <div className="min-h-screen page-mesh pb-20">
      <SEO
        title="Contact Us"
        description="Contact Snippy Mart via WhatsApp or form. FAQs on delivery, payments, tracking, and refunds."
      />

      <PageHero
        eyebrow="Support"
        title={
          <>
            Get in <span className="gradient-text">touch</span>
          </>
        }
        description="WhatsApp is fastest. Or send a message below — include your Order ID if you have one."
      />

      <section className="container mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-4xl mx-auto mb-12">
          {[
            {
              icon: MessageCircle,
              t: 'WhatsApp',
              d: '+94 78 776 7869',
              href: 'https://wa.me/94787767869',
            },
            { icon: Mail, t: 'Email', d: 'Via contact form', href: '#form' },
            { icon: Clock, t: 'Hours', d: 'Usually 24/7 replies', href: undefined },
          ].map((c) => {
            const inner = (
              <div className="surface-card-interactive p-5 h-full">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                  <c.icon className="w-5 h-5 text-primary" />
                </div>
                <p className="font-bold text-foreground text-sm">{c.t}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{c.d}</p>
              </div>
            );
            return c.href?.startsWith('http') ? (
              <a key={c.t} href={c.href} target="_blank" rel="noopener noreferrer">
                {inner}
              </a>
            ) : (
              <div key={c.t}>{inner}</div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <div id="form" className="surface-card p-6 sm:p-8 scroll-mt-24">
            <h2 className="text-lg font-display font-bold text-foreground mb-1">Send a message</h2>
            <p className="text-xs text-muted-foreground mb-6">
              We read every message. WhatsApp is still quicker for order issues.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  className="h-11 rounded-xl"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                  className="h-11 rounded-xl"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={(e) => setFormData((p) => ({ ...p, message: e.target.value }))}
                  className="min-h-[120px] rounded-xl"
                  required
                />
              </div>
              <Button type="submit" variant="hero" className="w-full h-11 rounded-xl font-bold">
                <Send className="w-4 h-4 mr-2" />
                Send message
              </Button>
              <Button type="button" variant="whatsapp" className="w-full h-11 rounded-xl font-bold" asChild>
                <a href="https://wa.me/94787767869" target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Prefer WhatsApp
                </a>
              </Button>
            </form>
          </div>

          <div>
            <h2 className="text-lg font-display font-bold text-foreground mb-4">FAQs</h2>
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
        </div>
      </section>
    </div>
  );
};

export default ContactPage;

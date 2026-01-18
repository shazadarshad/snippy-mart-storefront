import { useState } from 'react';
import { MessageCircle, Mail, Clock, ChevronDown, Send } from 'lucide-react';
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

const ContactPage = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  const faqs = [
    {
      question: 'How do I receive my subscription after purchase?',
      answer: 'After completing your order, you\'ll receive your subscription details directly on WhatsApp within minutes. This includes login credentials or activation codes depending on the service.',
    },
    {
      question: 'Are these subscriptions genuine?',
      answer: 'Yes, all subscriptions offered on Snippy Mart are 100% genuine. We partner with authorized distributors to ensure you get authentic service access.',
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept various payment methods including bank transfers, digital wallets, and cryptocurrency. Payment instructions are provided after you place your order.',
    },
    {
      question: 'Can I get a refund if I\'m not satisfied?',
      answer: 'Yes, we offer a satisfaction guarantee. If there\'s an issue with your subscription, contact us on WhatsApp and we\'ll resolve it or provide a refund within our policy terms.',
    },
    {
      question: 'How long do subscriptions last?',
      answer: 'Subscription durations vary by product, typically ranging from 1 month to 1 year. The duration is clearly mentioned on each product page.',
    },
    {
      question: 'Do you offer group or family plans?',
      answer: 'Yes, many of our subscriptions include family or team options. Check the product description or contact us for specific details about multi-user plans.',
    },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Message sent!",
      description: "We'll get back to you as soon as possible.",
    });
    setFormData({ name: '', email: '', message: '' });
  };

  return (
    <div className="min-h-screen pt-24 pb-20">
      {/* Hero */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-6">
              Get in <span className="gradient-text">Touch</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Have questions? We'd love to hear from you. Our team is here to help.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="pb-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <a
              href="https://wa.me/94771234567"
              target="_blank"
              rel="noopener noreferrer"
              className="p-6 rounded-2xl bg-card border border-border card-hover text-center group"
            >
              <div className="w-14 h-14 rounded-xl bg-[#25D366]/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-[#25D366]/20 transition-colors">
                <MessageCircle className="w-7 h-7 text-[#25D366]" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">WhatsApp</h3>
              <p className="text-sm text-muted-foreground">Fastest response</p>
              <p className="text-sm text-primary mt-2">+1 234 567 8900</p>
            </a>

            <div className="p-6 rounded-2xl bg-card border border-border text-center">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Email</h3>
              <p className="text-sm text-muted-foreground">For detailed inquiries</p>
              <p className="text-sm text-primary mt-2">support@snippymart.com</p>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border text-center">
              <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <Clock className="w-7 h-7 text-accent" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Support Hours</h3>
              <p className="text-sm text-muted-foreground">We're available</p>
              <p className="text-sm text-primary mt-2">24/7, Always</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form & FAQ */}
      <section className="py-16 bg-secondary/20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Contact Form */}
            <div>
              <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-6">
                Send us a Message
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-foreground">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Your name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="mt-1.5 h-12 bg-card border-border"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-foreground">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="mt-1.5 h-12 bg-card border-border"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="message" className="text-foreground">Message</Label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder="How can we help you?"
                    value={formData.message}
                    onChange={handleInputChange}
                    className="mt-1.5 bg-card border-border min-h-[150px]"
                    required
                  />
                </div>
                <Button type="submit" variant="hero" size="lg" className="w-full">
                  Send Message
                  <Send className="w-4 h-4 ml-2" />
                </Button>
              </form>
            </div>

            {/* FAQ */}
            <div id="faq">
              <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-6">
                Frequently Asked Questions
              </h2>
              <Accordion type="single" collapsible className="space-y-3">
                {faqs.map((faq, index) => (
                  <AccordionItem
                    key={index}
                    value={`item-${index}`}
                    className="bg-card border border-border rounded-xl px-4 data-[state=open]:border-primary/50"
                  >
                    <AccordionTrigger className="text-left hover:no-underline py-4 text-foreground">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-4">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </div>
      </section>

      {/* WhatsApp CTA */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-4">
              Prefer instant support?
            </h2>
            <p className="text-muted-foreground mb-6">
              Get immediate assistance from our team on WhatsApp. We're available 24/7 to help with any questions.
            </p>
            <Button variant="whatsapp" size="xl" asChild>
              <a href="https://wa.me/94771234567" target="_blank" rel="noopener noreferrer">
                <MessageCircle className="w-5 h-5 mr-2" />
                Chat on WhatsApp Now
              </a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;

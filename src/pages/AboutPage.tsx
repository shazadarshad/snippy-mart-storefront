import { Shield, Target, Heart, Users, Award, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TestimonialCarousel } from '@/components/TestimonialCarousel';
import SEO from '@/components/seo/SEO';
import PageHero from '@/components/layout/PageHero';
import { Button } from '@/components/ui/button';

const AboutPage = () => {
  const values = [
    {
      icon: Shield,
      title: 'Trust & security',
      description: 'Encrypted transactions and careful handling of your order data.',
    },
    {
      icon: Heart,
      title: 'Customer first',
      description: 'Clear statuses, WhatsApp support, and help when something goes wrong.',
    },
    {
      icon: Zap,
      title: 'Fast delivery',
      description: 'Most digital products delivered shortly after payment is confirmed.',
    },
    {
      icon: Award,
      title: 'Quality focus',
      description: 'We list products we can support — not endless junk listings.',
    },
  ];

  const stats = [
    { value: '10K+', label: 'Orders served' },
    { value: '50+', label: 'Products' },
    { value: '24/7', label: 'WhatsApp help' },
    { value: 'Live', label: 'Order tracking' },
  ];

  return (
    <div className="min-h-screen page-mesh pb-20">
      <SEO
        title="About Us"
        description="Learn about Snippy Mart — affordable premium digital subscriptions with secure checkout and support."
      />

      <PageHero
        eyebrow="Our story"
        title={
          <>
            About <span className="gradient-text">Snippy Mart</span>
          </>
        }
        description="We make premium digital subscriptions accessible — fair pricing, transparent checkout, and human support."
      />

      <section className="container mx-auto px-4 pb-14">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto">
          {stats.map((s) => (
            <div key={s.label} className="surface-card p-4 sm:p-5 text-center">
              <p className="text-xl sm:text-2xl font-display font-black text-foreground">{s.value}</p>
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground mt-1">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto">
          <div className="surface-card p-6 sm:p-8">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-display font-bold text-foreground mb-3">Mission</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Democratize access to premium digital tools with affordable pricing, without cutting
              corners on support or delivery quality.
            </p>
          </div>
          <div className="surface-card p-6 sm:p-8">
            <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
              <Users className="w-5 h-5 text-accent" />
            </div>
            <h2 className="text-xl font-display font-bold text-foreground mb-3">Vision</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Be the most trusted local-first digital subscription mart — simple to buy, easy to
              track, and reliable when you need help.
            </p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-16">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-display font-black text-foreground">
            What we <span className="gradient-text">stand for</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl mx-auto">
          {values.map((v) => (
            <div key={v.title} className="surface-card-interactive p-5 sm:p-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                <v.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-bold text-foreground mb-1.5">{v.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{v.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 pb-16">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-display font-black text-foreground mb-2">
            From our customers
          </h2>
        </div>
        <TestimonialCarousel />
      </section>

      <section className="container mx-auto px-4">
        <div className="surface-card p-8 text-center max-w-xl mx-auto">
          <h3 className="text-xl font-display font-bold text-foreground mb-2">Ready to shop?</h3>
          <p className="text-sm text-muted-foreground mb-5">Browse the vault or message us anytime.</p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button variant="hero" className="rounded-xl" asChild>
              <Link to="/products">Browse products</Link>
            </Button>
            <Button variant="outline" className="rounded-xl" asChild>
              <Link to="/contact">Contact</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;

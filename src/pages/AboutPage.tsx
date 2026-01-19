import { Shield, Target, Heart, Users, Award, Zap } from 'lucide-react';
import { TestimonialCarousel } from '@/components/TestimonialCarousel';

const AboutPage = () => {
  const values = [
    {
      icon: Shield,
      title: 'Trust & Security',
      description: 'Your security is our priority. All transactions are encrypted and your data is protected.',
    },
    {
      icon: Heart,
      title: 'Customer First',
      description: 'We put our customers at the heart of everything we do, ensuring satisfaction at every step.',
    },
    {
      icon: Zap,
      title: 'Instant Delivery',
      description: 'No waiting. Get your subscription details delivered within minutes of purchase.',
    },
    {
      icon: Award,
      title: 'Quality Assurance',
      description: 'We only offer genuine, premium subscriptions that meet our high standards.',
    },
  ];

  const stats = [
    { value: '10,000+', label: 'Happy Customers' },
    { value: '50+', label: 'Premium Products' },
    { value: '99.9%', label: 'Uptime Guarantee' },
    { value: '24/7', label: 'Support Available' },
  ];

  return (
    <div className="min-h-screen pt-24 pb-20">
      {/* Hero */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-6">
              About <span className="gradient-text">Snippy Mart</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              We're on a mission to make premium digital subscriptions accessible to everyone.
              Founded with the belief that quality digital services shouldn't break the bank,
              Snippy Mart has grown to become a trusted destination for thousands of customers worldwide.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 bg-secondary/20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 rounded-2xl bg-card border border-border">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-4">Our Mission</h2>
              <p className="text-muted-foreground leading-relaxed">
                To democratize access to premium digital subscriptions by offering them at
                affordable prices without compromising on quality or service. We believe
                everyone deserves access to the best digital tools and entertainment.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-card border border-border">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-accent" />
              </div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-4">Our Vision</h2>
              <p className="text-muted-foreground leading-relaxed">
                To become the world's most trusted platform for digital subscription services,
                known for our unbeatable prices, instant delivery, and exceptional customer
                support that treats every customer like family.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="text-center p-6 rounded-2xl bg-card border border-border">
                <div className="text-3xl md:text-4xl font-display font-bold gradient-text mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-secondary/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              Our <span className="gradient-text">Values</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              These core values guide everything we do at Snippy Mart.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <div
                key={index}
                className="p-6 rounded-2xl bg-card border border-border card-hover text-center"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <value.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{value.title}</h3>
                <p className="text-sm text-muted-foreground">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-6 text-center">
              Our <span className="gradient-text">Story</span>
            </h2>
            <div className="prose prose-invert max-w-none">
              <p className="text-muted-foreground leading-relaxed mb-4">
                Snippy Mart started with a simple observation: premium digital subscriptions are
                becoming essential for work, education, and entertainment, but their prices keep
                rising. We saw an opportunity to bridge this gap.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                By leveraging partnerships and innovative business models, we created a platform
                where users can access the same premium services at a fraction of the cost. Our
                focus on WhatsApp-based communication ensures a personal touch that larger platforms
                often lack.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Today, we serve thousands of satisfied customers who trust us for their digital
                subscription needs. As we continue to grow, our commitment remains the same:
                affordable access, instant delivery, and customer service that cares.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-4">
              Trusted by <span className="gradient-text">Thousands</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We take pride in our service. Here's what some of our customers have to say.
            </p>
          </div>
          <TestimonialCarousel />
        </div>
      </section>
    </div>
  );
};

export default AboutPage;

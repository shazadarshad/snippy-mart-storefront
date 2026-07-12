import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Zap,
  Shield,
  Clock,
  MessageCircle,
  ChevronRight,
  Search,
  Sparkles,
  BadgeCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/products/ProductCard';
import ProductDetailModal from '@/components/products/ProductDetailModal';
import { useProducts, type Product } from '@/hooks/useProducts';
import { ProductsGridSkeleton } from '@/components/products/ProductSkeleton';
import { TestimonialCarousel } from '@/components/TestimonialCarousel';
import SEO from '@/components/seo/SEO';
import ClaudePromo from '@/components/ClaudePromo';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 260, damping: 22 },
  },
};

const HomePage = () => {
  const { data: products = [], isLoading } = useProducts();
  const popularProducts = products.filter((p) => p.is_featured).slice(0, 5);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleViewDetails = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedProduct(null), 300);
  };

  const features = [
    {
      icon: Zap,
      title: 'Fast delivery',
      description: 'Most orders activated quickly after payment confirmation.',
    },
    {
      icon: Shield,
      title: 'Trusted checkout',
      description: 'Bank transfer with receipt upload and order tracking.',
    },
    {
      icon: BadgeCheck,
      title: 'Clear status',
      description: 'Track payment confirmed → processing → completed live.',
    },
    {
      icon: MessageCircle,
      title: 'WhatsApp support',
      description: 'Real humans on WhatsApp when you need help.',
    },
  ];

  const steps = [
    {
      number: '01',
      title: 'Pick a product',
      description: 'Browse the mart or grab Claude Team from the homepage.',
    },
    {
      number: '02',
      title: 'Pay & upload proof',
      description: 'Bank transfer, upload receipt, get your Order ID instantly.',
    },
    {
      number: '03',
      title: 'Track & receive',
      description: 'Follow status online — we confirm payment and deliver access.',
    },
  ];

  return (
    <div className="min-h-screen">
      <SEO
        title="Premium Digital Subscriptions"
        description="Snippy Mart — Claude Team, AI tools, streaming & more. Instant WhatsApp support, bank checkout, live order tracking."
      />

      {/* Hero */}
      <section className="relative min-h-[88vh] pb-10 pt-20 lg:pt-28 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-background">
          <div className="absolute top-1/4 left-1/4 w-48 sm:w-96 h-48 sm:h-96 bg-primary/20 rounded-full blur-[60px] sm:blur-[120px] animate-pulse-soft" />
          <div
            className="absolute bottom-1/4 right-1/4 w-48 sm:w-96 h-48 sm:h-96 bg-orange-500/15 rounded-full blur-[60px] sm:blur-[120px] animate-pulse-soft"
            style={{ animationDelay: '1s' }}
          />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-accent/5 rounded-full blur-[100px]" />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:30px_30px] sm:bg-[size:48px_48px]" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-sm border border-white/10 mb-5 sm:mb-7 animate-fade-in">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-foreground">
                Premium digital · Claude · AI tools
              </span>
            </div>

            <h1
              className="text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-display font-black text-foreground mb-4 sm:mb-6 animate-fade-in tracking-tighter leading-[0.92]"
              style={{ animationDelay: '0.08s' }}
            >
              Digital access.
              <br />
              <span className="gradient-text">Delivered smart.</span>
            </h1>

            <p
              className="text-sm md:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto mb-6 sm:mb-8 animate-fade-in font-medium px-2"
              style={{ animationDelay: '0.15s' }}
            >
              Claude Team workspaces, AI tools, design & streaming — fair prices, bank checkout,
              live tracking, WhatsApp support.
            </p>

            <div
              className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 justify-center animate-fade-in px-1 sm:px-0 mb-5"
              style={{ animationDelay: '0.22s' }}
            >
              <Button
                size="xl"
                className="h-12 sm:h-14 text-sm sm:text-base rounded-2xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white shadow-lg shadow-orange-500/25"
                asChild
              >
                <Link to="/claude">
                  <Zap className="w-5 h-5 mr-2" />
                  Purchase Claude
                </Link>
              </Button>
              <Button variant="hero" size="xl" className="h-12 sm:h-14 text-sm sm:text-base rounded-2xl" asChild>
                <Link to="/products">
                  Explore mart
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button
                variant="heroOutline"
                size="xl"
                className="h-12 sm:h-14 text-sm sm:text-base rounded-2xl glass-sm"
                asChild
              >
                <Link to="/track-order">
                  <Search className="w-5 h-5 mr-2" />
                  Track order
                </Link>
              </Button>
            </div>

            {/* Inline Claude teaser strip */}
            <div className="max-w-xl mx-auto animate-fade-in" style={{ animationDelay: '0.28s' }}>
              <ClaudePromo variant="compact" />
            </div>

            <div
              className="grid grid-cols-3 gap-2 sm:gap-8 mt-10 sm:mt-16 pt-8 border-t border-white/5 animate-fade-in"
              style={{ animationDelay: '0.35s' }}
            >
              <div className="p-2">
                <div className="text-xl sm:text-4xl font-black text-foreground mb-1">2K+</div>
                <div className="text-[9px] sm:text-xs text-muted-foreground uppercase font-black tracking-widest">
                  Customers
                </div>
              </div>
              <div className="p-2 border-x border-white/5">
                <div className="text-xl sm:text-4xl font-black text-foreground mb-1">50+</div>
                <div className="text-[9px] sm:text-xs text-muted-foreground uppercase font-black tracking-widest">
                  Products
                </div>
              </div>
              <div className="p-2">
                <div className="text-xl sm:text-4xl font-black text-foreground mb-1">24/7</div>
                <div className="text-[9px] sm:text-xs text-muted-foreground uppercase font-black tracking-widest">
                  Support
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Claude full promo */}
      <ClaudePromo variant="section" />

      {/* Why us */}
      <section className="py-20 lg:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/15 to-background" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-3">
              Why <span className="gradient-text">Snippy Mart</span>
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Built for smooth digital purchases — not guesswork.
            </p>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
          >
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                variants={itemVariants}
                className="group p-5 sm:p-6 rounded-2xl bg-card/80 backdrop-blur-sm border border-border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all"
              >
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1.5">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Popular products + banner */}
      <section className="py-20 lg:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/30 to-accent/5" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="mb-6 sm:mb-8">
            <ClaudePromo variant="banner" />
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-3">
                Popular <span className="gradient-text">products</span>
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-xl">
                Top picks from the mart — plus Claude on its own landing page.
              </p>
            </div>
            <Button variant="outline" size="lg" className="rounded-xl w-fit" asChild>
              <Link to="/products">
                View all
                <ChevronRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>

          {isLoading ? (
            <ProductsGridSkeleton count={5} />
          ) : popularProducts.length > 0 ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-5"
            >
              {popularProducts.map((product) => (
                <motion.div key={product.id} variants={itemVariants}>
                  <ProductCard product={product} onViewDetails={handleViewDetails} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-12 text-muted-foreground rounded-2xl border border-dashed border-border">
              No products yet — try{' '}
              <Link to="/claude" className="text-orange-400 font-bold underline">
                Claude Team
              </Link>{' '}
              meanwhile.
            </div>
          )}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 lg:py-24 bg-secondary/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-3">
              What customers <span className="gradient-text">say</span>
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Real feedback from people who shop with us.
            </p>
          </div>
          <TestimonialCarousel />
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 lg:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-secondary/20 via-background to-secondary/10" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-3">
              How it <span className="gradient-text">works</span>
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Three steps from browse to access.
            </p>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 max-w-5xl mx-auto"
          >
            {steps.map((step, index) => (
              <motion.div key={step.number} variants={itemVariants} className="relative">
                <div className="p-6 sm:p-8 rounded-2xl bg-card/90 backdrop-blur-sm border border-border text-center h-full hover:border-primary/30 transition-colors">
                  <div className="text-4xl sm:text-5xl font-display font-bold gradient-text mb-3">
                    {step.number}
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:flex absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                    <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                      <ArrowRight className="w-3.5 h-3.5 text-primary-foreground" />
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 lg:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-orange-500/5 to-accent/10" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-4">
              Ready to get access?
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground mb-8">
              Start with Claude Team or browse the full mart. We&apos;re on WhatsApp if you need a hand.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                size="xl"
                className="h-14 rounded-2xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 text-white"
                asChild
              >
                <Link to="/claude">
                  <Zap className="w-5 h-5 mr-2" />
                  Get Claude
                </Link>
              </Button>
              <Button variant="whatsapp" size="xl" className="h-14 rounded-2xl" asChild>
                <a href="https://wa.me/94787767869" target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  WhatsApp us
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <ProductDetailModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default HomePage;

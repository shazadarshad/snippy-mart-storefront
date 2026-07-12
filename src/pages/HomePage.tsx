import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Zap,
  Shield,
  MessageCircle,
  ChevronRight,
  Search,
  BadgeCheck,
  Package,
  Truck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/products/ProductCard';
import ProductDetailModal from '@/components/products/ProductDetailModal';
import { useProducts, type Product } from '@/hooks/useProducts';
import { ProductsGridSkeleton } from '@/components/products/ProductSkeleton';
import { TestimonialCarousel } from '@/components/TestimonialCarousel';
import SEO from '@/components/seo/SEO';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 280, damping: 24 },
  },
};

const HomePage = () => {
  const { data: products = [], isLoading } = useProducts();
  const popularProducts = products.filter((p) => p.is_featured).slice(0, 8);
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
      description: 'Access shortly after payment is confirmed.',
    },
    {
      icon: Shield,
      title: 'Secure checkout',
      description: 'Bank transfer + receipt + Order ID tracking.',
    },
    {
      icon: BadgeCheck,
      title: 'Live status',
      description: 'Payment confirmed → processing → completed.',
    },
    {
      icon: MessageCircle,
      title: 'WhatsApp help',
      description: 'Human support when you need it.',
    },
  ];

  const steps = [
    { n: '1', title: 'Browse', desc: 'Pick from 50+ digital products.', icon: Package },
    { n: '2', title: 'Checkout', desc: 'Pay by bank and upload proof.', icon: Shield },
    { n: '3', title: 'Receive', desc: 'Track status and get access.', icon: Truck },
  ];

  return (
    <div className="min-h-screen page-mesh">
      <SEO
        title="Premium Digital Subscriptions"
        description="Snippy Mart — premium digital subscriptions at fair prices. Bank checkout, live order tracking, WhatsApp support."
      />

      {/* Hero */}
      <section className="relative min-h-[85vh] flex items-center pt-20 pb-12 lg:pt-24 overflow-hidden">
        <div className="absolute inset-0 dot-grid opacity-30 pointer-events-none" />
        <div className="absolute top-20 right-0 w-72 h-72 bg-primary/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-10 left-0 w-80 h-80 bg-accent/10 rounded-full blur-[110px] pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            <div className="lg:col-span-7 text-center lg:text-left">
              <p className="page-eyebrow mb-5 animate-fade-in">Premium digital mart</p>
              <h1 className="page-title mb-5 animate-fade-in" style={{ animationDelay: '0.05s' }}>
                Subscriptions that
                <br />
                <span className="gradient-text">just work.</span>
              </h1>
              <p
                className="page-lead mb-8 animate-fade-in lg:mx-0 mx-auto"
                style={{ animationDelay: '0.1s' }}
              >
                AI tools, design software, streaming and more — fair prices, clear checkout, and
                WhatsApp support when you need a hand.
              </p>
              <div
                className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start animate-fade-in"
                style={{ animationDelay: '0.15s' }}
              >
                <Button variant="hero" size="xl" className="h-12 sm:h-14 rounded-2xl" asChild>
                  <Link to="/products">
                    Browse products
                    <ArrowRight className="w-5 h-5 ml-1" />
                  </Link>
                </Button>
                <Button variant="outline" size="xl" className="h-12 sm:h-14 rounded-2xl border-2" asChild>
                  <Link to="/track-order">
                    <Search className="w-5 h-5 mr-2" />
                    Track order
                  </Link>
                </Button>
              </div>

              <div
                className="mt-10 grid grid-cols-3 gap-3 sm:gap-6 max-w-md mx-auto lg:mx-0 animate-fade-in"
                style={{ animationDelay: '0.2s' }}
              >
                {[
                  { v: '2K+', l: 'Customers' },
                  { v: '50+', l: 'Products' },
                  { v: '24/7', l: 'Support' },
                ].map((s) => (
                  <div key={s.l} className="surface-card p-3 sm:p-4 text-center lg:text-left">
                    <p className="text-xl sm:text-2xl font-display font-black text-foreground">{s.v}</p>
                    <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {s.l}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right panel */}
            <div className="lg:col-span-5 animate-fade-in" style={{ animationDelay: '0.12s' }}>
              <div className="surface-card p-5 sm:p-7 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
                <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-4">
                  How checkout works
                </p>
                <div className="space-y-3 relative z-10">
                  {steps.map((step) => (
                    <div
                      key={step.n}
                      className="flex gap-3 p-3.5 rounded-2xl bg-secondary/40 border border-border/60"
                    >
                      <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                        <step.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">
                          <span className="text-primary mr-1.5">{step.n}.</span>
                          {step.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button className="w-full mt-5 h-11 rounded-xl font-bold" variant="whatsapp" asChild>
                  <a href="https://wa.me/94787767869" target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Chat on WhatsApp
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section-shell border-t border-border/40">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10 sm:mb-14">
            <p className="page-eyebrow mb-3">Why shop here</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-black text-foreground">
              Built for smooth <span className="gradient-text">digital buys</span>
            </h2>
          </div>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {features.map((f) => (
              <motion.div key={f.title} variants={itemVariants} className="surface-card-interactive p-5 sm:p-6">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-bold text-foreground mb-1.5">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Products */}
      <section className="section-shell border-t border-border/40 bg-secondary/10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-10">
            <div>
              <p className="page-eyebrow mb-3">Catalogue</p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-black text-foreground">
                Popular <span className="gradient-text">products</span>
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground mt-2 max-w-lg">
                Featured picks from the vault. Open any card to choose a plan and checkout.
              </p>
            </div>
            <Button variant="outline" className="rounded-xl w-fit shrink-0" asChild>
              <Link to="/products">
                View all
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>

          {isLoading ? (
            <ProductsGridSkeleton count={8} />
          ) : popularProducts.length > 0 ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5"
            >
              {popularProducts.map((product) => (
                <motion.div key={product.id} variants={itemVariants}>
                  <ProductCard product={product} onViewDetails={handleViewDetails} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="surface-card p-12 text-center text-muted-foreground">
              No featured products yet.{' '}
              <Link to="/products" className="text-primary font-semibold underline">
                Browse all
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Testimonials */}
      <section className="section-shell border-t border-border/40">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <p className="page-eyebrow mb-3">Social proof</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-black text-foreground">
              What customers <span className="gradient-text">say</span>
            </h2>
          </div>
          <TestimonialCarousel />
        </div>
      </section>

      {/* CTA */}
      <section className="section-shell border-t border-border/40">
        <div className="container mx-auto px-4">
          <div className="surface-card relative overflow-hidden p-8 sm:p-12 text-center max-w-3xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 pointer-events-none" />
            <div className="relative z-10">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-black text-foreground mb-3">
                Ready when you are
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground mb-7 max-w-md mx-auto">
                Browse the catalogue or message us for a recommendation.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button variant="hero" size="lg" className="h-12 rounded-xl" asChild>
                  <Link to="/products">
                    Shop products
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
                <Button variant="whatsapp" size="lg" className="h-12 rounded-xl" asChild>
                  <a href="https://wa.me/94787767869" target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    WhatsApp
                  </a>
                </Button>
              </div>
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

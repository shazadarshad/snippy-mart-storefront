import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Shield, Clock, MessageCircle, ChevronRight, Loader2 } from 'lucide-react';
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
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 260,
      damping: 20,
    },
  },
};

const HomePage = () => {
  const { data: products = [], isLoading } = useProducts();
  const popularProducts = products.filter(p => p.is_featured).slice(0, 5);
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
      title: 'Instant Delivery',
      description: 'Get access to your subscriptions within minutes of purchase.',
    },
    {
      icon: Shield,
      title: 'Trusted Service',
      description: 'Secure transactions with 100% satisfaction guarantee.',
    },
    {
      icon: Clock,
      title: 'Affordable Pricing',
      description: 'Premium subscriptions at a fraction of the regular cost.',
    },
    {
      icon: MessageCircle,
      title: 'WhatsApp Support',
      description: '24/7 customer support via WhatsApp for quick assistance.',
    },
  ];

  const steps = [
    {
      number: '01',
      title: 'Choose Your Product',
      description: 'Browse our collection of premium digital subscriptions.',
    },
    {
      number: '02',
      title: 'Checkout with WhatsApp',
      description: 'Complete your order using just your WhatsApp number.',
    },
    {
      number: '03',
      title: 'Receive Instant Access',
      description: 'Get your subscription details delivered immediately.',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen pt-24 lg:pt-28 flex items-center justify-center overflow-hidden">
        {/* Background Effects - Hidden on mobile for performance */}
        <div className="absolute inset-0 bg-background">
          <div className="hidden sm:block absolute top-1/4 left-1/4 w-64 md:w-96 h-64 md:h-96 bg-primary/20 rounded-full blur-[80px] md:blur-[120px] animate-pulse-soft" />
          <div className="hidden sm:block absolute bottom-1/4 right-1/4 w-64 md:w-96 h-64 md:h-96 bg-accent/20 rounded-full blur-[80px] md:blur-[120px] animate-pulse-soft" style={{ animationDelay: '1s' }} />
          <div className="hidden sm:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-primary/5 rounded-full blur-[80px] md:blur-[100px]" />
        </div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/80 border border-border mb-8 animate-fade-in">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Premium Digital Subscriptions</span>
            </div>

            <SEO
              description="Get premium digital subscriptions for tools, streaming, and creative software at unbeatable prices. Instant WhatsApp delivery available."
              jsonLd={{
                "@context": "https://schema.org",
                "@type": "Organization",
                "name": "Snippy Mart",
                "url": "https://snippymart.vercel.app",
                "logo": "https://snippymart.vercel.app/android-chrome-512x512.png",
                "sameAs": [
                  "https://twitter.com/SnippyMart",
                  "https://facebook.com/SnippyMart"
                ],
                "contactPoint": {
                  "@type": "ContactPoint",
                  "telephone": "+94787767869",
                  "contactType": "customer service",
                  "availableLanguage": ["English", "Sinhala"]
                }
              }}
            />

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-foreground mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              Premium Digital Subscriptions.{' '}
              <span className="gradient-text">Instant Access.</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              AI tools, design software, streaming & more — affordable and fast.
              Premium digital subscriptions at unbeatable prices.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <Button variant="hero" size="xl" asChild>
                <Link to="/products">
                  Browse Products
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button variant="heroOutline" size="xl" asChild>
                <a href="https://wa.me/94787767869" target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Contact on WhatsApp
                </a>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 sm:gap-8 mt-12 sm:mt-16 pt-12 sm:pt-16 pb-16 sm:pb-24 border-t border-border/50 animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <div>
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold gradient-text mb-1 sm:mb-2">2K+</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Happy Customers</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold gradient-text mb-1 sm:mb-2">50+</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Premium Products</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold gradient-text mb-1 sm:mb-2">24/7</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Support Available</div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2">
            <div className="w-1.5 h-3 rounded-full bg-muted-foreground/50" />
          </div>
        </div>
      </section>

      {/* Why Snippy Mart */}
      <section className="py-24 lg:py-36 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/20 to-background" />
        <div className="absolute top-1/2 left-0 w-72 h-72 bg-primary/10 rounded-full blur-[100px] -translate-y-1/2" />
        <div className="absolute top-1/2 right-0 w-72 h-72 bg-accent/10 rounded-full blur-[100px] -translate-y-1/2" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-4">
              Why Choose <span className="gradient-text">Snippy Mart</span>?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We provide the best digital subscription experience with unmatched value and service.
            </p>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="group p-6 rounded-2xl bg-card/80 backdrop-blur-sm border border-border card-hover"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Popular Products */}
      <section className="py-24 lg:py-36 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/40 to-accent/5" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-4">
                Popular <span className="gradient-text">Products</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-xl">
                Our most loved digital subscriptions chosen by thousands of customers.
              </p>
            </div>
            <Button variant="outline" size="lg" className="mt-6 md:mt-0" asChild>
              <Link to="/products">
                View All Products
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
              viewport={{ once: true, margin: "-100px" }}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-6"
            >
              {popularProducts.map((product) => (
                <motion.div key={product.id} variants={itemVariants}>
                  <ProductCard
                    product={product}
                    onViewDetails={handleViewDetails}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No products available yet. Check back soon!
            </div>
          )}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 lg:py-20 bg-secondary/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-4">
              What Our <span className="gradient-text">Customers Say</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Don't just take our word for it. Here's what thousands of happy customers think about Snippy Mart.
            </p>
          </div>
          <TestimonialCarousel />
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 lg:py-36 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-t from-secondary/30 via-background to-secondary/20" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/10 rounded-full blur-[120px]" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-4">
              How It <span className="gradient-text">Works</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get started with Snippy Mart in three simple steps.
            </p>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto"
          >
            {steps.map((step, index) => (
              <motion.div key={index} variants={itemVariants} className="relative">
                <div className="p-8 rounded-2xl bg-card/80 backdrop-blur-sm border border-border text-center">
                  <div className="text-5xl font-display font-bold gradient-text mb-4">
                    {step.number}
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {step.description}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:flex absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                      <ArrowRight className="w-4 h-4 text-primary-foreground" />
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 lg:py-36 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[150px]" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-6">
              Need help choosing a subscription?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Our team is here to help you find the perfect digital subscription for your needs.
              Contact us on WhatsApp for personalized recommendations.
            </p>
            <Button variant="whatsapp" size="xl" asChild>
              <a href="https://wa.me/94787767869" target="_blank" rel="noopener noreferrer">
                <MessageCircle className="w-5 h-5 mr-2" />
                Chat with Us on WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default HomePage;

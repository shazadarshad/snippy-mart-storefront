import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Zap,
  Shield,
  MessageCircle,
  Users,
  BadgeCheck,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/products/ProductCard';
import ProductDetailModal from '@/components/products/ProductDetailModal';
import { useProducts, type Product } from '@/hooks/useProducts';
import { ProductsGridSkeleton } from '@/components/products/ProductSkeleton';
import { TestimonialCarousel } from '@/components/TestimonialCarousel';
import SEO from '@/components/seo/SEO';
import {
  buildOrganizationJsonLd,
  buildWebSiteJsonLd,
  buildStoreJsonLd,
  buildBreadcrumbJsonLd,
  buildItemListJsonLd,
  DEFAULT_DESCRIPTION,
} from '@/lib/seo';

const HomePage = () => {
  const { data: products = [], isLoading } = useProducts();
  const popular = products.filter((p) => p.is_featured).slice(0, 8);
  const [selected, setSelected] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);

  const openProduct = (p: Product) => {
    setSelected(p);
    setOpen(true);
  };

  const features = [
    { icon: Zap, title: 'Instant-ready delivery', body: 'Access after payment confirmation — no endless waiting.' },
    { icon: Shield, title: 'Secure bank / Binance checkout', body: 'Pay, upload proof, get a trackable Order ID.' },
    { icon: BadgeCheck, title: 'Live order status', body: 'Payment confirmed → processing → completed, in real time.' },
    { icon: MessageCircle, title: 'Human WhatsApp help', body: 'Real support in listed hours — AI chat anytime on the site.' },
  ];

  return (
    <div className="min-h-screen page-mesh overflow-x-hidden">
      <SEO
        title="Premium Digital Subscriptions | AI, Streaming & Software"
        description={DEFAULT_DESCRIPTION}
        path="/"
        jsonLd={[
          buildOrganizationJsonLd(),
          buildWebSiteJsonLd(),
          buildStoreJsonLd(),
          buildBreadcrumbJsonLd([{ name: 'Home', path: '/' }]),
          ...(popular.length
            ? [buildItemListJsonLd(popular, 'Featured digital subscriptions')]
            : []),
        ]}
      />

      {/* Hero — CSS only, no heavy motion libs on first paint */}
      <section className="relative pt-28 sm:pt-32 pb-16 sm:pb-24">
        <div className="absolute inset-0 dot-grid opacity-30 pointer-events-none" />
        <div className="orb orb-primary w-[22rem] h-[22rem] sm:w-[28rem] sm:h-[28rem] -top-32 left-1/2 -translate-x-1/2 opacity-70" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center page-enter">
            <div className="inline-flex items-center gap-2 page-eyebrow mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              Premium digital marketplace
            </div>
            <h1 className="page-title mb-6">
              Premium access.
              <br />
              <span className="gradient-text">Zero friction.</span>
            </h1>
            <p className="page-lead mx-auto mb-10">
              AI tools, design suites, streaming & more — priced right, checked out cleanly, tracked
              live.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-stretch sm:items-center">
              <Button
                size="xl"
                className="h-14 rounded-2xl px-8 text-base font-semibold btn-glow shadow-lg shadow-primary/25"
                asChild
              >
                <Link to="/products">
                  Explore products
                  <ArrowRight className="w-5 h-5 ml-1" />
                </Link>
              </Button>
              <Button
                size="xl"
                variant="outline"
                className="h-14 rounded-2xl px-8 text-base border-border/70 bg-card/80 hover:bg-card"
                asChild
              >
                <a
                  href="https://chat.whatsapp.com/EB9hDAkQBmcHEjlTMLYXBh"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Users className="w-5 h-5 mr-2" />
                  Join for more deals
                </a>
              </Button>
            </div>

            <div className="mt-14 grid grid-cols-3 gap-2 sm:gap-3 max-w-lg mx-auto">
              {[
                { v: '2K+', l: 'Buyers' },
                { v: '50+', l: 'Products' },
                { v: 'Live', l: 'Tracking' },
              ].map((s) => (
                <div
                  key={s.l}
                  className="rounded-2xl border border-border/40 bg-card/80 px-2.5 py-3.5 sm:px-3 sm:py-4 shadow-[var(--shadow-sm)]"
                >
                  <p className="font-display text-xl sm:text-3xl font-bold tracking-tight">{s.v}</p>
                  <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-1">
                    {s.l}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features bento */}
      <section className="section-shell pt-4 border-t border-border/40">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <p className="page-eyebrow mb-3">Why Snippy</p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
                Designed for modern buyers
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f) => (
              <div key={f.title} className="surface-card-interactive p-5 sm:p-6 group">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="section-shell border-t border-border/40 bg-secondary/20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <p className="page-eyebrow mb-3">Catalogue</p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
                Featured products
              </h2>
              <p className="text-muted-foreground mt-2 text-sm sm:text-base max-w-md">
                Tap a card for plans, pricing, and checkout.
              </p>
            </div>
            <Button variant="outline" className="rounded-xl w-fit" asChild>
              <Link to="/products">
                View all
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>

          {isLoading ? (
            <ProductsGridSkeleton count={8} />
          ) : popular.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
              {popular.map((p, i) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onViewDetails={openProduct}
                  priority={i < 4}
                />
              ))}
            </div>
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
            <p className="page-eyebrow mb-3">Love notes</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
              What buyers say
            </h2>
          </div>
          <TestimonialCarousel />
        </div>
      </section>

      {/* CTA */}
      <section className="section-shell border-t border-border/40 pb-24">
        <div className="container mx-auto px-4">
          <div className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-card p-8 sm:p-14 text-center shine-border">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-accent/10" />
            <div className="relative z-10 max-w-xl mx-auto">
              <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mb-3">
                Ready to upgrade your stack?
              </h2>
              <p className="text-muted-foreground mb-8 text-sm sm:text-base">
                Shop the vault or ping us on WhatsApp for a recommendation.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button size="lg" className="h-12 rounded-2xl btn-glow font-semibold" asChild>
                  <Link to="/products">
                    Shop now
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
                <Button size="lg" variant="whatsapp" className="h-12 rounded-2xl font-semibold" asChild>
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
        product={selected}
        isOpen={open}
        onClose={() => {
          setOpen(false);
          setTimeout(() => setSelected(null), 250);
        }}
      />
    </div>
  );
};

export default HomePage;

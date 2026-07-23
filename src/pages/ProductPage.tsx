import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useProducts, type Product } from '@/hooks/useProducts';
import ProductDetailModal from '@/components/products/ProductDetailModal';
import SEO from '@/components/seo/SEO';
import {
  buildProductJsonLd,
  buildBreadcrumbJsonLd,
  plainText,
  productPath,
  absoluteAsset,
} from '@/lib/seo';
import { useCurrency } from '@/hooks/useCurrency';
import { Loader2, ChevronRight, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ProductPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();
  const { data: products, isLoading } = useProducts();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!isLoading && products && slug) {
      const product = products.find((p) => p.slug === slug || p.id === slug);
      if (product) {
        setSelectedProduct(product);
        setNotFound(false);
      } else {
        setSelectedProduct(null);
        setNotFound(true);
      }
    }
  }, [slug, products, isLoading]);

  const handleClose = () => {
    setSelectedProduct(null);
    navigate('/products');
  };

  const jsonLd = useMemo(() => {
    if (!selectedProduct) return undefined;
    return [
      buildProductJsonLd(selectedProduct),
      buildBreadcrumbJsonLd([
        { name: 'Home', path: '/' },
        { name: 'Products', path: '/products' },
        { name: selectedProduct.name, path: productPath(selectedProduct) },
      ]),
    ];
  }, [selectedProduct]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <SEO title="Loading product" noindex description="Loading product details…" />
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading product…</p>
        </div>
      </div>
    );
  }

  if (notFound || !selectedProduct) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <SEO
          title="Product not found"
          description="This product is unavailable or was removed."
          noindex
        />
        <div className="text-center max-w-md space-y-4">
          <Package className="w-12 h-12 text-muted-foreground mx-auto opacity-60" />
          <h1 className="text-2xl font-bold">Product not found</h1>
          <p className="text-muted-foreground text-sm">
            It may be out of stock or the link is outdated.
          </p>
          <Button asChild className="rounded-xl">
            <Link to="/products">Browse products</Link>
          </Button>
        </div>
      </div>
    );
  }

  const desc =
    plainText(selectedProduct.description, 155) ||
    `Buy ${selectedProduct.name} at Snippy Mart — secure checkout and live order tracking.`;

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={selectedProduct.name}
        description={desc}
        path={productPath(selectedProduct)}
        image={absoluteAsset(selectedProduct.image_url)}
        type="product"
        jsonLd={jsonLd}
        keywords={`${selectedProduct.name}, ${selectedProduct.category || 'digital subscription'}, Snippy Mart, buy online, Sri Lanka`}
      />

      {/* Crawlable product content (Google executes JS; keep real H1 + text in DOM) */}
      <article className="container mx-auto px-4 pt-28 sm:pt-32 pb-10 max-w-3xl">
        <nav aria-label="Breadcrumb" className="mb-4 text-xs text-muted-foreground">
          <ol className="flex flex-wrap items-center gap-1">
            <li>
              <Link to="/" className="hover:text-primary">
                Home
              </Link>
            </li>
            <li aria-hidden>
              <ChevronRight className="w-3 h-3 inline" />
            </li>
            <li>
              <Link to="/products" className="hover:text-primary">
                Products
              </Link>
            </li>
            <li aria-hidden>
              <ChevronRight className="w-3 h-3 inline" />
            </li>
            <li className="text-foreground font-medium truncate max-w-[12rem] sm:max-w-none">
              {selectedProduct.name}
            </li>
          </ol>
        </nav>

        <div className="flex flex-col sm:flex-row gap-5 sm:gap-8">
          {selectedProduct.image_url && (
            <img
              src={selectedProduct.image_url}
              alt={selectedProduct.name}
              width={320}
              height={320}
              className="w-full sm:w-56 h-auto rounded-2xl border border-border object-cover shrink-0"
              loading="eager"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">
              {selectedProduct.category || 'Digital product'}
            </p>
            <h1 className="text-2xl sm:text-3xl font-display font-black text-foreground tracking-tight">
              {selectedProduct.name}
            </h1>
            <p className="mt-2 text-xl font-black text-primary tabular-nums">
              {formatPrice(selectedProduct.price)}
              {selectedProduct.old_price != null && selectedProduct.old_price > selectedProduct.price && (
                <span className="ml-2 text-sm font-semibold text-muted-foreground line-through">
                  {formatPrice(selectedProduct.old_price)}
                </span>
              )}
            </p>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {plainText(selectedProduct.description, 800) ||
                `${selectedProduct.name} available at Snippy Mart with secure checkout and live tracking.`}
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              Stock:{' '}
              <span className="font-semibold text-foreground">
                {selectedProduct.stock_status === 'out_of_stock'
                  ? 'Out of stock'
                  : selectedProduct.stock_status === 'limited'
                    ? 'Limited'
                    : 'In stock'}
              </span>
            </p>
            <Button
              className="mt-5 h-11 rounded-xl font-bold w-full sm:w-auto"
              onClick={() => setSelectedProduct(selectedProduct)}
              type="button"
            >
              View full details & buy
            </Button>
          </div>
        </div>
      </article>

      <ProductDetailModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={handleClose}
      />
    </div>
  );
};

export default ProductPage;

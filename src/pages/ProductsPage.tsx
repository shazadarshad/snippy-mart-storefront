import { useMemo, useState } from 'react';
import {
  Search,
  X,
  Package,
  ArrowUpDown,
  Star,
  LayoutGrid,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ProductCard from '@/components/products/ProductCard';
import ProductDetailModal from '@/components/products/ProductDetailModal';
import { useProducts, type Product } from '@/hooks/useProducts';
import { cn } from '@/lib/utils';
import { ProductsGridSkeleton } from '@/components/products/ProductSkeleton';
import { motion, AnimatePresence } from 'framer-motion';
import SEO from '@/components/seo/SEO';

type SortKey = 'featured' | 'price_asc' | 'price_desc' | 'name' | 'newest';
type StockFilter = 'all' | 'in_stock' | 'limited' | 'out_of_stock';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 280, damping: 22 },
  },
};

const ProductsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('featured');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: products = [], isLoading } = useProducts();

  const categoryStats = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of products) {
      const cat = p.category || 'Other';
      map.set(cat, (map.get(cat) || 0) + 1);
    }
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [products]);

  const featuredCount = products.filter((p) => p.is_featured).length;
  const inStockCount = products.filter(
    (p) => !p.stock_status || p.stock_status === 'in_stock'
  ).length;

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    let list = products.filter((product) => {
      const hay = `${product.name} ${product.description} ${product.category}`.toLowerCase();
      const matchesSearch = !q || hay.includes(q);
      const matchesCategory = !selectedCategory || product.category === selectedCategory;
      const stock = product.stock_status || 'in_stock';
      const matchesStock = stockFilter === 'all' || stock === stockFilter;
      return matchesSearch && matchesCategory && matchesStock;
    });

    list = [...list].sort((a, b) => {
      switch (sortKey) {
        case 'price_asc':
          return a.price - b.price;
        case 'price_desc':
          return b.price - a.price;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'newest':
          return (
            new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
          );
        case 'featured':
        default: {
          const af = a.is_featured ? 0 : 1;
          const bf = b.is_featured ? 0 : 1;
          if (af !== bf) return af - bf;
          const ao = a.display_order ?? 9999;
          const bo = b.display_order ?? 9999;
          if (ao !== bo) return ao - bo;
          return a.name.localeCompare(b.name);
        }
      }
    });

    return list;
  }, [products, searchQuery, selectedCategory, stockFilter, sortKey]);

  const handleViewDetails = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedProduct(null), 300);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory(null);
    setStockFilter('all');
    setSortKey('featured');
  };

  const hasActiveFilters =
    !!searchQuery || !!selectedCategory || stockFilter !== 'all' || sortKey !== 'featured';

  return (
    <div className="min-h-dvh page-mesh pb-safe pb-20">
      <SEO
        title="Products"
        description="Browse premium digital subscriptions — AI tools, streaming, design software. Fair prices, bank checkout, live tracking."
        type="website"
      />

      <div className="container mx-auto px-3 sm:px-4 pt-28 sm:pt-32">
        <div className="mb-6 sm:mb-8 max-w-2xl">
          <p className="page-eyebrow mb-4">
            <LayoutGrid className="w-3.5 h-3.5" />
            Product vault
          </p>
          <h1 className="page-title mb-3 text-3xl sm:text-5xl md:text-6xl">
            Shop the <span className="gradient-text">catalogue</span>
          </h1>
          <p className="page-lead text-sm sm:text-lg">
            {isLoading
              ? 'Loading catalogue…'
              : `${products.length} products · ${inStockCount} in stock · ${featuredCount} featured`}
          </p>
        </div>

        {/* Toolbar */}
        <div className="sticky top-[4.5rem] sm:top-20 z-30 mb-6 sm:mb-8 rounded-2xl border border-border/60 bg-background/90 backdrop-blur-2xl p-2.5 sm:p-4 shadow-md">
          <div className="flex flex-col gap-2.5 sm:gap-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search products…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 h-11 sm:h-12 rounded-xl bg-card border-border text-sm sm:text-base"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
              <div className="flex overflow-x-auto gap-1.5 pb-1 sm:pb-0 no-scrollbar -mx-0.5 px-0.5">
                <button
                  type="button"
                  onClick={() => setSelectedCategory(null)}
                  className={cn(
                    'px-3 h-9 rounded-full text-[11px] font-bold uppercase tracking-wide shrink-0 border transition-colors',
                    selectedCategory === null
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card border-border text-muted-foreground hover:border-primary/40'
                  )}
                >
                  All ({products.length})
                </button>
                {categoryStats.map(({ name, count }) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() =>
                      setSelectedCategory(selectedCategory === name ? null : name)
                    }
                    className={cn(
                      'px-3 h-9 rounded-full text-[11px] font-bold uppercase tracking-wide shrink-0 border transition-colors',
                      selectedCategory === name
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-card border-border text-muted-foreground hover:border-primary/40'
                    )}
                  >
                    {name} ({count})
                  </button>
                ))}
              </div>

              <div className="flex gap-2 shrink-0 w-full sm:w-auto">
                <Select
                  value={stockFilter}
                  onValueChange={(v) => setStockFilter(v as StockFilter)}
                >
                  <SelectTrigger className="h-10 sm:h-9 flex-1 sm:w-[130px] rounded-xl text-xs bg-card">
                    <Package className="w-3.5 h-3.5 mr-1.5 text-muted-foreground shrink-0" />
                    <SelectValue placeholder="Stock" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All stock</SelectItem>
                    <SelectItem value="in_stock">In stock</SelectItem>
                    <SelectItem value="limited">Limited</SelectItem>
                    <SelectItem value="out_of_stock">Sold out</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
                  <SelectTrigger className="h-10 sm:h-9 flex-1 sm:w-[140px] rounded-xl text-xs bg-card">
                    <ArrowUpDown className="w-3.5 h-3.5 mr-1.5 text-muted-foreground shrink-0" />
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="featured">Featured</SelectItem>
                    <SelectItem value="price_asc">Price: low → high</SelectItem>
                    <SelectItem value="price_desc">Price: high → low</SelectItem>
                    <SelectItem value="name">Name A–Z</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="flex items-center justify-between gap-2 text-xs">
                <p className="text-muted-foreground">
                  <span className="font-bold text-foreground">{filteredProducts.length}</span> result
                  {filteredProducts.length !== 1 ? 's' : ''}
                  {selectedCategory && (
                    <>
                      {' '}
                      in <span className="font-semibold text-primary">{selectedCategory}</span>
                    </>
                  )}
                </p>
                <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={clearFilters}>
                  Clear filters
                </Button>
              </div>
            )}
          </div>
        </div>

        {isLoading ? (
          <ProductsGridSkeleton count={8} />
        ) : filteredProducts.length > 0 ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${selectedCategory}-${sortKey}-${stockFilter}-${searchQuery}`}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5"
            >
              {filteredProducts.map((product) => (
                <motion.div key={product.id} variants={itemVariants}>
                  <ProductCard product={product} onViewDetails={handleViewDetails} />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="text-center py-16 sm:py-20 rounded-3xl border border-dashed border-border bg-card/40">
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">No products match</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              Try another search or category.
            </p>
            <Button variant="outline" onClick={clearFilters}>
              Clear filters
            </Button>
          </div>
        )}

        {!isLoading && filteredProducts.length > 0 && (
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground border-t border-border pt-6">
            <p>
              Showing <span className="font-bold text-foreground">{filteredProducts.length}</span> of{' '}
              <span className="font-bold text-foreground">{products.length}</span> products
            </p>
            <div className="flex items-center gap-2 text-xs">
              <Star className="w-3.5 h-3.5 text-amber-500" />
              Featured items rise to the top when sorted by Featured
            </div>
          </div>
        )}
      </div>

      <ProductDetailModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default ProductsPage;

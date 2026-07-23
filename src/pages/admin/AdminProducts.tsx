import { useState, useRef } from 'react';
import {
  Plus, Pencil, Trash2, Search, Upload, Loader2, X, Eye, EyeOff, Star, Package,
  Image as ImageIcon, ArrowUp, ArrowDown, ChevronsUp, ChevronsDown, GripVertical,
  FileSpreadsheet, Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { FormattedDescription } from '@/components/products/FormattedDescription';
import {
  useProducts,
  useAddProduct,
  useBulkAddProducts,
  useUpdateProduct,
  useDeleteProduct,
  useUploadProductImage,
  useMoveProduct,
  useReorderProducts,
  type Product,
  type ProductFormData,
  type StockStatus,
} from '@/hooks/useProducts';
import { useToast } from '@/hooks/use-toast';
import {
  useAllPricingPlans,
  useAddPricingPlan,
  useDeletePricingPlan,
} from '@/hooks/usePricingPlans';
import {
  useAllProductImages,
  useAddProductImage,
  useDeleteProductImage,
} from '@/hooks/useProductImages';
import {
  usePricingPlanVariants,
  useAddPricingPlanVariant,
  useDeletePricingPlanVariant,
} from "@/hooks/usePricingPlans";
import { useCurrency } from '@/hooks/useCurrency';
import { isResellerApiProduct, productPriceInLkr } from '@/hooks/useResellerApi';
import { cn } from '@/lib/utils';

interface PricingPlanVariantInput {
  id?: string;
  name: string;
  price: number;
  old_price?: number | null;
  is_active: boolean;
  stock_status: string;
}

interface PricingPlanInput {
  id?: string;
  name: string;
  duration: string;
  price: number;
  old_price: number | null;
  is_default: boolean;
  variants?: PricingPlanVariantInput[];
}



interface GalleryImageInput {
  id?: string;
  image_url: string;
}

const CSV_TEMPLATE = `name,description,price,old_price,category,image_url,stock_status,is_featured,is_active,manual_fulfillment
Netflix Premium,Shared Netflix plan with 4 screens,1500,2500,Streaming,https://example.com/netflix.jpg,in_stock,true,true,true
ChatGPT Plus,1 month ChatGPT Plus access,2500,,AI Tools,/placeholder.svg,in_stock,false,true,true
Canva Pro,Canva Pro yearly seat,1200,2000,Design,/placeholder.svg,limited,true,true,true`;

/** Minimal CSV line parser supporting quoted fields */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(cell.trim());
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && next === '\n') i++;
      row.push(cell.trim());
      cell = '';
      if (row.some((c) => c !== '')) rows.push(row);
      row = [];
    } else {
      cell += ch;
    }
  }
  row.push(cell.trim());
  if (row.some((c) => c !== '')) rows.push(row);
  return rows;
}

function parseBool(v: string | undefined, fallback: boolean) {
  if (v == null || v === '') return fallback;
  const s = v.toLowerCase();
  if (['1', 'true', 'yes', 'y'].includes(s)) return true;
  if (['0', 'false', 'no', 'n'].includes(s)) return false;
  return fallback;
}

function rowsToProducts(rows: string[][]): ProductFormData[] {
  if (rows.length < 2) throw new Error('CSV needs a header row and at least one product');

  const headers = rows[0].map((h) => h.toLowerCase().replace(/\s+/g, '_'));
  const idx = (key: string) => headers.indexOf(key);

  const nameI = idx('name');
  if (nameI < 0) throw new Error('CSV must include a "name" column');

  const priceI = idx('price');
  const descI = idx('description');
  const oldI = idx('old_price');
  const catI = idx('category');
  const imgI = idx('image_url');
  const stockI = idx('stock_status');
  const featI = idx('is_featured');
  const activeI = idx('is_active');
  const manualI = idx('manual_fulfillment');

  const out: ProductFormData[] = [];
  for (let r = 1; r < rows.length; r++) {
    const cols = rows[r];
    const name = cols[nameI]?.trim();
    if (!name) continue;

    const price = priceI >= 0 ? parseFloat(cols[priceI] || '0') : 0;
    const oldRaw = oldI >= 0 ? cols[oldI] : '';
    const old_price =
      oldRaw === '' || oldRaw == null ? null : Number.isFinite(parseFloat(oldRaw)) ? parseFloat(oldRaw) : null;

    let stock_status: StockStatus = 'in_stock';
    const stockVal = (stockI >= 0 ? cols[stockI] : '')?.toLowerCase() || 'in_stock';
    if (stockVal === 'limited' || stockVal === 'out_of_stock' || stockVal === 'in_stock') {
      stock_status = stockVal;
    }

    out.push({
      name,
      description: descI >= 0 ? cols[descI] || '' : '',
      price: Number.isFinite(price) ? price : 0,
      old_price,
      category: catI >= 0 ? cols[catI] || 'General' : 'General',
      image_url: imgI >= 0 && cols[imgI] ? cols[imgI] : '/placeholder.svg',
      is_active: parseBool(activeI >= 0 ? cols[activeI] : undefined, true),
      is_featured: parseBool(featI >= 0 ? cols[featI] : undefined, false),
      stock_status,
      requirements: { require_email: false, require_password: false },
      manual_fulfillment: parseBool(manualI >= 0 ? cols[manualI] : undefined, true),
      use_variant_pricing: false,
    });
  }

  if (!out.length) throw new Error('No valid product rows found in CSV');
  return out;
}

const AdminProducts = () => {
  const { formatPrice } = useCurrency();
  const { toast } = useToast();
  const { data: products = [], isLoading } = useProducts(true); // Include inactive
  const { data: allPricingPlans = [] } = useAllPricingPlans();
  const { data: allProductImages = [] } = useAllProductImages();
  const addProduct = useAddProduct();
  const bulkAddProducts = useBulkAddProducts();
  const { data: allPricingPlanVariants = [], isLoading: variantsLoading } = usePricingPlanVariants();

  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const uploadImage = useUploadProductImage();
  const moveProduct = useMoveProduct();
  const reorderProducts = useReorderProducts();
  const addPricingPlan = useAddPricingPlan();
  const deletePricingPlan = useDeletePricingPlan();
  const addPricingPlanVariant = useAddPricingPlanVariant();
  const deletePricingPlanVariant = useDeletePricingPlanVariant();
  const addProductImage = useAddProductImage();
  const deleteProductImage = useDeleteProductImage();

  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importPreview, setImportPreview] = useState<ProductFormData[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const isReordering = moveProduct.isPending || reorderProducts.isPending;
  const [sourceFilter, setSourceFilter] = useState<'all' | 'store' | 'api'>('all');
  const canReorder = !searchQuery.trim() && sourceFilter === 'all';
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: 0,
    old_price: null,
    category: '',
    image_url: '/placeholder.svg',
    is_active: true,
    is_featured: false,
    stock_status: 'in_stock',
    requirements: { require_email: false, require_password: false },
    manual_fulfillment: true,
    reseller_product_id: null,
    reseller_cost_usd: null,
    use_variant_pricing: false,
  });
  const [pricingPlans, setPricingPlans] = useState<PricingPlanInput[]>([]);
  const [existingPlanIds, setExistingPlanIds] = useState<string[]>([]);
  const [galleryImages, setGalleryImages] = useState<GalleryImageInput[]>([]);
  const [existingImageIds, setExistingImageIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const storeProductCount = products.filter((p) => !isResellerApiProduct(p)).length;
  const apiProductCount = products.filter((p) => isResellerApiProduct(p)).length;

  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q);
    if (!matchesSearch) return false;
    if (sourceFilter === 'api') return isResellerApiProduct(p);
    if (sourceFilter === 'store') return !isResellerApiProduct(p);
    return true;
  });

  const applyOrder = (orderedIds: string[]) => {
    reorderProducts.mutate(orderedIds);
  };

  const moveInList = (productId: string, toIndex: number) => {
    const ids = products.map((p) => p.id);
    const fromIndex = ids.indexOf(productId);
    if (fromIndex === -1 || toIndex < 0 || toIndex >= ids.length || fromIndex === toIndex) return;
    const next = [...ids];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    applyOrder(next);
  };

  const handleDragStart = (e: React.DragEvent, productId: string) => {
    if (!canReorder || isReordering) {
      e.preventDefault();
      return;
    }
    setDragId(productId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', productId);
    // Helps some browsers show a proper drag ghost
    if (e.currentTarget instanceof HTMLElement) {
      e.dataTransfer.setDragImage(e.currentTarget.closest('tr') || e.currentTarget, 24, 24);
    }
  };

  const handleDragOver = (e: React.DragEvent, productId: string) => {
    if (!canReorder || !dragId || dragId === productId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverId !== productId) setDragOverId(productId);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!canReorder || !dragId || dragId === targetId) {
      setDragId(null);
      setDragOverId(null);
      return;
    }
    const ids = products.map((p) => p.id);
    const fromIndex = ids.indexOf(dragId);
    const toIndex = ids.indexOf(targetId);
    setDragId(null);
    setDragOverId(null);
    if (fromIndex === -1 || toIndex === -1) return;
    moveInList(dragId, toIndex);
  };

  const handleDragEnd = () => {
    setDragId(null);
    setDragOverId(null);
  };

  const getProductPricingPlans = (productId: string) => {
    return allPricingPlans.filter(p => p.product_id === productId);
  };

  const getPricingPlanVariants = (planId: string) => {
    return allPricingPlanVariants.filter(v => v.plan_id === planId);
  };

  const getProductGalleryImages = (productId: string) => {
    return allProductImages.filter(img => img.product_id === productId);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'price' || name === 'old_price'
        ? value === '' ? (name === 'old_price' ? null : 0) : parseFloat(value)
        : value,
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = await uploadImage.mutateAsync(file);
    setFormData((prev) => ({ ...prev, image_url: url }));
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = await uploadImage.mutateAsync(file);
    setGalleryImages(prev => [...prev, { image_url: url }]);
  };

  const handleRemoveGalleryImage = (index: number) => {
    setGalleryImages(prev => prev.filter((_, i) => i !== index));
  };

  // Helper to generate URL-friendly slug from product name
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const emptyForm = (): ProductFormData => ({
    name: '',
    description: '',
    price: 0,
    old_price: null,
    category: '',
    image_url: '/placeholder.svg',
    is_active: true,
    is_featured: false,
    stock_status: 'in_stock',
    requirements: { require_email: false, require_password: false },
    manual_fulfillment: true,
    reseller_product_id: null,
    reseller_cost_usd: null,
    use_variant_pricing: false,
    slug: '',
  });

  /** Postgres numeric often arrives as string — normalize for controlled inputs */
  const toNum = (v: unknown, fallback = 0): number => {
    if (v == null || v === '') return fallback;
    const n = typeof v === 'number' ? v : parseFloat(String(v));
    return Number.isFinite(n) ? n : fallback;
  };

  const toNumOrNull = (v: unknown): number | null => {
    if (v == null || v === '') return null;
    const n = typeof v === 'number' ? v : parseFloat(String(v));
    return Number.isFinite(n) ? n : null;
  };

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      const productPlans = getProductPricingPlans(product.id);
      const productImages = getProductGalleryImages(product.id);

      // Always coerce — blank inputs happen when value is null/undefined/string mismatches
      const req = (product.requirements ?? {}) as ProductFormData['requirements'];
      setFormData({
        name: product.name ?? '',
        description: product.description ?? '',
        price: toNum(product.price, 0),
        old_price: toNumOrNull(product.old_price),
        category: product.category ?? '',
        image_url: product.image_url || '/placeholder.svg',
        is_active: product.is_active ?? true,
        is_featured: product.is_featured ?? false,
        stock_status: (product.stock_status as StockStatus) || 'in_stock',
        requirements: {
          require_email: !!req?.require_email,
          require_password: !!req?.require_password,
          require_username: !!req?.require_username,
        },
        manual_fulfillment: product.manual_fulfillment ?? true,
        reseller_product_id: product.reseller_product_id ?? null,
        reseller_cost_usd: product.reseller_cost_usd ?? null,
        use_variant_pricing: product.use_variant_pricing ?? false,
        slug: product.slug || generateSlug(product.name || ''),
        display_order: toNum(product.display_order, 0),
      });
      setPricingPlans(
        productPlans.map((p) => ({
          id: p.id,
          name: p.name ?? '',
          duration: p.duration ?? '',
          price: toNum(p.price, 0),
          old_price: toNumOrNull(p.old_price),
          is_default: !!p.is_default,
          variants: getPricingPlanVariants(p.id).map((v) => ({
            id: v.id,
            name: v.name ?? '',
            price: toNum(v.price, 0),
            old_price: toNumOrNull(v.old_price),
            is_active: v.is_active ?? true,
            stock_status: v.stock_status ?? 'in_stock',
          })),
        })),
      );
      setExistingPlanIds(productPlans.map((p) => p.id));
      setGalleryImages(
        productImages.map((img) => ({
          id: img.id,
          image_url: img.image_url,
        })),
      );
      setExistingImageIds(productImages.map((img) => img.id));
    } else {
      setEditingProduct(null);
      setFormData(emptyForm());
      setPricingPlans([]);
      setExistingPlanIds([]);
      setGalleryImages([]);
      setExistingImageIds([]);
    }
    setIsDialogOpen(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      // Reset only on close so next open is clean
      setEditingProduct(null);
      setFormData(emptyForm());
      setPricingPlans([]);
      setExistingPlanIds([]);
      setGalleryImages([]);
      setExistingImageIds([]);
    }
  };

  const handleAddPricingPlan = () => {
    setPricingPlans(prev => [...prev, {
      name: '',
      duration: '',
      price: 0,
      old_price: null,
      is_default: prev.length === 0,
      variants: [],
    }]);
  };

  const handleRemovePricingPlan = (index: number) => {
    setPricingPlans(prev => {
      const updated = prev.filter((_, i) => i !== index);
      if (updated.length > 0 && !updated.some(p => p.is_default)) {
        updated[0].is_default = true;
      }
      return updated;
    });
  };

  const handlePricingPlanChange = (index: number, field: keyof PricingPlanInput, value: string | number | boolean | null) => {
    setPricingPlans(prev => prev.map((plan, i) => {
      if (i === index) {
        if (field === 'is_default' && value === true) {
          return { ...plan, is_default: true };
        }
        return { ...plan, [field]: value };
      }
      if (field === 'is_default' && value === true) {
        return { ...plan, is_default: false };
      }
      return plan;
    }));
  };

  const handleAddVariant = (planIndex: number) => {
    setPricingPlans(prev => prev.map((plan, i) => {
      if (i === planIndex) {
        return {
          ...plan,
          variants: [...(plan.variants || []), {
            name: '',
            price: 0,
            old_price: null,
            is_active: true,
            stock_status: 'in_stock'
          }]
        };
      }
      return plan;
    }));
  };

  const handleRemoveVariant = (planIndex: number, variantIndex: number) => {
    setPricingPlans(prev => prev.map((plan, i) => {
      if (i === planIndex && plan.variants) {
        return {
          ...plan,
          variants: plan.variants.filter((_, vi) => vi !== variantIndex)
        };
      }
      return plan;
    }));
  };

  const handleVariantChange = (planIndex: number, variantIndex: number, field: keyof PricingPlanVariantInput, value: string | number | boolean | null) => {
    setPricingPlans(prev => prev.map((plan, i) => {
      if (i === planIndex && plan.variants) {
        return {
          ...plan,
          variants: plan.variants.map((v, vi) => {
            if (vi === variantIndex) {
              return { ...v, [field]: value };
            }
            return v;
          })
        };
      }
      return plan;
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Auto-generate slug if not exists
    const productData = {
      ...formData,
      slug: formData.slug || generateSlug(formData.name)
    };

    let productId: string;

    if (editingProduct) {
      await updateProduct.mutateAsync({ id: editingProduct.id, ...productData });
      productId = editingProduct.id;

      // Delete removed plans
      const currentPlanIds = pricingPlans.filter(p => p.id).map(p => p.id!);
      const plansToDelete = existingPlanIds.filter(id => !currentPlanIds.includes(id));
      for (const planId of plansToDelete) {
        await deletePricingPlan.mutateAsync(planId);
      }

      // Delete removed images
      const currentImageIds = galleryImages.filter(img => img.id).map(img => img.id!);
      const imagesToDelete = existingImageIds.filter(id => !currentImageIds.includes(id));
      for (const imageId of imagesToDelete) {
        await deleteProductImage.mutateAsync(imageId);
      }
    } else {
      const newProduct = await addProduct.mutateAsync(productData);
      productId = newProduct.id;
    }

    // Add/Update pricing plans
    for (const plan of pricingPlans) {
      let currentPlanId: string;
      if (!plan.id) {
        const newPlan = await addPricingPlan.mutateAsync({
          product_id: productId,
          name: plan.name,
          duration: plan.duration,
          price: plan.price,
          old_price: plan.old_price,
          is_default: plan.is_default,
        });
        currentPlanId = newPlan.id;
      } else {
        currentPlanId = plan.id!;
      }

      // Handle Variants for this plan
      if (plan.variants) {
        const originalVariants = getPricingPlanVariants(currentPlanId);
        const currentVariantIds = plan.variants.filter(v => v.id).map(v => v.id!);

        // Delete removed variants
        const variantsToDelete = originalVariants.filter(ov => !currentVariantIds.includes(ov.id));
        for (const v of variantsToDelete) {
          await deletePricingPlanVariant.mutateAsync(v.id);
        }

        // Add new variants
        for (const variant of plan.variants) {
          if (!variant.id) {
            await addPricingPlanVariant.mutateAsync({
              plan_id: currentPlanId,
              name: variant.name,
              price: variant.price,
              old_price: variant.old_price,
              is_active: variant.is_active,
              stock_status: variant.stock_status,
            });
          }
        }
      }
    }


    // Add new gallery images
    for (let i = 0; i < galleryImages.length; i++) {
      const img = galleryImages[i];
      if (!img.id) {
        await addProductImage.mutateAsync({
          product_id: productId,
          image_url: img.image_url,
          sort_order: i,
        });
      }
    }

    setIsDialogOpen(false);
  };

  const handleDelete = async (productId: string) => {
    await deleteProduct.mutateAsync(productId);
  };

  const handleToggleActive = async (product: Product) => {
    await updateProduct.mutateAsync({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      old_price: product.old_price,
      category: product.category,
      image_url: product.image_url,
      is_active: !product.is_active,
      is_featured: product.is_featured,
      stock_status: product.stock_status,
    });
  };

  const handleToggleFeatured = async (product: Product) => {
    await updateProduct.mutateAsync({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      old_price: product.old_price,
      category: product.category,
      image_url: product.image_url,
      is_active: product.is_active,
      is_featured: !product.is_featured,
      stock_status: product.stock_status,
    });
  };

  const isSubmitting = addProduct.isPending || updateProduct.isPending || addPricingPlan.isPending || addProductImage.isPending || addPricingPlanVariant.isPending;

  const downloadCsvTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'snippy-products-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCsvFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      const parsed = rowsToProducts(rows);
      setImportPreview(parsed);
    } catch (err) {
      setImportPreview([]);
      setImportError(err instanceof Error ? err.message : 'Failed to parse CSV');
    }
    e.target.value = '';
  };

  const handleConfirmImport = async () => {
    if (!importPreview.length) return;
    try {
      await bulkAddProducts.mutateAsync(importPreview);
      setImportPreview([]);
      setIsImportOpen(false);
    } catch {
      /* toast handled in hook */
    }
  };

  return (
    <div className="min-w-0 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="admin-page-header mb-0">
        <div className="min-w-0">
          <h1 className="admin-page-title">Products</h1>
          <p className="admin-page-subtitle">
            Catalog · {products.length} products · CSV bulk import for 50+
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Button variant="outline" onClick={() => setIsImportOpen(true)} className="h-11 rounded-xl touch-manipulation">
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Import CSV
          </Button>
          <Button variant="hero" type="button" onClick={() => handleOpenDialog()} className="h-11 rounded-xl touch-manipulation">
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogContent className="max-w-2xl sm:max-w-2xl w-full bg-card text-foreground border-border custom-scrollbar">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </DialogTitle>
            </DialogHeader>
            {/* key forces remount so fields always show loaded product values */}
            <form
              key={editingProduct?.id || 'new-product'}
              onSubmit={handleSubmit}
              className="space-y-4 mt-4"
            >
              <div>
                <Label htmlFor="name" className="text-foreground">Product Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name ?? ''}
                  onChange={handleInputChange}
                  className="mt-1.5 bg-background border-border text-foreground"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-foreground">Description</Label>
                <Tabs defaultValue="write" className="mt-1.5">
                  <TabsList className="bg-secondary/50 border border-border">
                    <TabsTrigger value="write">Write</TabsTrigger>
                    <TabsTrigger value="preview">Live Preview</TabsTrigger>
                  </TabsList>
                  <TabsContent value="write">
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description ?? ''}
                      onChange={handleInputChange}
                      className="bg-background border-border text-foreground min-h-[150px] font-mono text-sm"
                      placeholder="Use emoji headers and bullet points for best formatting&#10;&#10;🚀 PRODUCT TITLE&#10;&#10;✨ What's Included:&#10;✅ Feature 1&#10;✅ Feature 2&#10;✅ Feature 3"
                      required
                    />
                  </TabsContent>
                  <TabsContent value="preview" className="bg-secondary/30 border border-border rounded-lg p-4 min-h-[150px]">
                    <FormattedDescription description={formData.description ?? ''} />
                    {!formData.description && (
                      <p className="text-sm text-muted-foreground italic">Type something in the 'Write' tab to see a preview...</p>
                    )}
                  </TabsContent>
                </Tabs>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price" className="text-foreground">
                    {formData.reseller_product_id
                      ? 'Customer sell price (Rs.)'
                      : 'Base Price (Rs.)'}
                  </Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="1"
                    value={Number.isFinite(formData.price) ? formData.price : 0}
                    onChange={handleInputChange}
                    className="mt-1.5 bg-background border-border text-foreground"
                    required
                  />
                  {formData.reseller_product_id && (
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1">
                      This is what customers pay (LKR). Prefer endings like 399, 499, 999.
                      {formData.reseller_cost_usd != null && (
                        <> Panel cost stays ${Number(formData.reseller_cost_usd).toFixed(2)} USDT.</>
                      )}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="old_price" className="text-foreground">Old Price (Rs.)</Label>
                  <Input
                    id="old_price"
                    name="old_price"
                    type="number"
                    step="1"
                    value={formData.old_price ?? ''}
                    onChange={handleInputChange}
                    className="mt-1.5 bg-background border-border text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category" className="text-foreground">Category</Label>
                  <Input
                    id="category"
                    name="category"
                    value={formData.category ?? ''}
                    onChange={handleInputChange}
                    className="mt-1.5 bg-background border-border text-foreground"
                    required
                  />
                </div>
                <div>
                  <Label className="text-foreground">Stock Status</Label>
                  <Select
                    value={formData.stock_status}
                    onValueChange={(value: StockStatus) => setFormData(prev => ({ ...prev, stock_status: value }))}
                  >
                    <SelectTrigger className="mt-1.5 bg-background border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="in_stock">In Stock</SelectItem>
                      <SelectItem value="limited">Limited</SelectItem>
                      <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Customer Input Requirements */}
              <div className="border p-4 rounded-lg bg-secondary/30 border-border">
                <Label className="text-foreground mb-3 block">Customer Input Requirements</Label>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <Switch
                      id="require_email"
                      checked={formData.requirements?.require_email ?? false}
                      onCheckedChange={(checked) => setFormData(prev => ({
                        ...prev,
                        requirements: { ...prev.requirements, require_email: checked }
                      }))}
                    />
                    <Label htmlFor="require_email" className="text-foreground cursor-pointer font-normal">
                      Require Customer Email (e.g. for account upgrade)
                    </Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      id="require_password"
                      checked={formData.requirements?.require_password ?? false}
                      onCheckedChange={(checked) => setFormData(prev => ({
                        ...prev,
                        requirements: { ...prev.requirements, require_password: checked }
                      }))}
                    />
                    <Label htmlFor="require_password" className="text-foreground cursor-pointer font-normal">
                      Require Customer Password
                    </Label>
                  </div>
                </div>
              </div>

              {/* Fulfillment Type */}
              <div className="border p-4 rounded-lg bg-primary/5 border-primary/20 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-foreground font-bold">Manual Fulfillment Console</Label>
                    <p className="text-xs text-muted-foreground">
                      Enable this to assign accounts manually using the inventory console.
                      Disable for direct activation/emails.
                    </p>
                  </div>
                  <Switch
                    checked={formData.manual_fulfillment}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, manual_fulfillment: checked }))}
                  />
                </div>
                <div className="space-y-1.5 pt-2 border-t border-primary/10">
                  <Label className="text-foreground font-bold">Reseller API product ID</Label>
                  <Input
                    placeholder="UUID from seller panel (optional)"
                    value={formData.reseller_product_id || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        reseller_product_id: e.target.value.trim() || null,
                      }))
                    }
                    className="font-mono text-xs"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    When set, payment confirmed (processing) can auto-order this product from your prepaid reseller panel. Map from{' '}
                    <span className="font-semibold">Admin → Reseller API</span> or paste the UUID here.
                  </p>
                </div>
              </div>

              {/* Status Toggles */}
              <div className="flex flex-wrap gap-6 py-2">
                <div className="flex items-center gap-3">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label htmlFor="is_active" className="text-foreground cursor-pointer">
                    Active (visible to customers)
                  </Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    id="is_featured"
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_featured: checked }))}
                  />
                  <Label htmlFor="is_featured" className="text-foreground cursor-pointer">
                    Featured on homepage
                  </Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    id="use_variant_pricing"
                    checked={formData.use_variant_pricing}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, use_variant_pricing: checked }))}
                  />
                  <Label htmlFor="use_variant_pricing" className="text-foreground cursor-pointer">
                    Use Variant Pricing Grid
                  </Label>
                </div>
              </div>

              {/* Main Image */}
              <div>
                <Label className="text-foreground">Main Product Image</Label>
                <div className="mt-1.5 flex items-center gap-4">
                  <div className="w-20 h-20 rounded-lg bg-muted overflow-hidden">
                    <img
                      src={formData.image_url}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadImage.isPending}
                  >
                    {uploadImage.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    Upload
                  </Button>
                </div>
              </div>

              {/* Gallery Images */}
              <div>
                <Label className="text-foreground">Gallery Images (optional)</Label>
                <p className="text-xs text-muted-foreground mb-2">Add additional images for the product gallery</p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {galleryImages.map((img, idx) => (
                    <div key={idx} className="relative w-16 h-16 rounded-lg bg-muted overflow-hidden group">
                      <img
                        src={img.image_url}
                        alt={`Gallery ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveGalleryImage(idx)}
                        className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ))}
                  <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleGalleryUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    disabled={uploadImage.isPending}
                    className="w-16 h-16 rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                  >
                    <ImageIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Pricing Plans Section */}
              <div className="border-t border-border pt-4">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-foreground text-base font-semibold">Pricing Plans</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddPricingPlan}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Plan
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Add multiple pricing options (e.g., 1 Month, 1 Year)
                </p>

                {pricingPlans.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-border rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      No pricing plans added. The base price will be used.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pricingPlans.map((plan, index) => (
                      <div key={index} className="relative p-4 rounded-lg bg-secondary/30 border border-border">
                        <button
                          type="button"
                          onClick={() => handleRemovePricingPlan(index)}
                          className="absolute top-2 right-2 p-1 rounded-full hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          <div>
                            <Label className="text-xs text-muted-foreground">Plan Name</Label>
                            <Input
                              value={plan.name}
                              onChange={(e) => handlePricingPlanChange(index, 'name', e.target.value)}
                              placeholder="e.g., 1 Month"
                              className="mt-1 h-9 bg-background border-border"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Duration</Label>
                            <Input
                              value={plan.duration}
                              onChange={(e) => handlePricingPlanChange(index, 'duration', e.target.value)}
                              placeholder="e.g., 30 days"
                              className="mt-1 h-9 bg-background border-border"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Price (Rs.)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={plan.price}
                              onChange={(e) => handlePricingPlanChange(index, 'price', parseFloat(e.target.value) || 0)}
                              className="mt-1 h-9 bg-background border-border"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Old Price (Rs.)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={plan.old_price ?? ''}
                              onChange={(e) => handlePricingPlanChange(index, 'old_price', e.target.value === '' ? null : parseFloat(e.target.value))}
                              className="mt-1 h-9 bg-background border-border"
                            />
                          </div>
                        </div>
                        <label className="flex items-center gap-2 mt-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={plan.is_default}
                            onChange={(e) => handlePricingPlanChange(index, 'is_default', e.target.checked)}
                            className="rounded border-border"
                          />
                          <span className="text-sm text-muted-foreground">Default plan</span>
                        </label>

                        {/* Sub-Plans (Variants) Section */}
                        <div className="mt-4 pt-4 border-t border-border/50">
                          <div className="flex items-center justify-between mb-2">
                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Sub-Plans (Optional)</Label>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs"
                              onClick={() => handleAddVariant(index)}
                            >
                              <Plus className="w-3 h-3 mr-1" /> Add Sub-Plan
                            </Button>
                          </div>

                          {plan.variants && plan.variants.length > 0 && (
                            <div className="space-y-2">
                              {plan.variants.map((variant, vIndex) => (
                                <div key={vIndex} className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-2 p-3 rounded-lg bg-background/50 border border-border/50">
                                  <div className="flex-1 min-w-[120px]">
                                    <Label className="text-[10px] sm:text-xs text-muted-foreground">Name</Label>
                                    <Input
                                      value={variant.name}
                                      onChange={(e) => handleVariantChange(index, vIndex, 'name', e.target.value)}
                                      placeholder="e.g., 100k Credits"
                                      className="mt-1 h-8 sm:h-9 text-xs sm:text-sm"
                                    />
                                  </div>
                                  <div className="w-full sm:w-[100px]">
                                    <Label className="text-[10px] sm:text-xs text-muted-foreground">Price</Label>
                                    <Input
                                      type="number"
                                      value={variant.price}
                                      onChange={(e) => handleVariantChange(index, vIndex, 'price', parseFloat(e.target.value) || 0)}
                                      className="mt-1 h-8 sm:h-9 text-xs sm:text-sm"
                                    />
                                  </div>
                                  <div className="w-full sm:w-[120px]">
                                    <Label className="text-[10px] sm:text-xs text-muted-foreground">Stock Status</Label>
                                    <Select
                                      value={variant.stock_status}
                                      onValueChange={(val) => handleVariantChange(index, vIndex, 'stock_status', val)}
                                    >
                                      <SelectTrigger className="mt-1 h-8 sm:h-9 text-xs sm:text-sm">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="in_stock">In Stock</SelectItem>
                                        <SelectItem value="limited">Limited</SelectItem>
                                        <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 sm:h-9 sm:w-9 text-destructive hover:bg-destructive/10 sm:self-center"
                                    onClick={() => handleRemoveVariant(index, vIndex)}
                                  >
                                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="hero" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingProduct ? 'Update' : 'Add'} Product
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* CSV bulk import */}
      <Dialog
        open={isImportOpen}
        onOpenChange={(open) => {
          setIsImportOpen(open);
          if (!open) {
            setImportPreview([]);
            setImportError(null);
          }
        }}
      >
        <DialogContent className="max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Import products (CSV)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Best way to add 50+ products: fill the template in Excel/Google Sheets, export CSV, upload here.
              Plans/variants can still be edited per product after import.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={downloadCsvTemplate}>
                <Download className="w-4 h-4 mr-2" />
                Download template
              </Button>
              <Button type="button" variant="outline" onClick={() => csvInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                Choose CSV
              </Button>
              <input
                ref={csvInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={handleCsvFile}
              />
            </div>
            <div className="text-[11px] text-muted-foreground p-3 rounded-xl bg-secondary/40 border border-border font-mono leading-relaxed">
              Columns: name*, description, price, old_price, category, image_url,
              stock_status (in_stock|limited|out_of_stock), is_featured, is_active, manual_fulfillment
            </div>
            {importError && (
              <p className="text-sm text-destructive font-medium">{importError}</p>
            )}
            {importPreview.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-bold text-foreground">
                  Preview: {importPreview.length} product{importPreview.length === 1 ? '' : 's'}
                </p>
                <div className="max-h-48 overflow-y-auto rounded-xl border border-border divide-y divide-border">
                  {importPreview.slice(0, 20).map((p, i) => (
                    <div key={`${p.name}-${i}`} className="px-3 py-2 text-xs flex justify-between gap-2">
                      <span className="font-medium text-foreground truncate">{p.name}</span>
                      <span className="text-muted-foreground shrink-0">
                        {p.category} · {formatPrice(p.price)}
                      </span>
                    </div>
                  ))}
                  {importPreview.length > 20 && (
                    <p className="px-3 py-2 text-xs text-muted-foreground">
                      +{importPreview.length - 20} more…
                    </p>
                  )}
                </div>
                <Button
                  variant="hero"
                  className="w-full"
                  disabled={bulkAddProducts.isPending}
                  onClick={handleConfirmImport}
                >
                  {bulkAddProducts.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                  )}
                  Import {importPreview.length} products
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Source filter: store vs API products (API products are separate, not replacements) */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {(
          [
            { id: 'all' as const, label: 'All', count: products.length },
            { id: 'store' as const, label: 'Store products', count: storeProductCount },
            { id: 'api' as const, label: 'API products', count: apiProductCount },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSourceFilter(tab.id)}
            className={cn(
              'px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wide border transition-colors',
              sourceFilter === tab.id
                ? tab.id === 'api'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-primary text-primary-foreground border-primary'
                : 'bg-card border-border text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
            <span className="ml-1.5 opacity-80 tabular-nums">({tab.count})</span>
          </button>
        ))}
        <p className="text-[11px] text-muted-foreground w-full sm:w-auto sm:ml-2">
          API products come from Reseller API import — they do not replace store products.
        </p>
      </div>

      {/* Search + order tip */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder={
              sourceFilter === 'api'
                ? 'Search API products...'
                : sourceFilter === 'store'
                  ? 'Search store products...'
                  : 'Search products...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 bg-card border-border"
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/40 border border-border rounded-xl px-3 py-2.5">
          <GripVertical className="w-4 h-4 shrink-0 text-primary" />
          {canReorder ? (
            <span>
              <span className="font-semibold text-foreground">Drag ⋮⋮</span> or use ↑↓ / top-bottom.
              This order is what shoppers see on the storefront.
            </span>
          ) : (
            <span>
              {sourceFilter !== 'all'
                ? 'Switch filter to All and clear search to reorder.'
                : 'Clear the search box to reorder products (drag is disabled while filtering).'}
            </span>
          )}
          {isReordering && (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary ml-1 shrink-0" />
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Products Table */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-secondary/50">
                    <th className="text-left text-sm font-medium text-muted-foreground py-4 px-3 w-14">#</th>
                    <th className="text-left text-sm font-medium text-muted-foreground py-4 px-2 w-10"></th>
                    <th className="text-left text-sm font-medium text-muted-foreground py-4 px-4">Product</th>
                    <th className="text-left text-sm font-medium text-muted-foreground py-4 px-4">Category</th>
                    <th className="text-left text-sm font-medium text-muted-foreground py-4 px-4">Price</th>
                    <th className="text-left text-sm font-medium text-muted-foreground py-4 px-4">Status</th>
                    <th className="text-left text-sm font-medium text-muted-foreground py-4 px-4">Plans</th>
                    <th className="text-right text-sm font-medium text-muted-foreground py-4 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => {
                    const productPlans = getProductPricingPlans(product.id);
                    const productImages = getProductGalleryImages(product.id);
                    const fullIndex = products.findIndex((p) => p.id === product.id);
                    const isFirst = fullIndex === 0;
                    const isLast = fullIndex === products.length - 1;
                    const isDragging = dragId === product.id;
                    const isDropTarget = dragOverId === product.id && dragId !== product.id;
                    const isApi = isResellerApiProduct(product);

                    return (
                      <tr
                        key={product.id}
                        onDragOver={(e) => handleDragOver(e, product.id)}
                        onDrop={(e) => handleDrop(e, product.id)}
                        onDragLeave={() => {
                          if (dragOverId === product.id) setDragOverId(null);
                        }}
                        className={cn(
                          "border-t border-border transition-colors",
                          !product.is_active && "opacity-60",
                          isDragging && "opacity-40 bg-primary/5",
                          isDropTarget && "bg-primary/10 ring-1 ring-inset ring-primary/40",
                          isApi && "bg-emerald-500/[0.06]",
                        )}
                      >
                        <td className="py-4 px-3">
                          <span className="inline-flex items-center justify-center min-w-[1.75rem] h-7 px-1.5 rounded-lg bg-secondary text-xs font-black text-muted-foreground tabular-nums">
                            {fullIndex + 1}
                          </span>
                        </td>
                        <td className="py-4 px-1">
                          <button
                            type="button"
                            draggable={canReorder && !isReordering}
                            onDragStart={(e) => handleDragStart(e, product.id)}
                            onDragEnd={handleDragEnd}
                            disabled={!canReorder || isReordering}
                            title={canReorder ? 'Drag to reorder' : 'Clear search to drag-reorder'}
                            className={cn(
                              "p-1.5 rounded-lg text-muted-foreground transition-colors",
                              canReorder && !isReordering
                                ? "cursor-grab active:cursor-grabbing hover:bg-secondary hover:text-foreground"
                                : "cursor-not-allowed opacity-40"
                            )}
                          >
                            <GripVertical className="w-4 h-4" />
                          </button>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="relative w-12 h-12 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-full h-full object-cover"
                                draggable={false}
                              />
                              {productImages.length > 0 && (
                                <div className="absolute bottom-0 right-0 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center rounded-tl">
                                  +{productImages.length}
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-medium text-foreground">{product.name}</p>
                                {isApi && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-600 text-white">
                                    API
                                  </span>
                                )}
                                {product.is_featured && (
                                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-1">{product.description}</p>
                              {isApi && product.reseller_product_id && (
                                <p className="text-[10px] font-mono text-emerald-700/80 dark:text-emerald-400/80 mt-0.5 truncate max-w-[220px]">
                                  ID: {product.reseller_product_id}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={cn(
                              'px-2.5 py-1 rounded-full text-xs font-medium',
                              isApi
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                                : 'bg-primary/10 text-primary',
                            )}
                          >
                            {product.category}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-medium text-foreground">
                          {isApi ? (
                            <div>
                              <span>{formatPrice(productPriceInLkr(product))}</span>
                              <span className="block text-[10px] text-muted-foreground font-normal">
                                Customer sell
                                {product.reseller_cost_usd != null && (
                                  <> · cost ${Number(product.reseller_cost_usd).toFixed(2)}</>
                                )}
                              </span>
                            </div>
                          ) : (
                            <>
                              {formatPrice(product.price)}
                              {product.old_price && (
                                <span className="ml-2 text-sm text-muted-foreground line-through">
                                  {formatPrice(product.old_price)}
                                </span>
                              )}
                            </>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-col gap-1">
                            <span className={cn(
                              "px-2 py-0.5 rounded text-xs font-medium w-fit",
                              product.is_active ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                            )}>
                              {product.is_active ? 'Active' : 'Inactive'}
                            </span>
                            <span className={cn(
                              "px-2 py-0.5 rounded text-xs w-fit",
                              product.stock_status === 'in_stock' ? "bg-green-500/10 text-green-500" :
                                product.stock_status === 'limited' ? "bg-amber-500/10 text-amber-500" :
                                  "bg-red-500/10 text-red-500"
                            )}>
                              {product.stock_status === 'in_stock' ? 'In Stock' :
                                product.stock_status === 'limited' ? 'Limited' : 'Out of Stock'}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          {productPlans.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {productPlans.map(plan => (
                                <span
                                  key={plan.id}
                                  className="px-2 py-0.5 rounded text-xs bg-secondary text-muted-foreground"
                                >
                                  {plan.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-end gap-0.5">
                            <div className="flex items-center mr-1 border-r border-border pr-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => moveProduct.mutate({ productId: product.id, direction: 'top' })}
                                disabled={isReordering || !canReorder || isFirst}
                                title="Move to top"
                              >
                                <ChevronsUp className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => moveProduct.mutate({ productId: product.id, direction: 'up' })}
                                disabled={isReordering || !canReorder || isFirst}
                                title="Move up"
                              >
                                <ArrowUp className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => moveProduct.mutate({ productId: product.id, direction: 'down' })}
                                disabled={isReordering || !canReorder || isLast}
                                title="Move down"
                              >
                                <ArrowDown className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => moveProduct.mutate({ productId: product.id, direction: 'bottom' })}
                                disabled={isReordering || !canReorder || isLast}
                                title="Move to bottom"
                              >
                                <ChevronsDown className="w-4 h-4" />
                              </Button>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleToggleActive(product)}
                              title={product.is_active ? 'Deactivate' : 'Activate'}
                            >
                              {product.is_active ? (
                                <Eye className="w-4 h-4 text-green-500" />
                              ) : (
                                <EyeOff className="w-4 h-4 text-muted-foreground" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleToggleFeatured(product)}
                              title={product.is_featured ? 'Remove from featured' : 'Add to featured'}
                            >
                              <Star className={cn(
                                "w-4 h-4",
                                product.is_featured ? "text-amber-500 fill-amber-500" : "text-muted-foreground"
                              )} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleOpenDialog(product)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDelete(product.id)}
                              disabled={deleteProduct.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mt-4">
            Showing {filteredProducts.length} of {products.length} products
          </p>
        </>
      )}
    </div>
  );
};

export default AdminProducts;

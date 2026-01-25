import { useState, useRef } from 'react';
import { Plus, Pencil, Trash2, Search, Upload, Loader2, X, Eye, EyeOff, Star, Package, Image as ImageIcon } from 'lucide-react';
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
  DialogTrigger,
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
  useUpdateProduct,
  useDeleteProduct,
  useUploadProductImage,
  type Product,
  type ProductFormData,
  type StockStatus,
} from '@/hooks/useProducts';
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
import { useCurrency } from '@/hooks/useCurrency';
import { cn } from '@/lib/utils';

interface PricingPlanInput {
  id?: string;
  name: string;
  duration: string;
  price: number;
  old_price: number | null;
  is_default: boolean;
}

interface GalleryImageInput {
  id?: string;
  image_url: string;
}

const AdminProducts = () => {
  const { formatPrice } = useCurrency();
  const { data: products = [], isLoading } = useProducts(true); // Include inactive
  const { data: allPricingPlans = [] } = useAllPricingPlans();
  const { data: allProductImages = [] } = useAllProductImages();
  const addProduct = useAddProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const uploadImage = useUploadProductImage();
  const addPricingPlan = useAddPricingPlan();
  const deletePricingPlan = useDeletePricingPlan();
  const addProductImage = useAddProductImage();
  const deleteProductImage = useDeleteProductImage();

  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
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
  });
  const [pricingPlans, setPricingPlans] = useState<PricingPlanInput[]>([]);
  const [existingPlanIds, setExistingPlanIds] = useState<string[]>([]);
  const [galleryImages, setGalleryImages] = useState<GalleryImageInput[]>([]);
  const [existingImageIds, setExistingImageIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getProductPricingPlans = (productId: string) => {
    return allPricingPlans.filter(p => p.product_id === productId);
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

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      const productPlans = getProductPricingPlans(product.id);
      const productImages = getProductGalleryImages(product.id);
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price,
        old_price: product.old_price ?? null,
        category: product.category,
        image_url: product.image_url,
        is_active: product.is_active ?? true,
        is_featured: product.is_featured ?? false,
        stock_status: product.stock_status ?? 'in_stock',
        requirements: product.requirements ?? { require_email: false, require_password: false },
      });
      setPricingPlans(productPlans.map(p => ({
        id: p.id,
        name: p.name,
        duration: p.duration,
        price: p.price,
        old_price: p.old_price ?? null,
        is_default: p.is_default,
      })));
      setExistingPlanIds(productPlans.map(p => p.id));
      setGalleryImages(productImages.map(img => ({
        id: img.id,
        image_url: img.image_url,
      })));
      setExistingImageIds(productImages.map(img => img.id));
    } else {
      setEditingProduct(null);
      setFormData({
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
      });
      setPricingPlans([]);
      setExistingPlanIds([]);
      setGalleryImages([]);
      setExistingImageIds([]);
    }
    setIsDialogOpen(true);
  };

  const handleAddPricingPlan = () => {
    setPricingPlans(prev => [...prev, {
      name: '',
      duration: '',
      price: 0,
      old_price: null,
      is_default: prev.length === 0,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let productId: string;

    if (editingProduct) {
      await updateProduct.mutateAsync({ id: editingProduct.id, ...formData });
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
      const newProduct = await addProduct.mutateAsync(formData);
      productId = newProduct.id;
    }

    // Add new pricing plans
    for (const plan of pricingPlans) {
      if (!plan.id) {
        await addPricingPlan.mutateAsync({
          product_id: productId,
          name: plan.name,
          duration: plan.duration,
          price: plan.price,
          old_price: plan.old_price,
          is_default: plan.is_default,
        });
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

  const isSubmitting = addProduct.isPending || updateProduct.isPending || addPricingPlan.isPending || addProductImage.isPending;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">Products</h1>
          <p className="text-muted-foreground">Manage your product catalog</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="hero" onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border custom-scrollbar">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <Label htmlFor="name" className="text-foreground">Product Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="mt-1.5 bg-secondary/50 border-border"
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
                      value={formData.description}
                      onChange={handleInputChange}
                      className="bg-secondary/50 border-border min-h-[150px] font-mono text-sm"
                      placeholder="Use emoji headers and bullet points for best formatting&#10;&#10;🚀 PRODUCT TITLE&#10;&#10;✨ What's Included:&#10;✅ Feature 1&#10;✅ Feature 2&#10;✅ Feature 3"
                      required
                    />
                  </TabsContent>
                  <TabsContent value="preview" className="bg-secondary/30 border border-border rounded-lg p-4 min-h-[150px]">
                    <FormattedDescription description={formData.description} />
                    {!formData.description && (
                      <p className="text-sm text-muted-foreground italic">Type something in the 'Write' tab to see a preview...</p>
                    )}
                  </TabsContent>
                </Tabs>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price" className="text-foreground">Base Price (Rs.)</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="mt-1.5 bg-secondary/50 border-border"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="old_price" className="text-foreground">Old Price (Rs.)</Label>
                  <Input
                    id="old_price"
                    name="old_price"
                    type="number"
                    step="0.01"
                    value={formData.old_price ?? ''}
                    onChange={handleInputChange}
                    className="mt-1.5 bg-secondary/50 border-border"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category" className="text-foreground">Category</Label>
                  <Input
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="mt-1.5 bg-secondary/50 border-border"
                    required
                  />
                </div>
                <div>
                  <Label className="text-foreground">Stock Status</Label>
                  <Select
                    value={formData.stock_status}
                    onValueChange={(value: StockStatus) => setFormData(prev => ({ ...prev, stock_status: value }))}
                  >
                    <SelectTrigger className="mt-1.5 bg-secondary/50 border-border">
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
                        <div className="grid grid-cols-2 gap-3">
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

      {/* Search */}
      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-12 bg-card border-border"
        />
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
                    return (
                      <tr key={product.id} className={cn("border-t border-border", !product.is_active && "opacity-60")}>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="relative w-12 h-12 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                              {productImages.length > 0 && (
                                <div className="absolute bottom-0 right-0 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center rounded-tl">
                                  +{productImages.length}
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-foreground">{product.name}</p>
                                {product.is_featured && (
                                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-1">{product.description}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            {product.category}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-medium text-foreground">
                          {formatPrice(product.price)}
                          {product.old_price && (
                            <span className="ml-2 text-sm text-muted-foreground line-through">
                              {formatPrice(product.old_price)}
                            </span>
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
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
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
                              onClick={() => handleOpenDialog(product)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
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

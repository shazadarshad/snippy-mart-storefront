import { useState, useRef } from 'react';
import { Plus, Pencil, Trash2, Search, Upload, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  useProducts,
  useAddProduct,
  useUpdateProduct,
  useDeleteProduct,
  useUploadProductImage,
  type Product,
  type ProductFormData,
} from '@/hooks/useProducts';
import {
  useAllPricingPlans,
  useAddPricingPlan,
  useDeletePricingPlan,
  type PricingPlan,
} from '@/hooks/usePricingPlans';
import { formatPrice } from '@/lib/store';

interface PricingPlanInput {
  id?: string;
  name: string;
  duration: string;
  price: number;
  old_price: number | null;
  is_default: boolean;
}

const AdminProducts = () => {
  const { data: products = [], isLoading } = useProducts();
  const { data: allPricingPlans = [] } = useAllPricingPlans();
  const addProduct = useAddProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const uploadImage = useUploadProductImage();
  const addPricingPlan = useAddPricingPlan();
  const deletePricingPlan = useDeletePricingPlan();

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
  });
  const [pricingPlans, setPricingPlans] = useState<PricingPlanInput[]>([]);
  const [existingPlanIds, setExistingPlanIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getProductPricingPlans = (productId: string) => {
    return allPricingPlans.filter(p => p.product_id === productId);
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

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      const productPlans = getProductPricingPlans(product.id);
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price,
        old_price: product.old_price ?? null,
        category: product.category,
        image_url: product.image_url,
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
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        price: 0,
        old_price: null,
        category: '',
        image_url: '/placeholder.svg',
      });
      setPricingPlans([]);
      setExistingPlanIds([]);
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
      // Ensure at least one default if any plans exist
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
          // Set all others to false
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
    } else {
      const newProduct = await addProduct.mutateAsync(formData);
      productId = newProduct.id;
    }

    // Add/update pricing plans
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

    setIsDialogOpen(false);
  };

  const handleDelete = async (productId: string) => {
    await deleteProduct.mutateAsync(productId);
  };

  const isSubmitting = addProduct.isPending || updateProduct.isPending || addPricingPlan.isPending;

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
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
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
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="mt-1.5 bg-secondary/50 border-border min-h-[120px]"
                  placeholder="Use emoji headers and bullet points for best formatting&#10;&#10;🔥 PRODUCT TITLE&#10;&#10;✨ What's Included:&#10;* Feature 1&#10;* Feature 2&#10;* Feature 3"
                  required
                />
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
                <Label className="text-foreground">Product Image</Label>
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
                    <th className="text-left text-sm font-medium text-muted-foreground py-4 px-4">Plans</th>
                    <th className="text-right text-sm font-medium text-muted-foreground py-4 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => {
                    const productPlans = getProductPricingPlans(product.id);
                    return (
                      <tr key={product.id} className="border-t border-border">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{product.name}</p>
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
                          <div className="flex items-center justify-end gap-2">
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

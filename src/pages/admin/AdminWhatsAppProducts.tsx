// WhatsApp Products Manager - Admin Panel
// /admin/whatsapp/products

import { useState } from 'react';
import { Search, Edit, Power, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useWhatsAppProducts, useToggleWhatsAppProduct } from '@/hooks/useWhatsAppProducts';
import { WhatsAppFlowEditor } from '@/components/whatsapp/WhatsAppFlowEditor';
import type { WhatsAppProductWithConfig } from '@/types/whatsapp';

const AdminWhatsAppProducts = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<WhatsAppProductWithConfig | null>(null);
    const [isEditorOpen, setIsEditorOpen] = useState(false);

    const { data: products = [], isLoading } = useWhatsAppProducts();
    const toggleProduct = useToggleWhatsAppProduct();

    // Filter products by search
    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleToggle = async (productId: string, currentStatus: boolean) => {
        await toggleProduct.mutateAsync({
            productId,
            enabled: !currentStatus,
        });
    };

    const handleEditFlow = (product: WhatsAppProductWithConfig) => {
        setSelectedProduct(product);
        setIsEditorOpen(true);
    };

    const handleCloseEditor = () => {
        setSelectedProduct(null);
        setIsEditorOpen(false);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-muted-foreground">Loading products...</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">WhatsApp Products</h1>
                <p className="text-muted-foreground">
                    Manage which products are available in WhatsApp bot and configure their flows
                </p>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Products Table */}
            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>WhatsApp Status</TableHead>
                            <TableHead>Menu Title</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Triggers</TableHead>
                            <TableHead>Flow Steps</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredProducts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                    No products found
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredProducts.map((product) => {
                                const config = product.whatsapp_config;
                                const isEnabled = config?.enabled ?? false;

                                return (
                                    <TableRow key={product.id}>
                                        {/* Product Info */}
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={product.image_url}
                                                    alt={product.name}
                                                    className="w-10 h-10 rounded object-cover"
                                                />
                                                <div>
                                                    <div className="font-medium">{product.name}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        ₹{product.price}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>

                                        {/* Status Toggle */}
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Switch
                                                    checked={isEnabled}
                                                    onCheckedChange={() => handleToggle(product.id, isEnabled)}
                                                    disabled={toggleProduct.isPending}
                                                />
                                                {isEnabled ? (
                                                    <Badge variant="default" className="bg-green-500">
                                                        <Check className="w-3 h-3 mr-1" />
                                                        Enabled
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary">
                                                        <X className="w-3 h-3 mr-1" />
                                                        Disabled
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>

                                        {/* Menu Title */}
                                        <TableCell>
                                            {config?.menu_title || (
                                                <span className="text-muted-foreground italic">Not set</span>
                                            )}
                                        </TableCell>

                                        {/* Priority */}
                                        <TableCell>
                                            {config?.priority !== undefined ? (
                                                <Badge variant="outline">{config.priority}</Badge>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>

                                        {/* Triggers */}
                                        <TableCell>
                                            {config?.triggers && config.triggers.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {config.triggers.slice(0, 2).map((trigger, idx) => (
                                                        <Badge key={idx} variant="secondary" className="text-xs">
                                                            {trigger}
                                                        </Badge>
                                                    ))}
                                                    {config.triggers.length > 2 && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            +{config.triggers.length - 2}
                                                        </Badge>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">No triggers</span>
                                            )}
                                        </TableCell>

                                        {/* Flow Steps Count */}
                                        <TableCell>
                                            {config?.flow_steps && config.flow_steps.length > 0 ? (
                                                <Badge variant="outline">
                                                    {config.flow_steps.length} {config.flow_steps.length === 1 ? 'step' : 'steps'}
                                                </Badge>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">No flow</span>
                                            )}
                                        </TableCell>

                                        {/* Actions */}
                                        <TableCell className="text-right">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleEditFlow(product)}
                                            >
                                                <Edit className="w-4 h-4 mr-2" />
                                                Edit Flow
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Stats Summary */}
            <div className="mt-6 flex gap-4 text-sm text-muted-foreground">
                <div>
                    Total Products: <span className="font-medium text-foreground">{products.length}</span>
                </div>
                <div>
                    Enabled for WhatsApp:{' '}
                    <span className="font-medium text-green-600">
                        {products.filter(p => p.whatsapp_config?.enabled).length}
                    </span>
                </div>
                <div>
                    Configured:{' '}
                    <span className="font-medium text-foreground">
                        {products.filter(p => p.whatsapp_config?.flow_steps?.length > 0).length}
                    </span>
                </div>
            </div>

            {/* Flow Editor Modal */}
            {selectedProduct && (
                <WhatsAppFlowEditor
                    product={selectedProduct}
                    isOpen={isEditorOpen}
                    onClose={handleCloseEditor}
                />
            )}
        </div>
    );
};

export default AdminWhatsAppProducts;

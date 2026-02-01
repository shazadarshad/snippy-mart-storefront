import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProducts } from '@/hooks/useProducts';
import ProductDetailModal from '@/components/products/ProductDetailModal';
import { Loader2 } from 'lucide-react';

const ProductPage = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { data: products, isLoading } = useProducts();
    const [selectedProduct, setSelectedProduct] = useState<any>(null);

    useEffect(() => {
        if (!isLoading && products && slug) {
            // Find product by slug or ID
            const product = products.find(p => p.slug === slug || p.id === slug);
            if (product) {
                setSelectedProduct(product);
            } else {
                // Product not found, redirect to products page
                navigate('/products');
            }
        }
    }, [slug, products, isLoading, navigate]);

    const handleClose = () => {
        setSelectedProduct(null);
        navigate('/products');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center space-y-4">
                    <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
                    <p className="text-muted-foreground">Loading product...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {selectedProduct && (
                <ProductDetailModal
                    product={selectedProduct}
                    isOpen={true}
                    onClose={handleClose}
                />
            )}
        </div>
    );
};

export default ProductPage;

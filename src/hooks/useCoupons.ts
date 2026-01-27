import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCartStore, type Coupon } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';

export const useCoupons = () => {
    const [isValidating, setIsValidating] = useState(false);
    const { toast } = useToast();
    const { getTotal, applyCoupon } = useCartStore();

    const validateAndApplyCoupon = async (code: string) => {
        if (!code.trim()) {
            toast({
                title: "Error",
                description: "Please enter a coupon code.",
                variant: "destructive",
            });
            return false;
        }

        setIsValidating(true);
        try {
            const subtotal = getTotal();

            // Query active coupons
            const { data, error } = await supabase
                .from('coupons')
                .select('*')
                .eq('code', code.toUpperCase())
                .eq('is_active', true)
                .single();

            if (error || !data) {
                toast({
                    title: "Invalid Coupon",
                    description: "This coupon code does not exist or is inactive.",
                    variant: "destructive",
                });
                return false;
            }

            const coupon = data as any;

            // Check expiry
            if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
                toast({
                    title: "Expired",
                    description: "This coupon code has expired.",
                    variant: "destructive",
                });
                return false;
            }

            // Check minimum order amount
            if (coupon.min_order_amount && subtotal < coupon.min_order_amount) {
                toast({
                    title: "Minimum Amount Not Met",
                    description: `This coupon requires a minimum order of ${coupon.min_order_amount}.`,
                    variant: "destructive",
                });
                return false;
            }

            // Check usage limit
            if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
                toast({
                    title: "Limit Reached",
                    description: "This coupon has reached its maximum usage limit.",
                    variant: "destructive",
                });
                return false;
            }

            // If all checks pass, apply it
            applyCoupon({
                id: coupon.id,
                code: coupon.code,
                type: coupon.type,
                value: coupon.value,
                min_order_amount: coupon.min_order_amount,
                max_discount: coupon.max_discount,
            });

            toast({
                title: "Coupon Applied",
                description: `Discount of ${coupon.type === 'percentage' ? `${coupon.value}%` : 'fixed amount'} applied!`,
            });

            return true;
        } catch (err) {
            console.error('Coupon validation error:', err);
            toast({
                title: "Error",
                description: "Something went wrong while validating the coupon.",
                variant: "destructive",
            });
            return false;
        } finally {
            setIsValidating(false);
        }
    };

    return {
        validateAndApplyCoupon,
        isValidating,
    };
};

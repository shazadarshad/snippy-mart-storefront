-- =====================================================
-- COUPON & VOUCHER SYSTEM
-- =====================================================

-- 1. Create Coupons Table
CREATE TABLE IF NOT EXISTS public.coupons (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    code text NOT NULL UNIQUE,
    description text,
    type text NOT NULL CHECK (type IN ('fixed', 'percentage')),
    value numeric NOT NULL,
    min_order_amount numeric DEFAULT 0,
    max_discount numeric, -- Only used for percentage types
    starts_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone,
    usage_limit integer,
    used_count integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 2. Add Coupon Fields to Orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS applied_coupon_id uuid REFERENCES public.coupons(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS discount_amount numeric DEFAULT 0;

-- 3. Enable RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- 4. Coupons Policies
-- Admins can do everything
CREATE POLICY "Admins can manage coupons" 
ON public.coupons 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can check if a coupon exists (but we limit what they see)
-- NOTE: In practice, validation usually happens via an Edge Function or restricted RPC for security,
-- but a simple SELECT with specific columns is often sufficient for a storefront.
CREATE POLICY "Public can view active coupons" 
ON public.coupons 
FOR SELECT 
USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- 5. Updated At Trigger
CREATE TRIGGER update_coupons_updated_at
BEFORE UPDATE ON public.coupons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 6. RPC for incrementing coupon usage (atomically)
CREATE OR REPLACE FUNCTION public.increment_coupon_usage(coupon_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.coupons
    SET used_count = used_count + 1
    WHERE id = coupon_id;
END;
$$;

-- 7. Insert Sample Coupon
INSERT INTO public.coupons (code, description, type, value, min_order_amount, is_active)
VALUES ('WELCOME10', '10% New Customer Discount', 'percentage', 10, 500, true)
ON CONFLICT (code) DO NOTHING;

-- Create table for pricing plan variants (Sub-Plans)
CREATE TABLE IF NOT EXISTS public.product_pricing_plan_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID REFERENCES public.product_pricing_plans(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g., "Shared", "Private"
    price DECIMAL(10, 2) NOT NULL,
    old_price DECIMAL(10, 2),
    is_active BOOLEAN DEFAULT true,
    stock_status TEXT DEFAULT 'in_stock' CHECK (stock_status IN ('in_stock', 'limited', 'out_of_stock')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_pricing_plan_variants ENABLE ROW LEVEL SECURITY;

-- Creating policies
-- Admins can do everything
CREATE POLICY "Admins can manage plan variants" 
    ON public.product_pricing_plan_variants 
    FOR ALL 
    TO authenticated 
    USING (public.is_admin());

-- Public can view active variants
CREATE POLICY "Public can view active plan variants" 
    ON public.product_pricing_plan_variants 
    FOR SELECT 
    TO anon, authenticated 
    USING (is_active = true);

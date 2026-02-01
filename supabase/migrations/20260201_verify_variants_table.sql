-- Verify and fix product_pricing_plan_variants table

-- Drop and recreate the table to ensure it's properly registered
DROP TABLE IF EXISTS public.product_pricing_plan_variants CASCADE;

-- Create the table
CREATE TABLE public.product_pricing_plan_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.product_pricing_plans(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  old_price DECIMAL(10, 2),
  is_active BOOLEAN DEFAULT true,
  stock_status TEXT DEFAULT 'in_stock' CHECK (stock_status IN ('in_stock', 'limited', 'out_of_stock')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pricing_plan_variants_plan_id ON public.product_pricing_plan_variants(plan_id);
CREATE INDEX IF NOT EXISTS idx_pricing_plan_variants_is_active ON public.product_pricing_plan_variants(is_active);

-- Enable RLS
ALTER TABLE public.product_pricing_plan_variants ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access to active variants" ON public.product_pricing_plan_variants;
DROP POLICY IF EXISTS "Allow authenticated users full access to variants" ON public.product_pricing_plan_variants;

-- Create RLS policies
-- Public can read active variants
CREATE POLICY "Allow public read access to active variants"
  ON public.product_pricing_plan_variants
  FOR SELECT
  USING (is_active = true);

-- Authenticated users can do everything (simplified - no admin check)
CREATE POLICY "Allow authenticated users full access to variants"
  ON public.product_pricing_plan_variants
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_product_pricing_plan_variants_updated_at ON public.product_pricing_plan_variants;

CREATE TRIGGER update_product_pricing_plan_variants_updated_at
    BEFORE UPDATE ON public.product_pricing_plan_variants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT SELECT ON public.product_pricing_plan_variants TO anon;
GRANT ALL ON public.product_pricing_plan_variants TO authenticated;
GRANT ALL ON public.product_pricing_plan_variants TO service_role;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';

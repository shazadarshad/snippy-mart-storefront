-- Create product_pricing_plans table
CREATE TABLE public.product_pricing_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  duration TEXT NOT NULL,
  price NUMERIC NOT NULL,
  old_price NUMERIC,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_pricing_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Pricing plans are viewable by everyone"
ON public.product_pricing_plans
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert pricing plans"
ON public.product_pricing_plans
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update pricing plans"
ON public.product_pricing_plans
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete pricing plans"
ON public.product_pricing_plans
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_product_pricing_plans_updated_at
BEFORE UPDATE ON public.product_pricing_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_product_pricing_plans_product_id ON public.product_pricing_plans(product_id);
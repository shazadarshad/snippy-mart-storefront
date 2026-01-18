-- Add payment method columns to orders table
ALTER TABLE public.orders
ADD COLUMN payment_method text DEFAULT NULL,
ADD COLUMN payment_proof_url text DEFAULT NULL,
ADD COLUMN binance_id text DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.orders.payment_method IS 'Payment method: bank_transfer or binance_usdt';
COMMENT ON COLUMN public.orders.payment_proof_url IS 'URL to uploaded receipt/screenshot';
COMMENT ON COLUMN public.orders.binance_id IS 'Customer Binance ID for USDT payments';

-- Create storage bucket for payment proofs
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for payment proofs - anyone can upload
CREATE POLICY "Anyone can upload payment proofs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'payment-proofs');

-- Admins can view payment proofs
CREATE POLICY "Admins can view payment proofs"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-proofs' AND public.has_role(auth.uid(), 'admin'));
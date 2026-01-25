-- Add currency fields to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS currency_code text DEFAULT 'LKR',
ADD COLUMN IF NOT EXISTS currency_symbol text DEFAULT 'Rs.',
ADD COLUMN IF NOT EXISTS currency_rate numeric DEFAULT 1;

-- Add comment
COMMENT ON COLUMN orders.total_amount IS 'Total amount in Base Currency (LKR)';
COMMENT ON COLUMN orders.currency_rate IS 'Exchange rate at time of purchase (LKR -> Purchase Currency)';

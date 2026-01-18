-- Insert payment method settings
INSERT INTO site_settings (key, value) VALUES 
  ('bank_name', 'REPLACE_WITH_BANK_NAME'),
  ('bank_branch', 'REPLACE_WITH_BRANCH'),
  ('bank_account_name', 'REPLACE_WITH_ACCOUNT_NAME'),
  ('bank_account_number', 'REPLACE_WITH_ACCOUNT_NUMBER'),
  ('binance_id', 'REPLACE_WITH_BINANCE_ID'),
  ('binance_name', 'REPLACE_WITH_BINANCE_NAME'),
  ('binance_coin', 'USDT')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
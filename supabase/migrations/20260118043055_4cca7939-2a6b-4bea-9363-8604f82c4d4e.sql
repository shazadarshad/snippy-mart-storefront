-- Insert payment method settings
INSERT INTO site_settings (key, value) VALUES 
  ('bank_name', 'Sampath Bank'),
  ('bank_branch', 'Horana'),
  ('bank_account_name', 'M A MUSAMMIL'),
  ('bank_account_number', '105752093919'),
  ('binance_id', '1190172947'),
  ('binance_name', 'Snippy Mart'),
  ('binance_coin', 'USDT')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
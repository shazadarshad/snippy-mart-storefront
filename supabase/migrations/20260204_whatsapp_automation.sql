-- WhatsApp Automation Sub-System Database Schema
-- Creates tables for WhatsApp bot integration without modifying existing tables

-- ============================================================================
-- 1. WhatsApp Product Configuration Table
-- ============================================================================
-- Links existing products to WhatsApp-specific settings

CREATE TABLE IF NOT EXISTS public.whatsapp_product_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  priority INTEGER NOT NULL DEFAULT 0,
  menu_title TEXT NOT NULL,
  triggers TEXT[] DEFAULT '{}',
  flow_steps JSONB DEFAULT '[]'::jsonb,
  show_order_link BOOLEAN DEFAULT true,
  escalation_keywords TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT unique_product_id UNIQUE(product_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_config_enabled 
  ON public.whatsapp_product_config(enabled);
  
CREATE INDEX IF NOT EXISTS idx_whatsapp_config_priority 
  ON public.whatsapp_product_config(priority);

CREATE INDEX IF NOT EXISTS idx_whatsapp_config_product_id 
  ON public.whatsapp_product_config(product_id);

-- Comments
COMMENT ON TABLE public.whatsapp_product_config IS 
  'WhatsApp-specific configuration for products. Links to existing products table.';
  
COMMENT ON COLUMN public.whatsapp_product_config.flow_steps IS 
  'JSONB array of {title, message, delayMs} objects defining the WhatsApp conversation flow';
  
COMMENT ON COLUMN public.whatsapp_product_config.triggers IS 
  'Array of keywords that trigger this product in WhatsApp (e.g., ["cursor", "cursor pro"])';

-- ============================================================================
-- 2. WhatsApp Logs Table
-- ============================================================================
-- Tracks all WhatsApp bot interactions for analytics

CREATE TABLE IF NOT EXISTS public.whatsapp_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  message TEXT,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  event TEXT NOT NULL,
  source TEXT DEFAULT 'whatsapp',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_phone 
  ON public.whatsapp_logs(phone);
  
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_product 
  ON public.whatsapp_logs(product_id);
  
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_created 
  ON public.whatsapp_logs(created_at DESC);
  
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_event 
  ON public.whatsapp_logs(event);

-- Comments
COMMENT ON TABLE public.whatsapp_logs IS 
  'Logs all WhatsApp bot interactions for analytics and debugging';
  
COMMENT ON COLUMN public.whatsapp_logs.event IS 
  'Event type: PRODUCT_VIEW, ORDER_CLICK, ESCALATION, FALLBACK, MENU_REQUEST';

-- ============================================================================
-- 3. WhatsApp Settings Table (Singleton)
-- ============================================================================
-- Global bot configuration

CREATE TABLE IF NOT EXISTS public.whatsapp_settings (
  id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  bot_enabled BOOLEAN NOT NULL DEFAULT true,
  default_fallback_message TEXT DEFAULT 'Sorry, I didn''t understand. Reply with *menu* to see available products.',
  business_hours_enabled BOOLEAN DEFAULT false,
  business_hours JSONB DEFAULT '{}'::jsonb,
  rate_limit_per_minute INTEGER DEFAULT 100,
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Ensure only one row exists
  CONSTRAINT only_one_settings_row CHECK (id = '00000000-0000-0000-0000-000000000001'::uuid)
);

-- Insert default settings row if not exists
INSERT INTO public.whatsapp_settings (id) 
VALUES ('00000000-0000-0000-0000-000000000001'::uuid)
ON CONFLICT (id) DO NOTHING;

-- Comments
COMMENT ON TABLE public.whatsapp_settings IS 
  'Global WhatsApp bot settings. Only one row allowed.';
  
COMMENT ON COLUMN public.whatsapp_settings.business_hours IS 
  'JSONB object: {start, end, days} for business hours configuration';

-- ============================================================================
-- 4. Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.whatsapp_product_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_settings ENABLE ROW LEVEL SECURITY;

-- whatsapp_product_config policies
CREATE POLICY "Public can read enabled WhatsApp products"
  ON public.whatsapp_product_config FOR SELECT
  USING (enabled = true);

CREATE POLICY "Authenticated users full access to WhatsApp config"
  ON public.whatsapp_product_config FOR ALL
  USING (auth.role() = 'authenticated');

-- whatsapp_logs policies
CREATE POLICY "Anyone can insert WhatsApp logs"
  ON public.whatsapp_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read WhatsApp logs"
  ON public.whatsapp_logs FOR SELECT
  USING (auth.role() = 'authenticated');

-- whatsapp_settings policies
CREATE POLICY "Public can read WhatsApp settings if bot enabled"
  ON public.whatsapp_settings FOR SELECT
  USING (bot_enabled = true OR auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update WhatsApp settings"
  ON public.whatsapp_settings FOR UPDATE
  USING (auth.role() = 'authenticated');

-- ============================================================================
-- 5. Trigger for updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_whatsapp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_whatsapp_product_config_updated_at
  BEFORE UPDATE ON public.whatsapp_product_config
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_updated_at();

CREATE TRIGGER update_whatsapp_settings_updated_at
  BEFORE UPDATE ON public.whatsapp_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_updated_at();

-- ============================================================================
-- 6. Sample Data (Optional - for testing)
-- ============================================================================

-- Uncomment to add sample WhatsApp configuration for existing products
-- This assumes you have products in your database
/*
INSERT INTO public.whatsapp_product_config (product_id, enabled, priority, menu_title, triggers, flow_steps)
SELECT 
  id,
  true,
  0,
  name,
  ARRAY[LOWER(name)]::TEXT[],
  '[
    {
      "title": "Product Information",
      "message": "This is a test product flow. Replace with actual content.",
      "delayMs": 1500
    }
  ]'::jsonb
FROM public.products
LIMIT 1;
*/

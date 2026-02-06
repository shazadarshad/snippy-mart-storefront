-- AI Knowledge Base Management
-- This table stores custom training data for the AI chat assistant

CREATE TABLE IF NOT EXISTS ai_knowledge_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL, -- 'product_detail', 'faq', 'policy', 'general'
    question TEXT, -- For FAQs
    answer TEXT, -- For FAQs
    product_id UUID REFERENCES products(id) ON DELETE CASCADE, -- For product-specific knowledge
    key TEXT NOT NULL, -- e.g., 'login_method', 'account_type', 'requirements'
    value TEXT NOT NULL, -- The actual knowledge content
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0, -- Higher priority items shown first
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_category ON ai_knowledge_items(category);
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_product ON ai_knowledge_items(product_id);
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_active ON ai_knowledge_items(is_active);

-- Enable RLS
ALTER TABLE ai_knowledge_items ENABLE ROW LEVEL SECURITY;

-- Public can read active items
CREATE POLICY "Anyone can read active AI knowledge"
    ON ai_knowledge_items
    FOR SELECT
    USING (is_active = true);

-- Only authenticated users (admins) can manage
CREATE POLICY "Authenticated users can manage AI knowledge"
    ON ai_knowledge_items
    FOR ALL
    USING (auth.role() = 'authenticated');

-- Add some default product knowledge examples
INSERT INTO ai_knowledge_items (category, product_id, key, value, priority) VALUES
-- These will be populated via admin panel
('general', NULL, 'greeting', 'Welcome to Snippy Mart! We provide premium digital subscription accounts.', 10);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_ai_knowledge_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ai_knowledge_updated_at
    BEFORE UPDATE ON ai_knowledge_items
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_knowledge_updated_at();

COMMENT ON TABLE ai_knowledge_items IS 'Custom training data for AI chat assistant';
COMMENT ON COLUMN ai_knowledge_items.category IS 'Type of knowledge: product_detail, faq, policy, general';
COMMENT ON COLUMN ai_knowledge_items.key IS 'Knowledge identifier like login_method, account_type, requirements';
COMMENT ON COLUMN ai_knowledge_items.value IS 'The actual knowledge content that AI will use';
COMMENT ON COLUMN ai_knowledge_items.priority IS 'Higher priority items are shown first to AI';

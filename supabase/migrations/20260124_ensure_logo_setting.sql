-- Ensure logo_url exists in site_settings
INSERT INTO site_settings (key, value)
VALUES ('logo_url', 'https://placehold.co/400x100/10b981/ffffff?text=Snippy+Mart')
ON CONFLICT (key) DO NOTHING;

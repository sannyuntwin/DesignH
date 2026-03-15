-- Brand Kits table
CREATE TABLE IF NOT EXISTS brand_kits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    colors JSONB DEFAULT '[]', -- Array of color hex codes
    fonts JSONB DEFAULT '[]', -- Array of font objects { family, url }
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_brand_kits_user_id ON brand_kits(user_id);

-- Optional trigger for updated_at (assuming update_updated_at_column function exists from schema.sql)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_brand_kits_updated_at'
    ) THEN
        CREATE TRIGGER update_brand_kits_updated_at 
        BEFORE UPDATE ON brand_kits
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

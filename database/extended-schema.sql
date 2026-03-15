-- Templates table
CREATE TABLE IF NOT EXISTS templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    canvas_data JSONB NOT NULL,
    thumbnail TEXT,
    category VARCHAR(100),
    tags TEXT[],
    is_public BOOLEAN DEFAULT true,
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Collaborations table
CREATE TABLE IF NOT EXISTS collaborations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    design_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    permission VARCHAR(20) DEFAULT 'view', -- view, edit, admin
    invited_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(design_id, user_id)
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    design_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    x_coordinate DECIMAL(10, 2),
    y_coordinate DECIMAL(10, 2),
    parent_id UUID, -- for threaded comments
    resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Version history table
CREATE TABLE IF NOT EXISTS design_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    design_id TEXT NOT NULL,
    version_number INTEGER NOT NULL,
    canvas_data JSONB NOT NULL,
    created_by TEXT NOT NULL,
    change_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(design_id, version_number)
);

-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT UNIQUE NOT NULL,
    display_name VARCHAR(255),
    bio TEXT,
    avatar_url TEXT,
    website VARCHAR(500),
    location VARCHAR(255),
    company VARCHAR(255),
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Export jobs table
CREATE TABLE IF NOT EXISTS export_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    design_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    export_type VARCHAR(20) NOT NULL, -- png, pdf, svg
    status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
    file_url TEXT,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Update designs table for new features
ALTER TABLE designs ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;
ALTER TABLE designs ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE designs ADD COLUMN IF NOT EXISTS category VARCHAR(100);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_public ON templates(is_public);
CREATE INDEX IF NOT EXISTS idx_templates_tags ON templates USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_collaborations_design_id ON collaborations(design_id);
CREATE INDEX IF NOT EXISTS idx_collaborations_user_id ON collaborations(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_design_id ON comments(design_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_versions_design_id ON design_versions(design_id);
CREATE INDEX IF NOT EXISTS idx_versions_created_at ON design_versions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_export_jobs_design_id ON export_jobs(design_id);
CREATE INDEX IF NOT EXISTS idx_export_jobs_user_id ON export_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_export_jobs_status ON export_jobs(status);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_designs_search ON designs USING GIN(
    to_tsvector('english', name || ' ' || COALESCE(description, '') || ' ' || COALESCE(array_to_string(tags, ' '), ''))
);
CREATE INDEX IF NOT EXISTS idx_templates_search ON templates USING GIN(
    to_tsvector('english', name || ' ' || COALESCE(description, '') || ' ' || COALESCE(array_to_string(tags, ' '), ''))
);

-- Triggers for updated_at
CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collaborations_updated_at BEFORE UPDATE ON collaborations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample templates
INSERT INTO templates (name, description, canvas_data, category, tags) VALUES
('Business Card', 'Professional business card template', '{"elements": [{"type": "text", "content": "Your Name", "x": 50, "y": 50}]}', 'business', ARRAY['business', 'card', 'professional']),
('Social Media Post', 'Instagram post template', '{"elements": [{"type": "text", "content": "Your Caption", "x": 50, "y": 50}]}', 'social', ARRAY['social', 'instagram', 'post']),
('Presentation Slide', 'Clean presentation slide', '{"elements": [{"type": "text", "content": "Slide Title", "x": 50, "y": 50}]}', 'presentation', ARRAY['presentation', 'slide', 'clean'])
ON CONFLICT DO NOTHING;

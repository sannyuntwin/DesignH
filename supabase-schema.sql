-- Create designs table for storing design data
CREATE TABLE IF NOT EXISTS designs (
  id TEXT PRIMARY KEY,
  content JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_designs_updated_at ON designs(updated_at);

-- Enable Row Level Security (RLS)
ALTER TABLE designs ENABLE ROW LEVEL SECURITY;

-- Create policy for public access (adjust as needed for your use case)
CREATE POLICY "Enable insert for all users" ON designs FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON designs FOR UPDATE USING (true);
CREATE POLICY "Enable select for all users" ON designs FOR SELECT USING (true);
CREATE POLICY "Enable delete for all users" ON designs FOR DELETE USING (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_designs_updated_at 
  BEFORE UPDATE ON designs 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

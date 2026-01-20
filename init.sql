-- Initialize database for Canvas Designer
-- This file will be executed when PostgreSQL container starts

-- Create database if it doesn't exist
-- Note: PostgreSQL automatically creates the database specified in POSTGRES_DB
-- but we include this for completeness

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE canvas_designer TO canvas_user;

-- Log initialization
\echo 'Canvas Designer database initialized successfully';

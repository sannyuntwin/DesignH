-- Seed data for the application
-- This script creates a test user with email: test@example.com and password: password123
-- Password is hashed using bcrypt

INSERT INTO users (email, name, password_hash)
VALUES (
    'test@example.com',
    'Test User',
    '$2b$10$TmLBmxdvDs8qKsbeKx4IFeVL0zq8sbjXv08LeaQiHhKMOqDf0.gri'
)
ON CONFLICT (email) DO NOTHING;

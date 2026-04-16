-- Enable PostGIS for geographic data support
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set timezone to UTC for consistency
ALTER DATABASE tsunami_db SET timezone = 'UTC';

-- Log initialization complete
SELECT version();

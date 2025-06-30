-- Create asteroids table with JSONB support for flexible data storage
-- Following the schema specified in the devguide

CREATE TABLE IF NOT EXISTS asteroids (
    id TEXT PRIMARY KEY, -- SPK-ID from JPL SBDB
    designation TEXT NOT NULL, -- Primary designation of the asteroid
    name TEXT, -- Common name of the asteroid (if any)
    orbit_class TEXT, -- Orbital classification (e.g., 'Main-belt Asteroid')
    orbital_elements JSONB, -- Stores osculating orbital elements (e, q, tp, om, w, i, a, ma, per, n, ad, epoch, etc.)
    physical_properties JSONB, -- Stores diameter, absolute magnitude (H), composition type, derived density, derived mass, etc.
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Timestamp of last data update from external APIs
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_asteroids_designation ON asteroids(designation);
CREATE INDEX IF NOT EXISTS idx_asteroids_name ON asteroids(name);
CREATE INDEX IF NOT EXISTS idx_asteroids_orbit_class ON asteroids(orbit_class);
CREATE INDEX IF NOT EXISTS idx_asteroids_last_updated ON asteroids(last_updated);

-- Create GIN indexes for JSONB columns to enable efficient querying of nested data
CREATE INDEX IF NOT EXISTS idx_asteroids_orbital_elements_gin ON asteroids USING GIN (orbital_elements);
CREATE INDEX IF NOT EXISTS idx_asteroids_physical_properties_gin ON asteroids USING GIN (physical_properties);

-- Create specific indexes for commonly queried JSONB fields
CREATE INDEX IF NOT EXISTS idx_asteroids_composition_type ON asteroids USING GIN ((physical_properties->>'composition_type'));
CREATE INDEX IF NOT EXISTS idx_asteroids_diameter ON asteroids USING GIN ((physical_properties->>'diameter'));
CREATE INDEX IF NOT EXISTS idx_asteroids_mass ON asteroids USING GIN ((physical_properties->>'mass'));

-- Add comments for documentation
COMMENT ON TABLE asteroids IS 'Stores asteroid data including orbital elements and physical properties';
COMMENT ON COLUMN asteroids.id IS 'Primary key - SPK-ID from JPL SBDB';
COMMENT ON COLUMN asteroids.orbital_elements IS 'JSONB field containing Keplerian orbital elements from JPL SBDB';
COMMENT ON COLUMN asteroids.physical_properties IS 'JSONB field containing physical properties including composition, mass, and diameter'; 
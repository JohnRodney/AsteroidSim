const axios = require('axios');
const { query } = require('../database/connection');

// JPL SBDB API configuration
const JPL_SBDB_BASE_URL = 'https://ssd-api.jpl.nasa.gov/sbdb.api';
const ASTERANK_BASE_URL = 'https://asterank.com/api';

// Asteroid composition densities from the devguide
const COMPOSITION_DENSITIES = {
  'C-type': 1.38, // g/cm³
  'S-type': 2.71, // g/cm³
  'M-type': 5.32, // g/cm³
};

const fetchAsteroidData = async () => {
  try {
    console.log('🔄 Starting asteroid data fetch from external APIs...');

    // Fetch data from JPL SBDB API
    const jplData = await fetchJPLData();
    console.log(`📊 Fetched ${jplData.length} asteroids from JPL SBDB`);

    // Fetch data from Asterank
    const asterankData = await fetchAsterankData();
    console.log(`📊 Fetched ${asterankData.length} asteroids from Asterank`);

    // Merge and process data
    const mergedData = mergeAsteroidData(jplData, asterankData);
    console.log(`🔄 Merged data for ${mergedData.length} asteroids`);

    // Store in database
    const storedCount = await storeAsteroidData(mergedData);
    console.log(`💾 Stored ${storedCount} asteroids in database`);

    return {
      jpl_count: jplData.length,
      asterank_count: asterankData.length,
      merged_count: mergedData.length,
      stored_count: storedCount,
    };
  } catch (error) {
    console.error('❌ Error fetching asteroid data:', error);
    throw error;
  }
};

const fetchJPLData = async () => {
  try {
    // Fetch main belt asteroids from JPL SBDB
    const response = await axios.get(JPL_SBDB_BASE_URL, {
      params: {
        class: 'MBA', // Main Belt Asteroids
        limit: 100, // Start with a reasonable limit
        full_precision: true,
        phys_par: true,
        orbit: true,
      },
      timeout: 30000,
    });

    if (response.data && response.data.result) {
      return response.data.result.map((asteroid) => ({
        id: asteroid.spkid,
        designation: asteroid.designation,
        name: asteroid.name || null,
        orbit_class: asteroid.orbit_class || 'Main-belt Asteroid',
        orbital_elements: {
          e: asteroid.orbit?.e,
          q: asteroid.orbit?.q,
          tp: asteroid.orbit?.tp,
          om: asteroid.orbit?.om,
          w: asteroid.orbit?.w,
          i: asteroid.orbit?.i,
          a: asteroid.orbit?.a,
          ma: asteroid.orbit?.ma,
          per: asteroid.orbit?.per,
          n: asteroid.orbit?.n,
          ad: asteroid.orbit?.ad,
          epoch: asteroid.orbit?.epoch,
        },
        physical_properties: {
          h: asteroid.phys_par?.h, // Absolute magnitude
          diameter: asteroid.phys_par?.diameter,
          albedo: asteroid.phys_par?.albedo,
          rot_per: asteroid.phys_par?.rot_per,
        },
      }));
    }

    return [];
  } catch (error) {
    console.error('Error fetching JPL data:', error.message);
    // Return empty array to continue with other data sources
    return [];
  }
};

const fetchAsterankData = async () => {
  try {
    // Fetch data from Asterank API
    const response = await axios.get(`${ASTERANK_BASE_URL}/asteroids`, {
      params: {
        limit: 100, // Start with a reasonable limit
      },
      timeout: 30000,
    });

    if (Array.isArray(response.data)) {
      return response.data.map((asteroid) => ({
        id: asteroid.id?.toString(),
        designation: asteroid.full_name,
        name: asteroid.proper_name || null,
        orbit_class: 'Main-belt Asteroid',
        orbital_elements: {
          e: asteroid.e,
          q: asteroid.q,
          tp: asteroid.tp,
          om: asteroid.om,
          w: asteroid.w,
          i: asteroid.i,
          a: asteroid.a,
          ma: asteroid.ma,
          per: asteroid.per,
          n: asteroid.n,
          ad: asteroid.ad,
          epoch: asteroid.epoch,
        },
        physical_properties: {
          diameter: asteroid.diameter,
          mass: asteroid.mass,
          composition_type: asteroid.spectral_class,
          density: asteroid.density,
          albedo: asteroid.albedo,
        },
      }));
    }

    return [];
  } catch (error) {
    console.error('Error fetching Asterank data:', error.message);
    // Return empty array to continue with other data sources
    return [];
  }
};

const mergeAsteroidData = (jplData, asterankData) => {
  const merged = new Map();

  // Process JPL data first
  jplData.forEach((asteroid) => {
    if (asteroid.id) {
      merged.set(asteroid.id, {
        ...asteroid,
        source: 'jpl',
      });
    }
  });

  // Merge with Asterank data
  asterankData.forEach((asteroid) => {
    if (asteroid.id) {
      const existing = merged.get(asteroid.id);
      if (existing) {
        // Merge data, preferring Asterank for physical properties
        merged.set(asteroid.id, {
          ...existing,
          physical_properties: {
            ...existing.physical_properties,
            ...asteroid.physical_properties,
          },
          source: 'merged',
        });
      } else {
        merged.set(asteroid.id, {
          ...asteroid,
          source: 'asterank',
        });
      }
    }
  });

  // Calculate derived properties
  const processedData = Array.from(merged.values()).map((asteroid) => {
    return calculateDerivedProperties(asteroid);
  });

  return processedData;
};

const calculateDerivedProperties = (asteroid) => {
  const physical = asteroid.physical_properties || {};
  const composition = physical.composition_type;

  // Calculate mass if not available
  if (!physical.mass && physical.diameter && composition) {
    const density = COMPOSITION_DENSITIES[composition] || 2.0; // Default density
    const radius = physical.diameter / 2; // Convert diameter to radius
    const volume = (4 / 3) * Math.PI * Math.pow(radius, 3);
    physical.mass = volume * density * 1e12; // Convert to kg (assuming diameter in km)
  }

  // Calculate density if not available
  if (!physical.density && composition) {
    physical.density = COMPOSITION_DENSITIES[composition] || 2.0;
  }

  return {
    ...asteroid,
    physical_properties: physical,
  };
};

const storeAsteroidData = async (asteroids) => {
  try {
    let storedCount = 0;

    for (const asteroid of asteroids) {
      if (!asteroid.id) continue;

      const sql = `
        INSERT INTO asteroids (id, designation, name, orbit_class, orbital_elements, physical_properties)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) 
        DO UPDATE SET
          designation = EXCLUDED.designation,
          name = EXCLUDED.name,
          orbit_class = EXCLUDED.orbit_class,
          orbital_elements = EXCLUDED.orbital_elements,
          physical_properties = EXCLUDED.physical_properties,
          last_updated = CURRENT_TIMESTAMP
      `;

      const params = [
        asteroid.id,
        asteroid.designation,
        asteroid.name,
        asteroid.orbit_class,
        JSON.stringify(asteroid.orbital_elements || {}),
        JSON.stringify(asteroid.physical_properties || {}),
      ];

      await query(sql, params);
      storedCount++;
    }

    return storedCount;
  } catch (error) {
    console.error('Error storing asteroid data:', error);
    throw error;
  }
};

const getAsteroidById = async (id) => {
  try {
    const sql = `
      SELECT id, designation, name, orbit_class, orbital_elements, physical_properties, last_updated
      FROM asteroids 
      WHERE id = $1
    `;

    const result = await query(sql, [id]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching asteroid by ID:', error);
    throw error;
  }
};

const getAsteroidStats = async () => {
  try {
    const sql = `
      SELECT 
        COUNT(*) as total_asteroids,
        COUNT(CASE WHEN physical_properties->>'composition_type' = 'C-type' THEN 1 END) as c_type_count,
        COUNT(CASE WHEN physical_properties->>'composition_type' = 'S-type' THEN 1 END) as s_type_count,
        COUNT(CASE WHEN physical_properties->>'composition_type' = 'M-type' THEN 1 END) as m_type_count,
        SUM(CAST(physical_properties->>'mass' AS FLOAT)) as total_mass,
        AVG(CAST(physical_properties->>'diameter' AS FLOAT)) as avg_diameter
      FROM asteroids 
      WHERE orbit_class = 'Main-belt Asteroid'
    `;

    const result = await query(sql);
    return result.rows[0];
  } catch (error) {
    console.error('Error fetching asteroid stats:', error);
    throw error;
  }
};

module.exports = {
  fetchAsteroidData,
  getAsteroidById,
  getAsteroidStats,
  COMPOSITION_DENSITIES,
};

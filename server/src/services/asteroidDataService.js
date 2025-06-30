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
    console.log('🔄 Fetching data for well-known asteroids from JPL SBDB...');

    // List of well-known main belt asteroids to query
    const asteroidDesignations = [
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '10',
      '15',
      '16',
      '20',
      '21',
      '22',
      '23',
      '24',
      '25',
      '26',
      '27',
      '28',
      '29',
      '30',
      '31',
      '32',
      '33',
      '34',
      '35',
      '36',
      '37',
    ];

    const results = [];

    for (const des of asteroidDesignations) {
      try {
        const response = await axios.get(JPL_SBDB_BASE_URL, {
          params: {
            des,
            'phys-par': 1,
          },
          timeout: 10000,
          httpsAgent: new (require('https').Agent)({
            rejectUnauthorized: false,
          }),
        });

        if (
          response.data &&
          response.data.object &&
          response.data.orbit &&
          response.data.phys_par
        ) {
          const asteroid = {
            id: response.data.object.spkid,
            designation: response.data.object.des,
            name: response.data.object.shortname || null,
            orbit_class:
              response.data.object.orbit_class?.name || 'Main-belt Asteroid',
            orbital_elements: {
              e: response.data.orbit.elements?.find((e) => e.name === 'e')
                ?.value,
              q: response.data.orbit.elements?.find((e) => e.name === 'q')
                ?.value,
              tp: response.data.orbit.elements?.find((e) => e.name === 'tp')
                ?.value,
              om: response.data.orbit.elements?.find((e) => e.name === 'om')
                ?.value,
              w: response.data.orbit.elements?.find((e) => e.name === 'w')
                ?.value,
              i: response.data.orbit.elements?.find((e) => e.name === 'i')
                ?.value,
              a: response.data.orbit.elements?.find((e) => e.name === 'a')
                ?.value,
              ma: response.data.orbit.elements?.find((e) => e.name === 'ma')
                ?.value,
              per: response.data.orbit.elements?.find((e) => e.name === 'per')
                ?.value,
              n: response.data.orbit.elements?.find((e) => e.name === 'n')
                ?.value,
              ad: response.data.orbit.elements?.find((e) => e.name === 'ad')
                ?.value,
              epoch: response.data.orbit.epoch,
            },
            physical_properties: {
              h: response.data.phys_par?.find((p) => p.name === 'H')?.value,
              diameter: response.data.phys_par?.find(
                (p) => p.name === 'diameter'
              )?.value,
              albedo: response.data.phys_par?.find((p) => p.name === 'albedo')
                ?.value,
              rot_per: response.data.phys_par?.find((p) => p.name === 'rot_per')
                ?.value,
              density: response.data.phys_par?.find((p) => p.name === 'density')
                ?.value,
            },
          };

          results.push(asteroid);
          console.log(
            `✅ Fetched data for ${asteroid.name || asteroid.designation}`
          );
        }

        // Small delay to be respectful to the API
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error fetching asteroid ${des}:`, error.message);
        // Continue with next asteroid
      }
    }

    console.log(
      `📊 Successfully fetched ${results.length} asteroids from JPL SBDB`
    );
    return results;
  } catch (error) {
    console.error('Error in JPL data fetch:', error.message);
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

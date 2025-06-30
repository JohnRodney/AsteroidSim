const express = require("express");
const { query } = require("../database/connection");
const { fetchAsteroidData } = require("../services/asteroidDataService");

const router = express.Router();

// GET /api/asteroids - Get all asteroids with optional filtering
router.get("/", async (req, res) => {
  try {
    const {
      limit = 100,
      offset = 0,
      composition_type,
      min_diameter,
      max_diameter,
      orbit_class = "Main-belt Asteroid",
    } = req.query;

    let sql = `
      SELECT id, designation, name, orbit_class, orbital_elements, physical_properties, last_updated
      FROM asteroids 
      WHERE orbit_class = $1
    `;

    const params = [orbit_class];
    let paramIndex = 2;

    // Add composition filter
    if (composition_type) {
      sql += ` AND physical_properties->>'composition_type' = $${paramIndex}`;
      params.push(composition_type);
      paramIndex++;
    }

    // Add diameter filters
    if (min_diameter) {
      sql += ` AND CAST(physical_properties->>'diameter' AS FLOAT) >= $${paramIndex}`;
      params.push(parseFloat(min_diameter));
      paramIndex++;
    }

    if (max_diameter) {
      sql += ` AND CAST(physical_properties->>'diameter' AS FLOAT) <= $${paramIndex}`;
      params.push(parseFloat(max_diameter));
      paramIndex++;
    }

    sql += ` ORDER BY designation LIMIT $${paramIndex} OFFSET $${
      paramIndex + 1
    }`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await query(sql, params);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: result.rows.length,
      },
    });
  } catch (error) {
    console.error("Error fetching asteroids:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch asteroids",
      message: error.message,
    });
  }
});

// GET /api/asteroids/:id - Get specific asteroid by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const sql = `
      SELECT id, designation, name, orbit_class, orbital_elements, physical_properties, last_updated
      FROM asteroids 
      WHERE id = $1
    `;

    const result = await query(sql, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Asteroid not found",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error fetching asteroid:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch asteroid",
      message: error.message,
    });
  }
});

// GET /api/asteroids/stats/summary - Get asteroid belt statistics
router.get("/stats/summary", async (req, res) => {
  try {
    const sql = `
      SELECT 
        COUNT(*) as total_asteroids,
        COUNT(CASE WHEN physical_properties->>'composition_type' = 'C-type' THEN 1 END) as c_type_count,
        COUNT(CASE WHEN physical_properties->>'composition_type' = 'S-type' THEN 1 END) as s_type_count,
        COUNT(CASE WHEN physical_properties->>'composition_type' = 'M-type' THEN 1 END) as m_type_count,
        SUM(CAST(physical_properties->>'mass' AS FLOAT)) as total_mass,
        AVG(CAST(physical_properties->>'diameter' AS FLOAT)) as avg_diameter,
        MAX(CAST(physical_properties->>'diameter' AS FLOAT)) as max_diameter,
        MIN(CAST(physical_properties->>'diameter' AS FLOAT)) as min_diameter
      FROM asteroids 
      WHERE orbit_class = 'Main-belt Asteroid'
    `;

    const result = await query(sql);

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error fetching asteroid statistics:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch asteroid statistics",
      message: error.message,
    });
  }
});

// POST /api/asteroids/sync - Sync asteroid data from external APIs
router.post("/sync", async (req, res) => {
  try {
    console.log("🔄 Starting asteroid data sync...");

    const syncResult = await fetchAsteroidData();

    res.json({
      success: true,
      message: "Asteroid data sync completed",
      data: syncResult,
    });
  } catch (error) {
    console.error("Error syncing asteroid data:", error);
    res.status(500).json({
      success: false,
      error: "Failed to sync asteroid data",
      message: error.message,
    });
  }
});

module.exports = router;

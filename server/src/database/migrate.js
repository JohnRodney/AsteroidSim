const fs = require('fs').promises;
const path = require('path');
const { setupDatabase, query } = require('./connection');

async function runMigrations() {
  try {
    console.log('🔄 Starting database migrations...');

    // Ensure database is initialized
    await setupDatabase();

    // Get all migration files
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = await fs.readdir(migrationsDir);
    const sqlFiles = files.filter((file) => file.endsWith('.sql')).sort();

    console.log(`📁 Found ${sqlFiles.length} migration files`);

    for (const file of sqlFiles) {
      console.log(`🔄 Running migration: ${file}`);

      const filePath = path.join(migrationsDir, file);
      const sql = await fs.readFile(filePath, 'utf8');

      try {
        await query(sql);
        console.log(`✅ Migration ${file} completed successfully`);
      } catch (error) {
        console.error(`❌ Migration ${file} failed:`, error.message);
        throw error;
      }
    }

    console.log('🎉 All migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration process failed:', error);
    process.exit(1);
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };

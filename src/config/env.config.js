require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3002, // Puerto diferente al Entities Service (3001)
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  ENTITIES_SERVICE_URL: process.env.ENTITIES_SERVICE_URL || 'http://localhost:3001/api'
};

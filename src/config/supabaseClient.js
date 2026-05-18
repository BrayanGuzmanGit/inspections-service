const { createClient } = require('@supabase/supabase-js');
const env = require('./env.config');

if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
  console.warn('⚠️ Faltan variables de entorno de Supabase 2 (Inspecciones).');
}

const supabase = createClient(env.SUPABASE_URL || '', env.SUPABASE_ANON_KEY || '');

module.exports = supabase;

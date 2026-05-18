const supabase = require('../../config/supabaseClient');
const AppError = require('../../shared/AppError');


class InspectionRepository {
  // === 1. Solicitud de Inspeccion ===
  async createSolicitud(data) {
    const { data: result, error } = await supabase
      .from('solicitud_inspeccion')
      .insert([data])
      .select()
      .single();
    if (error) throw new AppError(error.message, 400);
    return result;
  }

  async getSolicitudes() {
    const { data, error } = await supabase
      .from('solicitud_inspeccion')
      .select('*')
    if (error) throw new AppError(error.message, 500);
    return data;
  }

  // === 2. Inspeccion Fitosanitaria ===
  async createFitosanitaria(data) {
    const { data: result, error } = await supabase
      .from('inspeccion_fitosanitaria')
      .insert([data])
      .select()
      .single();

    if (error) throw new AppError(error.message, 400);
    return result;
  }

  // === 3. Inspeccion Tecnica ===
  async createTecnica(data) {
    const { data: result, error } = await supabase
      .from('inspeccion_tecnica')
      .insert([data])
      .select()
      .single();

    if (error) throw new AppError(error.message, 400);
    return result;
  }

  // === 4. Inspeccion por Lote & Conteo de plagas ===
  async createInspeccionLote(data) {
    const { data: result, error } = await supabase
      .from('inspeccion_lote')
      .insert([data])
      .select()
      .single();

    if (error) throw new AppError(error.message, 400);
    return result;
  }

  async addConteoPlaga(data) {
    const { data: result, error } = await supabase
      .from('conteo_plagas')
      .insert([data])
      .select()
      .single();

    if (error) throw new AppError(error.message, 400);
    return result;
  }
}
module.exports = new InspectionRepository();

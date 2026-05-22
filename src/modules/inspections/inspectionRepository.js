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

  async deleteSolicitud(id) {
    const { data, error } = await supabase
      .from('solicitud_inspeccion')
      .delete()
      .eq('idsolicitud', id)
      .select()
      .single();
    if (error) throw new AppError(error.message, 400);
    return data;
  }

  async editSolicitud(id_solicitud) {
    const { data, error } = await supabase
      .from('solicitud_inspeccion')
      .update({ estado: 'Aceptada' })
      .eq('idsolicitud', id_solicitud)
      .select()
      .single();
    if (error) throw new AppError(error.message, 400);
    return data;
  }

  async getSolicitudById(idsolicitud) {
    const { data, error } = await supabase
      .from('solicitud_inspeccion')
      .select('*')
      .eq('idsolicitud', idsolicitud)
      .single();
    if (error) throw new AppError(error.message, 404);
    return data;
  }

  async getSolicitudes() {
    const { data, error } = await supabase
      .from('solicitud_inspeccion')
      .select('*')
    if (error) throw new AppError(error.message, 500);
    return data;
  }

}
module.exports = new InspectionRepository();

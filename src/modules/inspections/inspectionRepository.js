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

  async deleteSolicitud(id, estado) {
    const { data, error } = await supabase
      .from('solicitud_inspeccion')
      .update({'estado': estado})
      .eq('idsolicitud', id)
      .select()
      .single();
    if (error) throw new AppError(error.message, 400);
    return data;
  }

  async editSolicitudFito(id_solicitud,uidtecnico, fecha_inspeccion, estado) {
    const { data, error } = await supabase
      .from('solicitud_inspeccion')
      .update({ 'estado': estado })
      .eq('idsolicitud', id_solicitud)
      .select()
      .single();
    if (error) throw new AppError(error.message, 400);

    const{error:error2}= await supabase
    .from('inspeccion_fitosanitaria')
    .insert({
      'idsolicitud' : id_solicitud,
      'uidtecnico' : uidtecnico,
      'fechainicioinspeccion': fecha_inspeccion
    })
    .select()
    .single();
    if (error2) throw new AppError(error2.message, 400);

    return data;
  }


  async editSolicitudTecnica(id_solicitud,uidtecnico, fecha_inspeccion, estado) {
    const { data, error } = await supabase
      .from('solicitud_inspeccion')
      .update({ 'estado': estado })
      .eq('idsolicitud', id_solicitud)
      .select()
      .single();
    if (error) throw new AppError(error.message, 400);

    const{error:error2}= await supabase
    .from('inspeccion_tecnica')
    .insert({
      'idsolicitud' : id_solicitud,
      'uidtecnico' : uidtecnico,
      'fechainicioinspeccion': fecha_inspeccion
    })
    .select()
    .single();
    if (error2) throw new AppError(error2.message, 400);
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
      .eq('estado', 'Solicitada')
    if (error) throw new AppError(error.message, 500);
    return data;
  }

  //inspeccion tecnica 
  async getInspeccionesTecnicasAsignadasTecnico(uidtecnico){
    const {data, error} = await supabase
    .from('inspeccion_tecnica')
    .select('*, solicitud_inspeccion(*)')
    .eq('uidtecnico', uidtecnico);
    if (error) throw new AppError(error.message, 500);
    return data;
  }

  async getInspeccionesTecnicasAsignadasProductor(uidproductor){
      // 1. Obtenemos las solicitudes del productor
      const { data: solicitudes, error } = await supabase
        .from('solicitud_inspeccion')
        .select('idsolicitud')
        .eq('uidproductor', uidproductor)
        .eq('tipo_inspeccion', 'inspeccion tecnica') 
        .eq('estado', 'Aceptada'); 

      if (error) throw new AppError(error.message, 500);

      if (!solicitudes || solicitudes.length === 0) return [];

      // 2. Extraemos un arreglo solo con los IDs
      const idsSolicitudes = solicitudes.map(s => s.idsolicitud);

      // 3. Consultamos las inspecciones técnicas usando un filtro .in()
      const { data: inspecciones, error: error2 } = await supabase
        .from('inspeccion_tecnica')
        .select('*, solicitud_inspeccion(*)') // Hacemos un join para traer también los datos de la solicitud
        .in('idsolicitud', idsSolicitudes);

      if (error2) throw new AppError(error2.message, 404);

      return inspecciones;
    }

  async makeInspeccionTecnica(data){
    const {data:result, error} = await supabase
    .from('inspeccion_tecnica')
    .update(data)
    .eq('idinspeccion', data.idinspeccion)
    .select()
    .single();
    if (error) throw new AppError(error.message, 400);
    return result;
  }
    

  async getInspeccionTecnicaById(idinspeccion) {
    const { data, error } = await supabase
      .from('inspeccion_tecnica')
      .select('*')
      .eq('idinspeccion', idinspeccion)
      .single();
    if (error) throw new AppError(error.message, 404);
    return data;
  }
}
module.exports = new InspectionRepository();
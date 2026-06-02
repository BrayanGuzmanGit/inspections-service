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
  async getInspeccionesAsignadasTecnico(uidtecnico) {
    // Traemos inspecciones técnicas y fitosanitarias en paralelo.
    // Para la fitosanitaria, incluimos los lotes y sus conteos de plagas (relaciones anidadas).
    const [
      { data: tecnicas = [], error: errorTecnica },
      { data: fitos = [], error: errorFito }
    ] = await Promise.all([
      supabase
        .from('inspeccion_tecnica')
        .select('*, solicitud_inspeccion(*)')
        .eq('uidtecnico', uidtecnico)
        .or('estado.eq.Pendiente,estado.eq.En proceso'),
      supabase
        .from('inspeccion_fitosanitaria')
        .select('*, solicitud_inspeccion(*), inspeccion_lote(*, conteo_plagas(*))')
        .eq('uidtecnico', uidtecnico)
        .or('estado.eq.Pendiente,estado.eq.En proceso')
    ]);

    if (errorTecnica) throw new AppError(errorTecnica.message, 500);
    if (errorFito) throw new AppError(errorFito.message, 500);

    const tecnicasConTipo = (tecnicas || []).map(item => ({ ...item, tipo_inspeccion: 'inspeccion tecnica' }));
    const fitosConTipo = (fitos || []).map(item => ({ ...item, tipo_inspeccion: 'inspeccion fitosanitaria' }));

    console.log('Inspecciones asignadas (tecnica+fitosanitaria):', [...tecnicasConTipo, ...fitosConTipo]);
    return [...tecnicasConTipo, ...fitosConTipo];
  }

  async getInspeccionesAsignadasProductor(uidproductor){
      // 1. Obtenemos las solicitudes del productor para ambos tipos de inspección
      const { data: solicitudes, error } = await supabase
        .from('solicitud_inspeccion')
        .select('idsolicitud')
        .eq('uidproductor', uidproductor)
        .in('tipo_inspeccion', ['inspeccion tecnica', 'inspeccion fitosanitaria'])
        .eq('estado', 'Aprobado');

      if (error) throw new AppError(error.message, 500);

      if (!solicitudes || solicitudes.length === 0) return [];

      // 2. Extraemos un arreglo solo con los IDs
      const idsSolicitudes = solicitudes.map(s => s.idsolicitud);

      // 3. Consultamos ambas tablas de inspección usando el filtro .in()
      const [
        { data: tecnicas, error: errorTecnica },
        { data: fitos, error: errorFito }
      ] = await Promise.all([
        supabase
          .from('inspeccion_tecnica')
          .select('*, solicitud_inspeccion(*)')
          .in('idsolicitud', idsSolicitudes),
        supabase
          .from('inspeccion_fitosanitaria')
          .select('*, solicitud_inspeccion(*)')
          .in('idsolicitud', idsSolicitudes)
      ]);

      if (errorTecnica) throw new AppError(errorTecnica.message, 404);
      if (errorFito) throw new AppError(errorFito.message, 404);

      const tecnicasConTipo = (tecnicas || []).map(item => ({
        ...item,
        tipo_inspeccion: 'inspeccion tecnica'
      }));

      const fitosConTipo = (fitos || []).map(item => ({
        ...item,
        tipo_inspeccion: 'inspeccion fitosanitaria'
      }));
      console.log([...tecnicasConTipo, ...fitosConTipo]);
      return [...tecnicasConTipo, ...fitosConTipo];
    }

  async makeInspeccionTecnica(data){
    const {data:result, error} = await supabase
    .from('inspeccion_tecnica')
    .update({...data})
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
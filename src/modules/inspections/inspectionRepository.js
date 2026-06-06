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

  async getInspeccionLote(uidinspeccion, uidlote) {
    const { data, error } = await supabase
      .from('inspeccion_lote')
      .select('*')
      .eq('uidinspeccion', uidinspeccion)
      .eq('uidlote', uidlote)
      .maybeSingle();
    if (error) throw new AppError(error.message, 404);
    return data;
  }

  async insertInspeccionLote(id_inspeccion, id_lote, plantasencontradas, estadoFenologico, porcentaje_infestacion) {
    const { data: inspeccionLoteData, error } = await supabase
      .from('inspeccion_lote')
      .insert({
        uidinspeccion: id_inspeccion,
        uidlote: id_lote,
        plantasencontradas: plantasencontradas,
        estado: 'terminada',
        estadoFenologico: estadoFenologico || null,
        porcentaje_infestacion: porcentaje_infestacion,
      })
      .select()
      .single();
      
    if (error) { 
      throw new AppError(error.message, 400);
    }
    return inspeccionLoteData;
  }

  async actuConteoPlagas(idinspeccionlote, idplaga, plantasinfestadas) {
    const { data: result, error } = await supabase
      .from('conteo_plagas')
      .update({ plantasinfestadas })
      .eq('idinspeccionlote', idinspeccionlote)
      .eq('idplaga', idplaga)
      .select()
      .maybeSingle();
    if (error) throw new AppError(error.message, 400);
    return result;
  }

  async searchConteoPlagas(idinspeccionlote, idplaga) {
    console.log(`Buscando conteo para inspeccion_lote ${idinspeccionlote} y plaga ${idplaga}`);
    const { data, error } = await supabase
      .from('conteo_plagas')
      .select('*')
      .eq('idinspeccionlote', idinspeccionlote)
      .eq('idplaga', idplaga)
      .maybeSingle();

    if (error) throw new AppError(error.message, 404);
    return data; 
  }

  async insertConteoPlagas(idinspeccionlote, idplaga, plantasinfestadas) {
    const { data: result, error } = await supabase
      .from('conteo_plagas')
      .insert([{
        idinspeccionlote,
        idplaga,
        plantasinfestadas
      }])
      .select()
      .single();
    if (error) throw new AppError(error.message, 400);
    return result;
  }

  async makeInspeccionFitosanitaria(id_inspeccion, id_lote, data){
    //Esta logica la debo pasar a el service
    let inspeccionLoteData = await this.getInspeccionLote(id_inspeccion, id_lote);
    if(!inspeccionLoteData) {
      // Si no existe el registro de inspeccion_lote, lo creamos con estado "terminada"
      inspeccionLoteData = await this.insertInspeccionLote(id_inspeccion, id_lote, data.plantasEncontradas, data.estadoFenologico, data.porcentajeInfestacion);
    } else if (inspeccionLoteData.estado === 'terminada') {
      throw new AppError('Esta inspección fitosanitaria ya ha sido realizada para este lote.', 400);
    }

    const{data:inspeccionFito, error:error2} = await supabase
    .from('inspeccion_fitosanitaria')
    .update({estado: 'En proceso'})
    .eq('idinspeccion', id_inspeccion)
    .select()
    .single();
    if (error2) {
      throw new AppError(error2.message, 400);
    }
    // 2. Iterar e insertar los conteos
    const conteos = data.conteo_plagas || [];
    const resultadosConteo = []; // Para almacenar los resultados y retornarlos
    
    try {
      for (const conteo of conteos) {
        // Validar si el conteo ya existe
        const conteoExistente = await this.searchConteoPlagas(inspeccionLoteData.id, conteo.idplaga);
        console.log(`Conteo existente: `, conteoExistente);
        if(conteoExistente) {
          // Si existe, actualizamos el conteo
          const conteoActualizado = await this.actuConteoPlagas(inspeccionLoteData.id, conteo.idplaga, conteo.plantasinfestadas);
          resultadosConteo.push(conteoActualizado);
        } else {
          // Si no existe, lo insertamos
          const conteoInsertado = await this.insertConteoPlagas(inspeccionLoteData.id, conteo.idplaga, conteo.plantasinfestadas);
          resultadosConteo.push(conteoInsertado);
        }
      }
    } catch (err) {
      //Hacer un roolback si un insert de conteo_plagas falla
      throw new AppError('Error al registrar conteo de plagas. Inspección cancelada.', 400);
    }

    // 3. Retornar los datos insertados correctamente
    return {
      inspeccion: inspeccionLoteData,
      conteos: resultadosConteo
    };
  }
  
  async terminarInspeccionFitosanitaria(id_inspeccion, estado){
    const {data, error} = await supabase
    .from('inspeccion_fitosanitaria')
    .update({estado: estado})
    .eq('idinspeccion', id_inspeccion)
    .select()
    .single();
    if (error) throw new AppError(error.message, 400);
    return data;
  }

}
module.exports = new InspectionRepository();
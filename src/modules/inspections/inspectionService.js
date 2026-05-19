const inspectionRepository = require('./inspectionRepository');
const AppError = require('../../shared/AppError');
const env = require('../../config/env.config');

class InspectionService {
  async reqInspection(data, producerId, token) {
    const solicitud = {
      ...data,
      uidproductor: producerId,
      estado: 'Solicitada',
    };
    const id_lugar = data?.idlugarproduccion; // ? evita que rompa si data es null
    if (!id_lugar) {
      throw new AppError('El idlugarproduccion no está presente en los datos enviados.', 400);
    }

    //peticion para saber si el lugar tiene predio central
    try {
      // Aseguramos que el token empiece con Bearer si no lo trae implícito
      const response = await fetch(`${env.ENTITIES_SERVICE_URL}/locations/lugares/verificarCentral/${id_lugar}`, {
        method: 'GET',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        },
      });
      if (!response.ok) {
        throw new AppError(`El servidor respondió con código ${response.status}` + response.message);
      }
      // 2. Si es correcta, procesamos el JSON de forma segura
      const result = await response.json();
      if (result.data == true) {
        if (data.tipo_inspeccion === 'inspeccion tecnica' ){
          //Si es inspeccion tecnica no se necesita lotes
          return await inspectionRepository.createSolicitud(solicitud);
        }else if (data.tipo_inspeccion === 'inspeccion fitosanitaria'){
          //Si es inspeccion fitosanitaria se necesita lotes y hacemos la peticion a la API de lugares para verificar si hay lotes
          try{
            const response = await fetch(`${env.ENTITIES_SERVICE_URL}/locations/lotes/${id_lugar}`, {
            method: 'GET',
            headers: {
              'Authorization': token,
              'Content-Type': 'application/json'
            },
          });
          if(!response.ok){
            throw new AppError(`El servidor respondió con código ${response.status}` + response.message);
          }

          const result2 = await response.json();
          if (result2.data.length === 0){
            throw new AppError('El lugar no tiene lotes, no se le puede hacer una solicitud de inspeccion fitosanitaria', 400);
          }else{
            //crear solicitud de inspeccion fitosanitaria si el lugar tiene lotes 
            return await inspectionRepository.createSolicitud(solicitud);
          }

          }catch (e){
            throw new AppError(e.message, 500);
          }   
        }
        
      } else if (result.data == false) {
        throw new AppError('El lugar no tiene predio central, no se le puede hacer una solicitud de inspeccion', 400);
      }
    } catch (e) {
      // Ahora e.message tendrá un mensaje mucho más claro si el servidor falló
      throw new AppError('Error al obtener el lugar: ' + e.message, 500);
    }
  }

  async deleteSolicitud(id_solicitud) {
    return await inspectionRepository.deleteSolicitud(id_solicitud);
  }


  async getAllSolicitudes() {
    return await inspectionRepository.getSolicitudes();
  }

  
}
module.exports = new InspectionService();

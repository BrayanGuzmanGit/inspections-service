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
        if (data.tipo_inspeccion === 'inspeccion tecnica') {
          //Si es inspeccion tecnica no se necesita lotes
          return await inspectionRepository.createSolicitud(solicitud);
        } else if (data.tipo_inspeccion === 'inspeccion fitosanitaria') {
          //Si es inspeccion fitosanitaria se necesita lotes y hacemos la peticion a la API de lugares para verificar si hay lotes
          try {
            const response = await fetch(`${env.ENTITIES_SERVICE_URL}/locations/lotes/${id_lugar}`, {
              method: 'GET',
              headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
              },
            });
            if (!response.ok) {
              throw new AppError(`El servidor respondió con código ${response.status}` + response.message);
            }

            const result2 = await response.json();
            if (result2.data.length === 0) {
              throw new AppError('El lugar no tiene lotes, no se le puede hacer una solicitud de inspeccion fitosanitaria', 400);
            } else {
              //crear solicitud de inspeccion fitosanitaria si el lugar tiene lotes 
              return await inspectionRepository.createSolicitud(solicitud);
            }

          } catch (e) {
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

  async deleteSolicitud(id_solicitud,estado) {
    return await inspectionRepository.deleteSolicitud(id_solicitud,estado);
  }

  async editSolicitud(id_solicitud, id_tecnico) {
    //1. Traer info de la solicitud
    const solicitud = await inspectionRepository.getSolicitudById(id_solicitud);
    if (solicitud.estado !== 'Solicitada') {
      throw new AppError('La solicitud no se puede editar porque no está en estado solicitada', 400);
    }
    //quizas añadir validacion de que el tecnico existe
    if (solicitud.tipo_inspeccion === 'inspeccion fitosanitaria') {
      return await inspectionRepository.editSolicitudFito(id_solicitud, id_tecnico);
    } else if (solicitud.tipo_inspeccion === 'inspeccion tecnica') {
      return await inspectionRepository.editSolicitudTecnica(id_solicitud, id_tecnico);
    }
  }


  async getDireccionLugar(idlugarproduccion, token) {
    try {
      const response = await fetch(`${env.ENTITIES_SERVICE_URL}/locations/lugares/${idlugarproduccion}`, {
        method: 'GET',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        },
      });
      if (!response.ok) {
        throw new AppError(`El servidor respondió con código ${response.status}` + response.message);
      }
      const result = await response.json();
      return result.data;
    } catch (e) {
      throw new AppError('Error al obtener el lugar: ' + e.message, 500);
    }
  }


  async getAllSolicitudes(token) {
    const inspecciones = await inspectionRepository.getSolicitudes();
    
    if (inspecciones.length===0){
      throw new AppError('No se encontraron solicitudes de inspeccion', 404);
    }

    const ids_lugares = [...new Set(inspecciones.map(inspeccion => inspeccion.idlugarproduccion))];

    let lugares = [];
    try {
      const response = await fetch(`${env.ENTITIES_SERVICE_URL}/locations/lugares/inspecciones`, {
        method: 'POST',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({"ids_lugares":ids_lugares})
      });

      if (!response.ok) {
        throw new AppError(`El servidor respondió con código ${response.status}` + response.message);
      }

      const result = await response.json();
      lugares = result.data || [];
    } catch (e) {
      throw new AppError('Error al obtener el lugar: ' + e.message, 500);
    }

    const inspeccionesConLugar = inspecciones.map(inspeccion => {
      // Find the corresponding lugar
      const lugarEncontrado = lugares.find(l => l.id === inspeccion.idlugarproduccion) || null;
      
      // Remove idlugarproduccion and add lugar
      const { idlugarproduccion, ...restoInspeccion } = inspeccion;
      
      return {
        ...restoInspeccion,
        lugar: lugarEncontrado
      };
    });

    return inspeccionesConLugar;
  }


  //inspecciones tecnicas
  async getInspeccionesTecnicasAsignadas(authHeader){
    let user = {};
    try {
      if (!authHeader) throw new AppError('No token provisto', 401);

      const response = await fetch(`${env.ENTITIES_SERVICE_URL}/users/me`, {
        method: 'GET',
        headers: { 'Authorization': authHeader,
          'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new AppError(`El servidor respondió con código ${response.status}` + response.statusText);
      }

      const resultData = await response.json();
      user = resultData.data;
      let result = null;

      if (user.rol==='Tecnico'){
        result = await inspectionRepository.getInspeccionesTecnicasAsignadasTecnico(user.id);
      }else if (user.rol==='Productor'){
        result = await inspectionRepository.getInspeccionesTecnicasAsignadasProductor(user.id);
      }
      return result;
    }catch(e){
      throw new AppError(e.message, 500);
    }
    
  }

  async makeInspeccionTecnica(id_tecnico, data) {
    const inspeccion = await inspectionRepository.getInspeccionTecnicaById(data.idinspeccion);
    if (inspeccion.uidtecnico !== id_tecnico) {
      throw new AppError('No eres el tecnico asignado para realizar esta inspeccion', 403);
    }

    if(solicitud.tipo_inspeccion !== 'inspeccion tecnica') {
      throw new AppError('La solicitud no es una inspeccion tecnica', 400);
    }
    return await inspectionRepository.makeInspeccionTecnica(id_tecnico, data);
  }
}
module.exports = new InspectionService();

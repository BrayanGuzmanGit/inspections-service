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

  async editSolicitud(id_solicitud, id_tecnico, fecha_inspeccion, estado) {
    //1. Traer info de la solicitud
    const solicitud = await inspectionRepository.getSolicitudById(id_solicitud);
    if (solicitud.estado !== 'Solicitada') {
      throw new AppError('La solicitud no se puede editar porque no está en estado solicitada', 400);
    }
    //quizas añadir validacion de que el tecnico existe
    if (solicitud.tipo_inspeccion === 'inspeccion fitosanitaria') {
      return await inspectionRepository.editSolicitudFito(id_solicitud, id_tecnico, fecha_inspeccion, estado);
    } else if (solicitud.tipo_inspeccion === 'inspeccion tecnica') {
      return await inspectionRepository.editSolicitudTecnica(id_solicitud, id_tecnico, fecha_inspeccion, estado);
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

    if(ids_lugares.length===0){
      throw new AppError('No se encontraron lugares para las solicitudes de inspeccion', 404);
    }

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
    if (lugares.length === 0){
      throw new AppError('No se encontraron lugares', 404);
    }
    const inspeccionesConLugar = inspecciones.map(inspeccion => {
      
      const lugarEncontrado = lugares.find(l => l.id === inspeccion.idlugarproduccion) || null;
      
      const { idlugarproduccion, ...restoInspeccion } = inspeccion;
      
      return {
        ...restoInspeccion,
        lugar: lugarEncontrado
      };
    });

    return inspeccionesConLugar;
  }

  async getLugarById(id_lugar, token) {

    try{
    const responseLugar = await fetch(`${env.ENTITIES_SERVICE_URL}/locations/lugar/${id_lugar}`, {
        method: 'GET',
        headers: { 'Authorization': token,
          'Content-Type': 'application/json' }
      });


      if (!responseLugar.ok) {
        throw new AppError(`El servidor respondió con código ${responseLugar.status}` + responseLugar.statusText, responseLugar.status);
      }

      const resultLugar = await responseLugar.json();
      return resultLugar.data;
    }catch(e){
      throw new AppError('Error al obtener el lugar: ' + e.message, 500);
    }

  }


  async getUserById(token, userId) {
    try {
      const response = await fetch(`${env.ENTITIES_SERVICE_URL}/users/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const body = await response.text();
        console.error(`getUserById fallo para userId=${userId}: ${response.status} ${body}`);
        throw new AppError(`El servidor respondió con código ${response.status}: ${body}`, 500);
      }

      const resultData = await response.json();
      return resultData.data;
    } catch (e) {
      console.error(`getUserById catch para userId=${userId}:`, e);
      throw new AppError('Error al obtener el usuario: ' + e.message, 500);
    }
  }

  async getInspeccionesTecnicasAsignadas(authHeader) {
    try {
      const user = await this.getUserById(authHeader, 'me');
      let inspecciones;

      if (user.rol === 'Tecnico') {
        inspecciones = await inspectionRepository.getInspeccionesAsignadasTecnico(user.id);
      } else if (user.rol === 'Productor') {
        inspecciones = await inspectionRepository.getInspeccionesAsignadasProductor(user.id);
      } else {
        throw new AppError('Rol no válido para esta operación', 403);
      }

      if (!Array.isArray(inspecciones)) {
        throw new AppError('Los datos de inspecciones no tienen el formato esperado', 500);
      }

      if (inspecciones.length === 0) {
        return [];
      }

      const inspeccionesEnriquecidas = await Promise.all(inspecciones.map(async (inspeccion) => {
        const solicitud = inspeccion.solicitud_inspeccion || {};
        const lugarId = solicitud.idlugarproduccion;
        const productorId = solicitud.uidproductor;
        const tecnicoId = inspeccion.uidtecnico;

        let lugarNombre = null;
        if (lugarId) {
          const lugar = await this.getLugarById(lugarId, authHeader);
          lugarNombre = lugar?.nombre || null;
        }

        let productorNombre = null;
        if (productorId) {
          const productor = await this.getUserById(authHeader, productorId);
          productorNombre = productor?.nombre || `${productor?.nombre || ''} ${productor?.apellido || ''}`.trim() || null;
        }

        let tecnicoNombre = null;
        if (tecnicoId) {
          const tecnico = await this.getUserById(authHeader, tecnicoId);
          tecnicoNombre = tecnico?.nombre || `${tecnico?.nombre || ''} ${tecnico?.apellido || ''}`.trim() || null;
        }

        return {
          ...inspeccion,
          lugarNombre,
          productorNombre,
          tecnicoNombre,
          solicitud_inspeccion: {
            ...solicitud,
            productorNombre,
            lugarNombre,
          }
        };
      }));
      return inspeccionesEnriquecidas;
    } catch (e) {
      console.error('Error en getInspeccionesTecnicasAsignadas:', e);
      throw new AppError(e.message, 500);
    }
  }

  async makeInspeccionTecnica(id_tecnico, data) {
    const inspeccion = await inspectionRepository.getInspeccionTecnicaById(data.idinspeccion);
    if (inspeccion.uidtecnico !== id_tecnico) {
      throw new AppError('No eres el tecnico asignado para realizar esta inspeccion', 403);
    }
    return await inspectionRepository.makeInspeccionTecnica(data);
  }
}
module.exports = new InspectionService();
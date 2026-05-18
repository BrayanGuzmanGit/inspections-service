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
        return await inspectionRepository.createSolicitud(solicitud);
      } else if (result.data == false) {
        throw new AppError('El lugar no tiene predio central, no se le puede hacer una solicitud de inspeccion', 400);
      }
    } catch (e) {
      // Ahora e.message tendrá un mensaje mucho más claro si el servidor falló
      throw new AppError('Error al obtener el lugar: ' + e.message, 500);
    }
  }


  async getAllSolicitudes() {
    return await inspectionRepository.getSolicitudes();
  }

  async fillFitosanitaria(data, technicalId) {
    const form = {
      ...data,
      uidTecnico: technicalId
    };
    return await inspectionRepository.createFitosanitaria(form);
  }

  async fillTecnica(data, technicalId) {
    const form = { ...data };
    return await inspectionRepository.createTecnica(form);
  }

  async addLoteAndPests(loteData, pestsDataArray) {
    // Guarda lote y su estado actual
    const lote = await inspectionRepository.createInspeccionLote(loteData);
    const conteos = [];

    // Guarda el mapeo multivaluado si existe
    if (pestsDataArray && pestsDataArray.length > 0) {
      for (const pst of pestsDataArray) {
        const pestBody = { ...pst, idInspeccionLote: lote.id };
        const res = await inspectionRepository.addConteoPlaga(pestBody);
        conteos.push(res);
      }
    }
    return { lote, conteos };
  }
}
module.exports = new InspectionService();

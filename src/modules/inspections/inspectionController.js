const inspectionService = require('./inspectionService');
const ApiResponse = require('../../shared/ApiResponse');

class InspectionController {
  async solicitInspection(req, res, next) {
    try {
      // req.user viene del crossServiceAuth middleware (Validado en ms-1)}
      const token = req.headers.authorization;
      const result = await inspectionService.reqInspection(req.body, req.user.id, token);
      return ApiResponse.success(res, result, 'Solicitud de Inspección creada', 201);
    } catch (err) {
      next(err); 
    }
  }


  async deleteSolicitud(req, res, next) {
    try {
      const { idsolicitud } = req.params;
      const result = await inspectionService.deleteSolicitud(idsolicitud);
      return ApiResponse.success(res, result, 'Solicitud eliminada', 201);
    } catch (err) {
      next(err); 
    }
  }


  async editSolicitud(req, res, next) {
    try {
      const { idsolicitud } = req.params;
      const {idtecnico} = req.body;
      const token = req.headers.authorization;
      const result = await inspectionService.editSolicitud(idsolicitud, idtecnico, token);
      return ApiResponse.success(res, result, 'Solicitud aceptada', 201);
    } catch (err) {
      next(err); 
    }
  }


  async fetchSolicitudes(req, res, next) {
    try {
      const result = await inspectionService.getAllSolicitudes();
      return ApiResponse.success(res, result, 'Solicitudes recuperadas');
    } catch(err) { 
      next(err); 
    }
  }

}
module.exports = new InspectionController();

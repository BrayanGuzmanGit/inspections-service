const inspectionService = require('./inspectionService');
const ApiResponse = require('../../shared/ApiResponse');
const AppError = require('../../shared/AppError');

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
      const {estado} = req.body;
      const result = await inspectionService.deleteSolicitud(idsolicitud, estado);
      return ApiResponse.success(res, result, 'Solicitud eliminada', 201);
    } catch (err) {
      next(err); 
    }
  }


  async editSolicitud(req, res, next) {
    try {
      const { idsolicitud } = req.params;
      const {idtecnico} = req.body;
      const result = await inspectionService.editSolicitud(idsolicitud, idtecnico);
      return ApiResponse.success(res, result, 'Solicitud aceptada', 201);
    } catch (err) {
      next(err); 
    }
  }


  async fetchSolicitudes(req, res, next) {
    try {
      const token = req.headers.authorization;
      const result = await inspectionService.getAllSolicitudes(token);
      return ApiResponse.success(res, result, 'Solicitudes recuperadas');
    } catch(err) { 
      next(err); 
    }
  }


  //inspecciones tecnicas
  async fetchInspeccionesTecnicasAsignadas(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      const result = await inspectionService.getInspeccionesTecnicasAsignadas(authHeader);
      return ApiResponse.success(res, result, 'Inspecciones tecnicas asignadas recuperadas');
    } catch(err) { 
      next(err); 
    }
  }

  //inspecciones tecnicas
  async makeInspeccionTecnica(req, res, next) {
    try {
      const result = await inspectionService.makeInspeccionTecnica(req.user.id, req.body);
      return ApiResponse.success(res, result, 'Inspeccion tecnica realizada', 201);
    } catch (err) {
      next(err); 
    }
  }

}
module.exports = new InspectionController();

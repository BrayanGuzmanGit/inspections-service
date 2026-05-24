const express = require('express');
const router = express.Router();
const inspectionController = require('./inspectionController');
const { crossServiceAuth } = require('../../middlewares/authMiddleware');

//solicitudes de inspeccion
router.post('/solicitudes', crossServiceAuth('Productor'), inspectionController.solicitInspection);
router.delete('/solicitudes/:idsolicitud', crossServiceAuth('Funcionario'), inspectionController.deleteSolicitud);//Cambiar a que solo se edite el estado de la solicitud
router.patch('/solicitudes/:idsolicitud', crossServiceAuth('Funcionario'), inspectionController.editSolicitud); //Aceptar solicitud cambiando estado a aceptada
//compartido
router.get('/solicitudes', crossServiceAuth('Funcionario'), inspectionController.fetchSolicitudes);//Que solo se muestren las solicitudes pendientes y aceptadas

//inspecciones tecnicas asignadas
router.get('/tecnica/asignadas', crossServiceAuth('Tecnico', 'Productor'), inspectionController.fetchInspeccionesTecnicasAsignadas);
router.patch('/tecnica/asignadas', crossServiceAuth('Tecnico'), inspectionController.makeInspeccionTecnica); //El tecnico realiza las inspecciones tecnicas


// === Asistente Tecnico ===
// router.post('/fitosanitaria', crossServiceAuth('Tecnico'), inspectionController.submitFito);
// router.post('/tecnica', crossServiceAuth('Tecnico'), inspectionController.submitTecnica);
// router.post('/conteo-lotes', crossServiceAuth('Tecnico'), inspectionController.addLoteWithPests);

module.exports = router;
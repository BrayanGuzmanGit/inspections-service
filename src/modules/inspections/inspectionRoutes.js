const express = require('express');
const router = express.Router();
const inspectionController = require('./inspectionController');
const { crossServiceAuth } = require('../../middlewares/authMiddleware');

router.post('/solicitudes', crossServiceAuth('Productor'), inspectionController.solicitInspection);
router.delete('/solicitudes/:idsolicitud', crossServiceAuth('Funcionario'), inspectionController.deleteSolicitud);//Eliminar solicitud
router.patch('/solicitudes/:idsolicitud', crossServiceAuth('Funcionario'), inspectionController.editSolicitud); //Aceptar solicitud cambiando estado a aceptada

// === Compartido === 
router.get('/solicitudes', crossServiceAuth('Productor', 'Funcionario'), inspectionController.fetchSolicitudes);

// === Asistente Tecnico ===
// router.post('/fitosanitaria', crossServiceAuth('Tecnico'), inspectionController.submitFito);
// router.post('/tecnica', crossServiceAuth('Tecnico'), inspectionController.submitTecnica);
// router.post('/conteo-lotes', crossServiceAuth('Tecnico'), inspectionController.addLoteWithPests);

module.exports = router;
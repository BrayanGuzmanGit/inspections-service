const express = require('express');
const router = express.Router();
const inspectionController = require('./inspectionController');
const { crossServiceAuth } = require('../../middlewares/authMiddleware');

// === Productor ===
router.post('/solicitudes', crossServiceAuth('Productor'), inspectionController.solicitInspection);

// === Compartido === colocar esto: crossServiceAuth('Tecnico', 'Admin', 'Productor')
router.get('/solicitudes', crossServiceAuth('Tecnico', 'Admin', 'Productor', 'Funcionario'), inspectionController.fetchSolicitudes);

// === Asistente Tecnico ===
router.post('/fitosanitaria', crossServiceAuth('Tecnico'), inspectionController.submitFito);
router.post('/tecnica', crossServiceAuth('Tecnico'), inspectionController.submitTecnica);
router.post('/conteo-lotes', crossServiceAuth('Tecnico'), inspectionController.addLoteWithPests);

module.exports = router;

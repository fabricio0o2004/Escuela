const express = require('express');
const router = express.Router();
const matriculaController = require('../controllers/matriculaController');
const verificarToken = require('../middlewares/authMiddleware');

router.get('/', matriculaController.getMatriculas);
router.post('/', verificarToken, matriculaController.createMatricula);

// ---> NUEVA RUTA PARA EL PDF
// Nota: No usamos verificarToken aquí para que el navegador pueda abrirlo en pestaña nueva fácil
// (Opcional: Si quieres seguridad estricta, el manejo en frontend es más complejo con blobs)
router.get('/:id/pdf', matriculaController.generarConstanciaPDF);

module.exports = router;
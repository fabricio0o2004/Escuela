const express = require('express');
const router = express.Router();
const estudianteController = require('../controllers/estudianteController');
const verificarToken = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

router.get('/', estudianteController.getEstudiantes);
router.post('/', verificarToken, upload.fields([{ name: 'foto' }, { name: 'documento' }]), estudianteController.createEstudiante);
router.delete('/:id', verificarToken, estudianteController.deleteEstudiante);
router.get('/reniec/:dni', estudianteController.consultaReniec);

// ---> AQUÍ ESTÁ LA SOLUCIÓN: AGREGA O CORRIGE ESTA RUTA PUT <---
// Usamos upload.fields porque el formulario de edición TAMBIÉN envía fotos y documentos
router.put('/:id', verificarToken, upload.fields([{ name: 'foto' }, { name: 'documento' }]), estudianteController.updateEstudiante);
module.exports = router;
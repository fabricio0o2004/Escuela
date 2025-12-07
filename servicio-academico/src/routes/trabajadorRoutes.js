const express = require('express');
const router = express.Router();
const trabajadorController = require('../controllers/trabajadorController');
const verificarToken = require('../middlewares/authMiddleware');

router.get('/', trabajadorController.getTrabajadores);
router.post('/', verificarToken, trabajadorController.createTrabajador);
router.put('/:id', verificarToken, trabajadorController.updateTrabajador);
router.delete('/:id', verificarToken, trabajadorController.deleteTrabajador);

// Rutas extra (búsquedas)
router.get('/verificar/:dni', trabajadorController.verificarTrabajador);
router.get('/buscar/:termino', trabajadorController.buscarPersonas); 
router.get('/mis-estudiantes', verificarToken, trabajadorController.getMisEstudiantesDocente);
// Nota: en el index original era /personas/buscar, pero lo pondremos aquí o en el index principal.

module.exports = router;
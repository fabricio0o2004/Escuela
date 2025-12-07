const express = require('express');
const router = express.Router();
const apoderadoController = require('../controllers/apoderadoController');
const verificarToken = require('../middlewares/authMiddleware');

router.get('/', apoderadoController.getApoderados);
router.post('/', verificarToken, apoderadoController.createApoderado);
router.put('/:id', verificarToken, apoderadoController.updateApoderado);
router.delete('/:id', verificarToken, apoderadoController.deleteApoderado);
router.get('/mis-hijos', verificarToken, apoderadoController.getMisHijos);

module.exports = router;
const express = require('express');
const router = express.Router();
const horarioController = require('../controllers/horarioController');
const verificarToken = require('../middlewares/authMiddleware');

// Para el admin
router.post('/', verificarToken, horarioController.createHorario);
router.get('/seccion/:id', verificarToken, horarioController.getHorarioPorSeccion); // <--- NUEVA
router.get('/docente/:id', verificarToken, horarioController.getHorarioPorDocenteAdmin); // <--- NUEVA

// Para el perfil del docente (LOGIN)
router.get('/mis-horarios', verificarToken, horarioController.getHorariosDocente); 
// Nota: cambié la ruta a 'mis-horarios' para que no choque con '/docente/:id'

module.exports = router;
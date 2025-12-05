const express = require('express');
const router = express.Router();
const cursoController = require('../controllers/cursoController');
const verificarToken = require('../middlewares/authMiddleware');

router.get('/', cursoController.getCursos);
router.post('/', verificarToken, cursoController.createCurso);

// Ruta para crear sección (se mantiene)
router.post('/secciones', verificarToken, cursoController.createSeccion);

// NUEVA RUTA: Ver alumnos de una sección específica
// Ejemplo de uso: GET /cursos/secciones/15/alumnos
router.get('/secciones/:id/alumnos', verificarToken, cursoController.getAlumnosPorSeccion);

module.exports = router;
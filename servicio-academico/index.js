require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const externoRoutes = require('./src/routes/externoRoutes');
const axios = require('axios'); 

// --- MIDDLEWARES GLOBALES ---
app.use(express.json());
app.use(cors());
app.use('/reniec', externoRoutes);

// Servir carpeta uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// --- IMPORTAR RUTAS ---
const estudianteRoutes = require('./src/routes/estudianteRoutes');
const cursoRoutes = require('./src/routes/cursoRoutes');
const matriculaRoutes = require('./src/routes/matriculaRoutes');
const apoderadoRoutes = require('./src/routes/apoderadoRoutes');
const trabajadorRoutes = require('./src/routes/trabajadorRoutes');
const horarioRoutes = require('./src/routes/horarioRoutes');
const reporteRoutes = require('./src/routes/reporteRoutes');
const trabajadorController = require('./src/controllers/trabajadorController'); // Para la ruta suelta de búsqueda

// --- DEFINICIÓN DE ENDPOINTS ---

// Estudiantes (incluye Reniec)
app.use('/estudiantes', estudianteRoutes);
// Para la ruta de reniec que estaba suelta, ya la metí dentro de estudianteRoutes. 
// Ahora se accede como: /estudiantes/reniec/:dni

// Cursos y Secciones
app.use('/cursos', cursoRoutes);
// OJO: Tu ruta original para crear secciones era /secciones.
// En cursoRoutes.js la definí como /secciones.
// Al usar app.use('/cursos'), la ruta final queda /cursos/secciones.
// SI QUIERES MANTENER /secciones SUELTO, haz esto:
const seccionesRouter = express.Router();
const cursoController = require('./src/controllers/cursoController');
const verificarToken = require('./src/middlewares/authMiddleware');
seccionesRouter.post('/', verificarToken, cursoController.createSeccion);
app.use('/secciones', seccionesRouter);


// Matriculas
app.use('/matriculas', matriculaRoutes);

// Reportes
app.use('/reportes', reporteRoutes);

// Horarios
app.use('/horarios', horarioRoutes);

// Apoderados
app.use('/apoderados', apoderadoRoutes);

// Trabajadores
app.use('/trabajadores', trabajadorRoutes);

// Personas (Búsqueda Global)
// Como esta ruta no encaja perfectamente en "trabajadores", la definimos manual aquí o usamos un router aparte.
// Para mantener tu estructura original:
app.get('/personas/buscar/:termino', trabajadorController.buscarPersonas);


// --- INICIO DEL SERVIDOR ---
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Servidor Académico (MVC) corriendo en http://localhost:${PORT}`);
});
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// Middlewares Globales
app.use(express.json());
app.use(cors());

// --- IMPORTAR RUTAS ---
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');

// --- USAR RUTAS ---

// Rutas de Autenticación (Login, Registro, Roles)
// Como en tu código original estas rutas eran base (/login, /registro), 
// las montamos en la raíz '/'
app.use('/', authRoutes); 

// Rutas de Usuarios (Gestión)
// En tu código original eran /usuarios, así que montamos userRoutes en /usuarios
app.use('/usuarios', userRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor Auth (MVC) corriendo en http://localhost:${PORT}`);
});
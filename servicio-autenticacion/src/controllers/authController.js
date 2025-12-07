const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const getRoles = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM roles');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error conectando a la BD');
    }
};

const registro = async (req, res) => {
    // CAMBIO 1: Asegúrate de que el body envíe "password", no "password_hash"
    const { nombre_completo, email, password, rol_id } = req.body;
    try {
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // CAMBIO 2: La columna en la BD se llama 'password', no 'password_hash'
        const result = await pool.query(
            'INSERT INTO usuarios (email, password, rol_id) VALUES ($1, $2, $3) RETURNING id, email',
            [email, password_hash, rol_id]
        );
        // Nota: Quité nombre_completo del Insert porque en el script SQL de Auth no pusimos esa columna, 
        // solo email, password y rol_id. Si quieres nombres, habría que alterar la tabla.

        res.status(201).json({
            mensaje: 'Usuario creado con éxito',
            usuario: result.rows[0]
        });

    } catch (err) {
        console.error(err);
        if (err.code === '23505') { 
            return res.status(400).json({ error: 'El email ya está registrado' });
        }
        res.status(500).send('Error al registrar usuario');
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;
    
    // LOG 1: Ver qué llega del frontend
    console.log("--- INTENTO DE LOGIN ---");
    console.log("Email recibido:", email);
    console.log("Contraseña recibida:", password);

    try {
        const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        
        // LOG 2: Ver qué responde la Base de Datos
        if (result.rows.length === 0) {
            console.log("❌ Error: Usuario no encontrado en BD");
            return res.status(400).json({ error: 'Credenciales inválidas (Email no existe)' });
        }

        const usuario = result.rows[0];
        console.log("✅ Usuario encontrado:", usuario.email);
        console.log("🔑 Hash en columna 'password':", usuario.password); 
        console.log("❓ Hash en columna 'password_hash':", usuario.password_hash); 

        // IMPORTANTE: Aquí verificamos cuál columna tiene datos
        const hashReal = usuario.password || usuario.password_hash;

        if (!hashReal) {
            console.log("❌ Error: No se encontró ningún hash de contraseña en la BD.");
            return res.status(500).json({ error: 'Error interno: Usuario sin contraseña' });
        }

        const validPassword = await bcrypt.compare(password, hashReal);
        console.log("Resultado comparación bcrypt:", validPassword);

        if (!validPassword) {
            console.log("❌ Error: La contraseña no coincide con el hash");
            return res.status(400).json({ error: 'Credenciales inválidas (Contraseña incorrecta)' });
        }

        console.log("🎉 ¡LOGIN EXITOSO!");
        const token = jwt.sign(
            { id: usuario.id, rol_id: usuario.rol_id, email: usuario.email },
            process.env.JWT_SECRET,
            { expiresIn: '2h' }
        );

        res.json({ mensaje: 'Bienvenido al sistema', token: token });

    } catch (err) {
        console.error("💥 ERROR CRÍTICO:", err);
        res.status(500).send('Error en el login');
    }
};
module.exports = { getRoles, registro, login };
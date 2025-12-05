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
    const { nombre_completo, email, password, rol_id } = req.body;
    try {
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const result = await pool.query(
            'INSERT INTO usuarios (nombre_completo, email, password_hash, rol_id) VALUES ($1, $2, $3, $4) RETURNING id, nombre_completo, email',
            [nombre_completo, email, password_hash, rol_id]
        );

        res.status(201).json({
            mensaje: 'Usuario creado con éxito',
            usuario: result.rows[0]
        });

    } catch (err) {
        console.error(err);
        if (err.code === '23505') { // Código de error de Postgres para duplicados
            return res.status(400).json({ error: 'El email ya está registrado' });
        }
        res.status(500).send('Error al registrar usuario');
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Credenciales inválidas (Email no existe)' });
        }

        const usuario = result.rows[0];
        const validPassword = await bcrypt.compare(password, usuario.password_hash);

        if (!validPassword) {
            return res.status(400).json({ error: 'Credenciales inválidas (Contraseña incorrecta)' });
        }

        const token = jwt.sign(
            { id: usuario.id, rol_id: usuario.rol_id, email: usuario.email },
            process.env.JWT_SECRET,
            { expiresIn: '2h' }
        );

        res.json({ mensaje: 'Bienvenido al sistema', token: token });

    } catch (err) {
        console.error(err);
        res.status(500).send('Error en el login');
    }
};

module.exports = { getRoles, registro, login };
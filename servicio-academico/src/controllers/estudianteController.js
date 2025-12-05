const pool = require('../config/db');
const axios = require('axios');
require('dotenv').config();

// 1. LISTAR ESTUDIANTES (Usando la VISTA SQL para traer Grado/Sección)
const getEstudiantes = async (req, res) => {
    try {
        // Consultamos la vista 'vista_estudiantes_info' que creamos en la base de datos
        // Esto trae automáticamente: nombres, dni, Y TAMBIÉN el grado y sección actual.
        const [rows] = await pool.query('SELECT * FROM vista_estudiantes_info ORDER BY id DESC');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al obtener estudiantes');
    }
};

// 2. CREAR ESTUDIANTE
const createEstudiante = async (req, res) => {
    const { dni, nombres, apellidos, fecha_nacimiento, direccion, tipo_sangre, alergias, apoderado_id } = req.body;
    
    // Construcción de rutas para archivos
    const port = process.env.PORT || 3001;
    // req.files puede ser undefined si no se suben archivos, validamos eso
    const fotoPath = (req.files && req.files['foto']) ? `http://localhost:${port}/uploads/${req.files['foto'][0].filename}` : null;
    const docPath = (req.files && req.files['documento']) ? `http://localhost:${port}/uploads/${req.files['documento'][0].filename}` : null;

    if (!dni || !nombres || !apellidos) {
        return res.status(400).json({ error: 'Faltan campos obligatorios (DNI, Nombres, Apellidos)' });
    }

    try {
        const sql = `
            INSERT INTO estudiantes 
            (dni, nombres, apellidos, fecha_nacimiento, direccion, tipo_sangre, alergias, foto_perfil, documento_pdf, apoderado_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const [result] = await pool.query(sql, [
            dni, nombres, apellidos, fecha_nacimiento, direccion, 
            tipo_sangre, alergias, fotoPath, docPath, apoderado_id || null
        ]);

        res.status(201).json({ mensaje: 'Estudiante registrado con documentos', id: result.insertId });

    } catch (err) {
        console.error(err);
        if (err.code === 'ER_DUP_ENTRY') { 
            return res.status(400).json({ error: 'El DNI ya existe en el sistema.' });
        }
        res.status(500).send('Error al registrar');
    }
};

// 3. ACTUALIZAR ESTUDIANTE (NUEVA FUNCIÓN)
const updateEstudiante = async (req, res) => {
    const { id } = req.params;
    // Solo permitimos editar Dirección y Alergias (Nombres/DNI protegidos)
    const { direccion, alergias } = req.body;

    const port = process.env.PORT || 3001;
    const fotoPath = (req.files && req.files['foto']) ? `http://localhost:${port}/uploads/${req.files['foto'][0].filename}` : null;
    const docPath = (req.files && req.files['documento']) ? `http://localhost:${port}/uploads/${req.files['documento'][0].filename}` : null;

    try {
        // Construimos la consulta dinámicamente según qué archivos se subieron
        let sql = 'UPDATE estudiantes SET direccion = ?, alergias = ?';
        let params = [direccion, alergias];

        if (fotoPath) {
            sql += ', foto_perfil = ?';
            params.push(fotoPath);
        }
        if (docPath) {
            sql += ', documento_pdf = ?';
            params.push(docPath);
        }

        sql += ' WHERE id = ?';
        params.push(id);

        await pool.query(sql, params);

        res.json({ mensaje: 'Datos del estudiante actualizados correctamente.' });

    } catch (err) {
        console.error(err);
        res.status(500).send('Error al actualizar estudiante');
    }
};

// 4. ELIMINAR ESTUDIANTE
const deleteEstudiante = async (req, res) => {
    const { id } = req.params;
    try {
        // Primero borramos sus matrículas para evitar error de llave foránea
        await pool.query('DELETE FROM matriculas WHERE estudiante_id = ?', [id]);
        
        // Ahora borramos al estudiante
        const [result] = await pool.query('DELETE FROM estudiantes WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Estudiante no encontrado' });
        }
        res.json({ mensaje: 'Estudiante eliminado correctamente' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al eliminar estudiante');
    }
};

// 5. CONSULTA RENIEC
const consultaReniec = async (req, res) => {
    const { dni } = req.params;
    const token = 'sk_12112.TOi5FKlrsfSLG2yH7Zld1vtuurexb9D2'; // TU TOKEN

    if (dni.length !== 8) return res.status(400).json({ error: 'El DNI debe tener 8 dígitos' });

    try {
        const url = `https://api.decolecta.com/v1/reniec/dni?numero=${dni}`;
        const response = await axios.get(url, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = response.data;
        const persona = data.result || data.data || data;

        if (!persona || !persona.first_name) return res.status(404).json({ error: 'DNI no encontrado' });

        res.json({
            nombres: persona.first_name,           
            apellidoPaterno: persona.first_last_name, 
            apellidoMaterno: persona.second_last_name, 
            direccion: '' 
        });
    } catch (error) {
        console.error('Error externo:', error.message);
        res.status(500).json({ error: 'No se encontró el DNI o falló la API externa' });
    }
};

module.exports = { 
    getEstudiantes, 
    createEstudiante, 
    updateEstudiante, // <--- ¡Importante! Añadido aquí
    deleteEstudiante, 
    consultaReniec 
};
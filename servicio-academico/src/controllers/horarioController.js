const pool = require('../config/db');

// 1. OBTENER HORARIO DE UNA SECCIÓN (Para ver qué clases tiene el 1ro A)
const getHorarioPorSeccion = async (req, res) => {
    const { id } = req.params; // ID de la sección
    try {
        const sql = `
            SELECT h.*, 
                   t.nombres as docente_nom, t.apellidos as docente_ape
            FROM horarios h
            JOIN trabajadores t ON h.docente_id = t.id
            WHERE h.seccion_id = ?
        `;
        const [rows] = await pool.query(sql, [id]);
        res.json(rows);
    } catch (err) { res.status(500).send('Error al buscar horario sección'); }
};

// 2. OBTENER HORARIO DE UN DOCENTE (Para ver si el profe está ocupado)
const getHorarioPorDocenteAdmin = async (req, res) => {
    const { id } = req.params; // ID del docente
    try {
        const sql = `
            SELECT h.*, 
                   c.nombre as curso_nom, s.letra as seccion_letra
            FROM horarios h
            JOIN secciones s ON h.seccion_id = s.id
            JOIN cursos c ON s.curso_id = c.id
            WHERE h.docente_id = ?
        `;
        const [rows] = await pool.query(sql, [id]);
        res.json(rows);
    } catch (err) { res.status(500).send('Error al buscar horario docente'); }
};

// 3. ASIGNAR CLASE (VALIDANDO CRUCES)
const createHorario = async (req, res) => {
    const { seccion_id, docente_id, materia, dia, hora_inicio, hora_fin } = req.body;

    const connection = await pool.getConnection();
    try {
        // A. Validar que la SECCIÓN no esté ocupada a esa hora
        const [cruceSeccion] = await connection.query(
            'SELECT * FROM horarios WHERE seccion_id = ? AND dia = ? AND hora_inicio = ?',
            [seccion_id, dia, hora_inicio]
        );
        if (cruceSeccion.length > 0) return res.status(400).json({ error: '⛔ La sección ya tiene clase a esa hora.' });

        // B. Validar que el DOCENTE no esté ocupado en otro salón a esa hora
        const [cruceDocente] = await connection.query(
            'SELECT * FROM horarios WHERE docente_id = ? AND dia = ? AND hora_inicio = ?',
            [docente_id, dia, hora_inicio]
        );
        if (cruceDocente.length > 0) return res.status(400).json({ error: '⛔ El docente ya está dictando en otro salón a esa hora.' });

        // C. Insertar
        await connection.query(
            'INSERT INTO horarios (seccion_id, docente_id, materia, dia, hora_inicio, hora_fin) VALUES (?, ?, ?, ?, ?, ?)',
            [seccion_id, docente_id, materia, dia, hora_inicio, hora_fin]
        );
        res.status(201).json({ mensaje: 'Clase asignada correctamente' });

    } catch (err) {
        console.error(err);
        res.status(500).send('Error al asignar');
    } finally {
        connection.release();
    }
};

// Mantén getHorariosDocente (el que ya tenías para el perfil del profe)
const getHorariosDocente = async (req, res) => { /* ... tu código antiguo ... */ };

module.exports = { createHorario, getHorarioPorSeccion, getHorarioPorDocenteAdmin, getHorariosDocente };
const pool = require('../config/db');

// 1. LISTAR CURSOS Y SECCIONES
const getCursos = async (req, res) => {
    try {
        const sql = `
            SELECT c.id as curso_id, c.nombre, c.nivel, s.id as seccion_id, s.letra, s.vacantes
            FROM cursos c
            LEFT JOIN secciones s ON c.id = s.curso_id
            ORDER BY c.id, s.letra
        `;
        const [rows] = await pool.query(sql);
        res.json(rows);
    } catch (err) {
        res.status(500).send('Error al listar cursos');
    }
};

// 2. CREAR CURSO
const createCurso = async (req, res) => {
    const { nombre, nivel } = req.body;
    try {
        const [result] = await pool.query('INSERT INTO cursos (nombre, nivel) VALUES (?, ?)', [nombre, nivel]);
        res.status(201).json({ mensaje: 'Curso creado', id: result.insertId });
    } catch (err) { res.status(500).send('Error al crear curso'); }
};

// 3. CREAR SECCIÓN (Con validación de duplicados)
const createSeccion = async (req, res) => {
    const { curso_id, letra, vacantes } = req.body;
    try {
        await pool.query('INSERT INTO secciones (curso_id, letra, vacantes) VALUES (?, ?, ?)', [curso_id, letra, vacantes]);
        res.status(201).json({ mensaje: 'Sección creada' });
    } catch (err) {
        // Capturamos el error de restricción UNIQUE que pusimos en la BD
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: `La sección "${letra}" ya existe para este curso.` });
        }
        res.status(500).send('Error al crear sección'); 
    }
};

// 4. NUEVO: VER ALUMNOS DE UNA SECCIÓN
const getAlumnosPorSeccion = async (req, res) => {
    const { id } = req.params; // ID de la sección
    try {
        // Unimos matriculas con estudiantes para saber quiénes están
        const sql = `
            SELECT e.id, e.dni, e.nombres, e.apellidos, e.foto_perfil
            FROM matriculas m
            JOIN estudiantes e ON m.estudiante_id = e.id
            WHERE m.seccion_id = ?
            ORDER BY e.apellidos ASC
        `;
        const [rows] = await pool.query(sql, [id]);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al obtener alumnos');
    }
};

module.exports = { getCursos, createCurso, createSeccion, getAlumnosPorSeccion };
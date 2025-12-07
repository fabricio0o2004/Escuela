const pool = require('../config/db');

const getTrabajadores = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM trabajadores ORDER BY id DESC');
        res.json(rows);
    } catch (err) { res.status(500).send('Error al listar trabajadores'); }
};

// 2. CREAR TRABAJADOR
const createTrabajador = async (req, res) => {
    // Recibimos curso_principal
    const { nombres, apellidos, dni, email, cargo, telefono, curso_principal } = req.body;

    if (!nombres || !apellidos || !dni) {
        return res.status(400).json({ error: 'Faltan campos obligatorios.' });
    }
    if (!telefono || telefono.toString().length !== 9) {
        return res.status(400).json({ error: 'El teléfono debe tener 9 dígitos.' });
    }

    try {
        await pool.query(
            'INSERT INTO trabajadores (nombres, apellidos, dni, email, cargo, telefono, curso_principal) VALUES (?, ?, ?, ?, ?, ?, ?)', 
            [nombres, apellidos, dni, email, cargo, telefono, curso_principal || null]
        );
        res.status(201).json({ mensaje: 'Trabajador registrado correctamente' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            if (err.sqlMessage.includes('telefono')) return res.status(400).json({ error: 'Teléfono duplicado.' });
            return res.status(400).json({ error: 'DNI duplicado.' });
        }
        res.status(500).send('Error al registrar'); 
    }
};
// 3. ACTUALIZAR TRABAJADOR
const updateTrabajador = async (req, res) => {
    const { id } = req.params;
    const { email, cargo, telefono, curso_principal } = req.body; // Recibimos curso

    if (telefono && telefono.toString().length !== 9) {
        return res.status(400).json({ error: 'El teléfono debe tener 9 dígitos.' });
    }

    try {
        await pool.query(
            'UPDATE trabajadores SET email = ?, cargo = ?, telefono = ?, curso_principal = ? WHERE id = ?',
            [email, cargo, telefono, curso_principal || null, id]
        );
        res.json({ mensaje: 'Datos actualizados' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'DNI o Teléfono duplicado.' });
        res.status(500).send('Error al actualizar');
    }
};

const deleteTrabajador = async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query('DELETE FROM trabajadores WHERE id = ?', [id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Trabajador no encontrado' });
        res.json({ mensaje: 'Trabajador eliminado correctamente' });
    } catch (err) {
        console.error(err);
        if (err.code && err.code.includes('ROW_IS_REFERENCED')) return res.status(400).json({ error: 'No se puede eliminar: Tiene datos asignados.' });
        res.status(500).send('Error al eliminar');
    }
};

// --- BÚSQUEDAS ADICIONALES ---

const buscarPersonas = async (req, res) => {
    const { termino } = req.params;
    const busqueda = `%${termino}%`; 
    try {
        const sql = `
            SELECT dni, nombres, apellidos, email, 'Trabajador' as origen, cargo as rol_sugerido 
            FROM trabajadores WHERE dni LIKE ? OR nombres LIKE ? OR apellidos LIKE ?
            UNION
            SELECT dni, nombres, apellidos, email, 'Apoderado' as origen, 'Apoderado' as rol_sugerido 
            FROM apoderados WHERE dni LIKE ? OR nombres LIKE ? OR apellidos LIKE ?
        `;
        const [rows] = await pool.query(sql, [busqueda, busqueda, busqueda, busqueda, busqueda, busqueda]);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error buscando personas');
    }
};

const verificarTrabajador = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id, nombres, apellidos FROM trabajadores WHERE dni = ?', [req.params.dni]);
        if (rows.length > 0) res.json({ existe: true, trabajador: rows[0] });
        else res.json({ existe: false });
    } catch (err) { res.status(500).send('Error verificando'); }
};
// 5. OBTENER MIS ESTUDIANTES (DOCENTE)
const getMisEstudiantesDocente = async (req, res) => {
    const emailUser = req.usuario.email; 

    try {
        // 1. Buscar ID del docente
        const [trabajador] = await pool.query('SELECT id FROM trabajadores WHERE email = ?', [emailUser]);
        if (trabajador.length === 0) return res.status(404).json({ error: 'Docente no encontrado' });
        const docenteId = trabajador[0].id;

        // 2. Buscar estudiantes de sus secciones
        // Lógica: Horario -> Sección -> Matrícula -> Estudiante
        const sql = `
            SELECT DISTINCT e.id, e.dni, e.nombres, e.apellidos, e.foto_perfil, 
                            c.nombre as grado, s.letra as seccion, e.tipo_sangre, e.alergias
            FROM horarios h
            JOIN secciones s ON h.seccion_id = s.id
            JOIN cursos c ON s.curso_id = c.id
            JOIN matriculas m ON m.seccion_id = s.id
            JOIN estudiantes e ON m.estudiante_id = e.id
            WHERE h.docente_id = ?
            ORDER BY c.nombre, s.letra, e.apellidos
        `;
        
        const [rows] = await pool.query(sql, [docenteId]);
        res.json(rows);

    } catch (err) {
        console.error(err);
        res.status(500).send('Error al obtener mis estudiantes');
    }
};


module.exports = { getTrabajadores, createTrabajador, updateTrabajador, deleteTrabajador, buscarPersonas, verificarTrabajador, getMisEstudiantesDocente};
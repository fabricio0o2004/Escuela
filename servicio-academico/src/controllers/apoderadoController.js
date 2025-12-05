const pool = require('../config/db');

// 1. LISTAR APODERADOS
const getApoderados = async (req, res) => {
    try {
        const sql = `
            SELECT a.id, a.nombres, a.apellidos, a.dni, a.telefono, a.email,
                GROUP_CONCAT(CONCAT(e.nombres, ' ', e.apellidos) SEPARATOR ', ') as hijos_asignados
            FROM apoderados a
            LEFT JOIN estudiantes e ON e.apoderado_id = a.id
            GROUP BY a.id
            ORDER BY a.id DESC
        `;
        const [rows] = await pool.query(sql);
        res.json(rows);
    } catch (err) {
        res.status(500).send('Error al listar apoderados');
    }
};

// 2. CREAR APODERADO (Múltiples Hijos + Validación Estricta)
const createApoderado = async (req, res) => {
    const { nombres, apellidos, dni, telefono, email, estudiantes_ids } = req.body;

    // --- VALIDACIONES ---
    if (!nombres || !dni || !apellidos) {
        return res.status(400).json({ error: 'Faltan datos obligatorios (Nombres, Apellidos, DNI).' });
    }
    
    // Validación de Teléfono (9 dígitos exactos)
    if (!telefono || telefono.toString().length !== 9) {
        return res.status(400).json({ error: 'El teléfono es obligatorio y debe tener exactamente 9 dígitos.' });
    }

    // Validación de Hijos (Array)
    let idsHijos = [];
    if (estudiantes_ids && Array.isArray(estudiantes_ids)) {
        idsHijos = estudiantes_ids;
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction(); 

        // A. Insertar al Padre
        const [resultApoderado] = await connection.query(
            'INSERT INTO apoderados (nombres, apellidos, dni, telefono, email) VALUES (?, ?, ?, ?, ?)',
            [nombres, apellidos, dni, telefono, email]
        );
        const nuevoId = resultApoderado.insertId;

        // B. Vincular Hijos (Si hay alguno en la lista)
        if (idsHijos.length > 0) {
            const [resultHijos] = await connection.query(
                'UPDATE estudiantes SET apoderado_id = ? WHERE id IN (?)',
                [nuevoId, idsHijos]
            );
            
            // Opcional: Verificar si se actualizaron
            if (resultHijos.affectedRows === 0) {
                // No fallamos la transacción, pero avisamos en consola
                console.warn('Se creó el apoderado pero los IDs de estudiantes no eran válidos.');
            }
        }

        await connection.commit();
        res.status(201).json({ mensaje: 'Apoderado registrado y vinculado correctamente.' });

    } catch (err) {
        await connection.rollback();
        console.error(err);
        
        if (err.code === 'ER_DUP_ENTRY') {
            if (err.sqlMessage.includes('telefono')) return res.status(400).json({ error: 'El teléfono ya está registrado.' });
            return res.status(400).json({ error: 'El DNI ya existe.' });
        }
        res.status(500).send('Error interno al registrar');
    } finally {
        connection.release();
    }
};

// 3. ACTUALIZAR APODERADO
// 3. ACTUALIZAR APODERADO (DATOS + HIJOS)
const updateApoderado = async (req, res) => {
    const { id } = req.params;
    const { nombres, apellidos, dni, telefono, email, estudiantes_ids } = req.body;

    // Validación de Teléfono
    if (telefono && telefono.toString().length !== 9) {
        return res.status(400).json({ error: 'El teléfono debe tener exactamente 9 dígitos.' });
    }

    // Validación de Hijos
    let idsHijos = [];
    if (estudiantes_ids && Array.isArray(estudiantes_ids)) {
        idsHijos = estudiantes_ids;
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // A. Actualizar datos personales del Papá
        await connection.query(
            'UPDATE apoderados SET nombres = ?, apellidos = ?, dni = ?, telefono = ?, email = ? WHERE id = ?',
            [nombres, apellidos, dni, telefono, email, id]
        );

        // B. GESTIÓN DE HIJOS (Aquí está la magia)
        
        // 1. Primero "desvinculamos" a TODOS los que tenía antes (Limpieza)
        await connection.query('UPDATE estudiantes SET apoderado_id = NULL WHERE apoderado_id = ?', [id]);

        // 2. Ahora vinculamos a los que vienen en la nueva lista (si hay alguno)
        if (idsHijos.length > 0) {
            await connection.query(
                'UPDATE estudiantes SET apoderado_id = ? WHERE id IN (?)',
                [id, idsHijos]
            );
        }

        await connection.commit();
        res.json({ mensaje: 'Datos y lista de hijos actualizados correctamente' });

    } catch (err) {
        await connection.rollback();
        console.error(err);
        if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'DNI o Teléfono duplicado.' });
        res.status(500).send('Error al actualizar apoderado');
    } finally {
        connection.release();
    }
};

// 4. ELIMINAR APODERADO
const deleteApoderado = async (req, res) => {
    const { id } = req.params;
    try {
        // Verificar si tiene hijos
        const [hijos] = await pool.query('SELECT id, nombres FROM estudiantes WHERE apoderado_id = ?', [id]);

        if (hijos.length > 0) {
            return res.status(400).json({ 
                error: `No se puede eliminar: Tiene ${hijos.length} estudiante(s) a cargo.` 
            });
        }

        const [result] = await pool.query('DELETE FROM apoderados WHERE id = ?', [id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'No encontrado' });
        
        res.json({ mensaje: 'Apoderado eliminado' });
    } catch (err) {
        res.status(500).send('Error al eliminar');
    }
};

module.exports = { getApoderados, createApoderado, updateApoderado, deleteApoderado };
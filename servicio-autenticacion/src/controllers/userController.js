const pool = require('../config/db');

// Obtener todos los usuarios (JOIN con Roles)
const getUsuarios = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT u.id, u.nombre_completo, u.email, r.nombre as rol 
            FROM usuarios u
            JOIN roles r ON u.rol_id = r.id
            ORDER BY u.id ASC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al obtener usuarios');
    }
};

const deleteUsuario = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM usuarios WHERE id = $1', [id]);
        res.json({ mensaje: 'Usuario eliminado correctamente' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al eliminar usuario');
    }
};

const updateUsuario = async (req, res) => {
    const { id } = req.params;
    const { nombre_completo, email, rol_id } = req.body;

    try {
        await pool.query(
            'UPDATE usuarios SET nombre_completo = $1, email = $2, rol_id = $3 WHERE id = $4',
            [nombre_completo, email, rol_id, id]
        );
        res.json({ mensaje: 'Usuario actualizado correctamente' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al actualizar usuario');
    }
};

module.exports = { getUsuarios, deleteUsuario, updateUsuario };
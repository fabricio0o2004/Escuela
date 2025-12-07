const pool = require('../config/db');

// Obtener todos los usuarios (JOIN con Roles)
const getUsuarios = async (req, res) => {
    try {
        // CORRECCIÓN: Quitamos u.nombre_completo porque no existe en la BD
        const result = await pool.query(`
            SELECT u.id, u.email, r.nombre as rol 
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
    // CORRECCIÓN: Quitamos nombre_completo del body
    const { email, rol_id } = req.body;

    try {
        // CORRECCIÓN: Actualizamos solo email y rol_id
        await pool.query(
            'UPDATE usuarios SET email = $1, rol_id = $2 WHERE id = $3',
            [email, rol_id, id]
        );
        res.json({ mensaje: 'Usuario actualizado correctamente' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al actualizar usuario');
    }
};

module.exports = { getUsuarios, deleteUsuario, updateUsuario };
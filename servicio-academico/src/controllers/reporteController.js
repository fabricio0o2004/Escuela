const pool = require('../config/db');

const getDashboard = async (req, res) => {
    try {
        const connection = await pool.getConnection();

        const [rowsTotal] = await connection.query('SELECT COUNT(*) as total FROM matriculas');
        const [rowsVacantes] = await connection.query('SELECT SUM(vacantes) as total FROM secciones');

        const sqlDetalle = `
            SELECT c.nombre, c.nivel, s.letra, s.vacantes, 
                   (SELECT COUNT(*) FROM matriculas m WHERE m.seccion_id = s.id) as inscritos
            FROM secciones s
            JOIN cursos c ON s.curso_id = c.id
            ORDER BY c.id, s.letra
        `;
        const [rowsDetalle] = await connection.query(sqlDetalle);

        connection.release();

        res.json({
            total_matriculados: rowsTotal[0].total,
            total_vacantes: rowsVacantes[0].total,
            detalle_cursos: rowsDetalle
        });

    } catch (err) {
        console.error(err);
        res.status(500).send('Error generando reportes');
    }
};

module.exports = { getDashboard };
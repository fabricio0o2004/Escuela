const pool = require('../config/db');
const PdfPrinter = require('pdfmake');
const fs = require('fs');
const path = require('path');

// Definición de fuentes estándar para PDF (para no requerir archivos externos)
const fonts = {
    Helvetica: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique'
    }
};

// 1. CREAR MATRÍCULA (Lógica de vacantes y transacción)
const createMatricula = async (req, res) => {
    const { estudiante_id, seccion_id } = req.body;

    if (!estudiante_id || !seccion_id) return res.status(400).json({ error: 'Faltan datos' });

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Verificar vacantes
        const [rows] = await connection.query('SELECT vacantes FROM secciones WHERE id = ? FOR UPDATE', [seccion_id]);
        
        if (rows.length === 0) throw new Error('Sección no encontrada');
        const vacantes = rows[0].vacantes;

        if (vacantes <= 0) {
            throw new Error('⛔ No hay vacantes disponibles en esta sección');
        }

        // Restar una vacante
        await connection.query('UPDATE secciones SET vacantes = vacantes - 1 WHERE id = ?', [seccion_id]);

        // Registrar la matrícula (Año 2025 fijo por ahora)
        await connection.query(
            'INSERT INTO matriculas (estudiante_id, seccion_id, anio_escolar) VALUES (?, ?, 2025)',
            [estudiante_id, seccion_id]
        );

        await connection.commit(); 
        res.status(201).json({ mensaje: '¡Matrícula exitosa! Vacante descontada.' });

    } catch (err) {
        await connection.rollback(); 
        console.error(err);
        const mensaje = err.code === 'ER_DUP_ENTRY' ? 'El estudiante ya está matriculado este año.' : err.message;
        res.status(400).json({ error: mensaje });
    } finally {
        connection.release();
    }
};

// 2. LISTAR MATRÍCULAS
const getMatriculas = async (req, res) => {
    try {
        const sql = `
            SELECT m.id, m.fecha_matricula,m.seccion_id, e.nombres, e.apellidos, e.dni, e.foto_perfil,
                   c.nombre as curso, s.letra, c.nivel
            FROM matriculas m
            JOIN estudiantes e ON m.estudiante_id = e.id
            JOIN secciones s ON m.seccion_id = s.id
            JOIN cursos c ON s.curso_id = c.id
            ORDER BY m.id DESC
        `;
        const [rows] = await pool.query(sql);
        res.json(rows);
    } catch (err) { 
        console.error(err);
        res.status(500).send('Error al listar matrículas'); 
    }
};

// 3. GENERAR CONSTANCIA PDF (Nueva función)
const generarConstanciaPDF = async (req, res) => {
    const { id } = req.params;

    try {
        // Obtener datos completos de la matrícula
        const sql = `
            SELECT m.id, m.fecha_matricula, m.anio_escolar,
                   e.nombres, e.apellidos, e.dni, e.direccion,
                   c.nombre as curso, s.letra, c.nivel
            FROM matriculas m
            JOIN estudiantes e ON m.estudiante_id = e.id
            JOIN secciones s ON m.seccion_id = s.id
            JOIN cursos c ON s.curso_id = c.id
            WHERE m.id = ?
        `;
        
        const [rows] = await pool.query(sql, [id]);

        if (rows.length === 0) {
            return res.status(404).send('Matrícula no encontrada');
        }

        const datos = rows[0];
        const fecha = new Date(datos.fecha_matricula).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

        // Diseño del PDF
        const printer = new PdfPrinter(fonts);

        const docDefinition = {
            defaultStyle: { font: 'Helvetica' },
            content: [
                { text: 'SISTEMA ESCOLAR SOA', style: 'header', alignment: 'center', margin: [0, 0, 0, 10] },
                { text: 'CONSTANCIA DE MATRÍCULA 2025', style: 'subheader', alignment: 'center', margin: [0, 0, 0, 30] },
                { canvas: [{ type: 'line', x1: 0, y1: 5, x2: 515, y2: 5, lineWidth: 1 }] },
                { text: ' ', margin: [0, 0, 0, 20] },
                {
                    text: [
                        'Por medio de la presente se hace constar que el estudiante ',
                        { text: `${datos.nombres} ${datos.apellidos}`, bold: true },
                        ' identificado con DNI ',
                        { text: datos.dni, bold: true },
                        ', ha sido matriculado satisfactoriamente en nuestra institución educativa para el periodo escolar 2025.'
                    ],
                    lineHeight: 1.5,
                    alignment: 'justify',
                    margin: [0, 0, 0, 20]
                },
                {
                    style: 'tableExample',
                    table: {
                        widths: ['*', '*'],
                        body: [
                            [{ text: 'DETALLES ACADÉMICOS', colSpan: 2, bold: true, fillColor: '#eeeeee' }, ''],
                            [{ text: 'Código de Matrícula:', bold: true }, `MAT-${String(datos.id).padStart(6, '0')}`],
                            [{ text: 'Nivel Educativo:', bold: true }, datos.nivel],
                            [{ text: 'Grado Asignado:', bold: true }, datos.curso],
                            [{ text: 'Sección / Aula:', bold: true }, `"${datos.letra}"`],
                            [{ text: 'Fecha de Registro:', bold: true }, fecha]
                        ]
                    },
                    margin: [0, 0, 0, 40]
                },
                { text: '_____________________________', alignment: 'center', margin: [0, 50, 0, 5] },
                { text: 'Dirección Académica', alignment: 'center', style: 'small' }
            ],
            styles: {
                header: { fontSize: 22, bold: true },
                subheader: { fontSize: 16, bold: true },
                small: { fontSize: 10, italics: true }
            }
        };

        const pdfDoc = printer.createPdfKitDocument(docDefinition);
        
        // Headers para que el navegador sepa que es un PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=Constancia_${datos.dni}.pdf`);

        pdfDoc.pipe(res);
        pdfDoc.end();

    } catch (err) {
        console.error(err);
        res.status(500).send('Error generando PDF');
    }
};

// EXPORTAR TODO (Importante: aquí deben estar las 3 funciones)
module.exports = { 
    createMatricula, 
    getMatriculas, 
    generarConstanciaPDF 
};
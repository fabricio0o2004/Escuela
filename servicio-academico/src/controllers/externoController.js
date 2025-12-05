// src/controllers/externoController.js
const axios = require('axios');

const consultaReniec = async (req, res) => {
    const { dni } = req.params;
    const token = 'sk_12112.TOi5FKlrsfSLG2yH7Zld1vtuurexb9D2'; // Tu token

    if (dni.length !== 8) {
        return res.status(400).json({ error: 'El DNI debe tener 8 dígitos' });
    }

    try {
        const url = `https://api.decolecta.com/v1/reniec/dni?numero=${dni}`;
        const response = await axios.get(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = response.data;
        // Ajustamos para soportar diferentes formatos de respuesta de la API
        const persona = data.result || data.data || data;

        if (!persona || (!persona.nombres && !persona.first_name)) {
             return res.status(404).json({ error: 'DNI no encontrado' });
        }

        // Mapeamos los datos para que tu frontend los entienda
        res.json({
            nombres: persona.first_name || persona.nombres,           
            apellidoPaterno: persona.first_last_name || persona.apellido_paterno, 
            apellidoMaterno: persona.second_last_name || persona.apellido_materno, 
            direccion: '' 
        });

    } catch (error) {
        console.error('Error externo:', error.message);
        res.status(500).json({ error: 'No se encontró el DNI o falló la API externa' });
    }
};

module.exports = { consultaReniec };
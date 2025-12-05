// src/routes/externoRoutes.js
const express = require('express');
const router = express.Router();
const externoController = require('../controllers/externoController');

// Definimos la ruta raíz de este archivo
router.get('/:dni', externoController.consultaReniec);

module.exports = router;
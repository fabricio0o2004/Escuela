const express = require('express');
const router = express.Router();
const reporteController = require('../controllers/reporteController');

router.get('/dashboard', reporteController.getDashboard);

module.exports = router;
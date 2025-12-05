const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.get('/roles', authController.getRoles);
router.post('/registro', authController.registro);
router.post('/login', authController.login);

module.exports = router;
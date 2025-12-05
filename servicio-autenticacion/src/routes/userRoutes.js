const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Rutas de gestión
router.get('/', userController.getUsuarios);       // GET /usuarios
router.put('/:id', userController.updateUsuario);  // PUT /usuarios/:id
router.delete('/:id', userController.deleteUsuario); // DELETE /usuarios/:id

module.exports = router;
const express = require('express');
const path = require('path');
const app = express();

// Servir archivos estáticos (html, css, js, img)
app.use(express.static(__dirname));

// Cualquier ruta que no sea archivo, devuelve index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Frontend corriendo en puerto ${PORT}`);
});
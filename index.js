    const express = require('express');
    const cors = require('cors');
    const fs = require('fs');
    const app = express();
    const PORT = process.env.PORT || 4000;

    app.use(cors());

    // Cargar autores desde el archivo JSON
    let rawData = fs.readFileSync('./data.json');
    let data = JSON.parse(rawData);
    let authors = data.authors;

    // GET /authors - Obtener todos los autores
    app.get('/authors', (req, res) => {
    const simplifiedAuthors = authors.map(({ id, name, description, image, biography }) => ({
        id,
        name,
        description,
        image,
        biography
    }));
    res.json(simplifiedAuthors);
    });

    // GET /authors/:id/random-quote - Obtener una frase aleatoria de un autor
    app.get('/authors/:id/random-quote', (req, res) => {
    const authorId = parseInt(req.params.id);
    const author = authors.find(a => a.id === authorId);

    if (!author) {
        return res.status(404).json({ error: 'Autor no encontrado' });
    }

    const randomIndex = Math.floor(Math.random() * author.quotes.length);
    const quote = author.quotes[randomIndex];

    res.json({
        author: author.name,
        quote
    });
    });

    app.listen(PORT, () => {
    console.log(`API escuchando en http://localhost:${PORT}`);
    });

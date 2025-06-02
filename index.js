const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json()); // Middleware para parsear JSON
app.use(express.static(path.join(__dirname, 'public'))); // Servir archivos estáticos

// Cargar autores desde el archivo JSON
let rawData = fs.readFileSync('./data.json');
let data = JSON.parse(rawData);
let authors = data.authors;

// GET /authors - Obtener todos los autores
app.get('/authors', (req, res) => {
  const simplifiedAuthors = authors.map(({ id, name, description, image, biography, locked }) => ({
    id,
    name,
    description,
    image,
    biography,
    locked
  }));
  res.json(simplifiedAuthors);
});

// POST /authors - Agregar un nuevo autor
app.post('/authors', (req, res) => {
  try {
    const { name, description, image, biography } = req.body;
    
    // Validar que se proporcionen todos los campos requeridos
    if (!name || !description || !image || !biography) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }
    
    // Obtener el último ID y agregar 1 para el nuevo autor
    const lastId = authors.length > 0 ? Math.max(...authors.map(author => author.id)) : 0;
    const newId = lastId + 1;
    
    // Crear el nuevo autor
    const newAuthor = {
      id: newId,
      name,
      description,
      image,
      biography,
      quotes: [], // Iniciar con un array vacío de citas
      locked: true // Por defecto, los nuevos autores están bloqueados
    };
    
    // Agregar el nuevo autor a la lista
    authors.push(newAuthor);
    
    // Guardar los cambios en el archivo JSON
    data.authors = authors;
    fs.writeFileSync('./data.json', JSON.stringify(data, null, 4));
    
    // Devolver el autor creado
    res.status(201).json(newAuthor);
  } catch (error) {
    console.error('Error al agregar autor:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /authors/:id/random-quote - Obtener una frase aleatoria de un autor
app.get('/authors/:id/random-quote', (req, res) => {
  const authorId = parseInt(req.params.id);
  const author = authors.find(a => a.id === authorId);

  if (!author) {
    return res.status(404).json({ error: 'Autor no encontrado' });
  }

  if (!author.quotes || author.quotes.length === 0) {
    return res.status(404).json({ error: 'Este autor no tiene frases registradas' });
  }

  const randomIndex = Math.floor(Math.random() * author.quotes.length);
  const quote = author.quotes[randomIndex];

  res.json({
    author: author.name,
    quote
  });
});

// POST /authors/:id/quotes - Agregar una nueva cita a un autor
app.post('/authors/:id/quotes', (req, res) => {
  try {
    const authorId = parseInt(req.params.id);
    const { quote } = req.body;
    
    // Validar que se proporcione la cita
    if (!quote) {
      return res.status(400).json({ error: 'La cita es obligatoria' });
    }
    
    // Buscar el autor
    const authorIndex = authors.findIndex(a => a.id === authorId);
    
    if (authorIndex === -1) {
      return res.status(404).json({ error: 'Autor no encontrado' });
    }
    
    // Agregar la cita al autor
    if (!authors[authorIndex].quotes) {
      authors[authorIndex].quotes = [];
    }
    
    authors[authorIndex].quotes.push(quote);
    
    // Guardar los cambios en el archivo JSON
    data.authors = authors;
    fs.writeFileSync('./data.json', JSON.stringify(data, null, 4));
    
    // Devolver la cita creada
    res.status(201).json({ 
      authorId, 
      authorName: authors[authorIndex].name,
      quote 
    });
  } catch (error) {
    console.error('Error al agregar cita:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /quotes - Obtener todas las citas (con opción de filtrar por autor)
app.get('/quotes', (req, res) => {
  try {
    const authorId = req.query.authorId ? parseInt(req.query.authorId) : null;
    let quotesList = [];
    
    authors.forEach(author => {
      if (author.quotes && author.quotes.length > 0) {
        // Si se especificó un autor, filtrar solo por ese autor
        if (authorId === null || author.id === authorId) {
          author.quotes.forEach(quote => {
            quotesList.push({
              authorId: author.id,
              authorName: author.name,
              quote
            });
          });
        }
      }
    });
    
    res.json(quotesList);
  } catch (error) {
    console.error('Error al obtener citas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Ruta para la página principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`API escuchando en http://localhost:${PORT}`);
});

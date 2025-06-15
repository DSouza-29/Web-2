const express = require('express');
const cors = require('cors');

const app = express();
const PORTA = 3000;


app.use(cors());
app.use(express.json());


let filmes = [];
let proximoId = 1;


app.get('/filmes', (req, res) => {
    const { titulo } = req.query; 

    if (titulo) {
        const filmesFiltrados = filmes.filter(
            f => f.titulo.toLowerCase().includes(titulo.toLowerCase())
        );
        res.status(200).json(filmesFiltrados);
    } else {
        res.status(200).json(filmes);
    }
});


app.get('/filmes/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const filme = filmes.find(f => f.id === id);

    if (!filme) {
        return res.status(404).json({ message: "Filme não encontrado." });
    }

    res.status(200).json(filme);
});


app.post('/filmes', (req, res) => {
    const { titulo, genero, nota } = req.body;

    if (!titulo || !genero || nota === undefined) {
        return res.status(400).json({ message: "Título, gênero e nota são obrigatórios."});
    }

    if (nota < 0 || nota > 10) {
        return res.status(400).json({ message: "A nota deve ser entre 0 e 10." });
    }

    const novoFilme = { id: proximoId++, titulo, genero, nota };
    filmes.push(novoFilme);
    res.status(201).json(novoFilme);
});


app.put('/filmes/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const { titulo, genero, nota } = req.body;

    if (nota !== undefined && (nota < 0 || nota > 10)) {
        return res.status(400).json({ message: "A nota deve ser entre 0 e 10." });
    }

    const index = filmes.findIndex(f => f.id === id);
    if (index === -1) {
        return res.status(404).json({ message: "Filme não encontrado." });
    }

    filmes[index].titulo = titulo || filmes[index].titulo;
    filmes[index].genero = genero || filmes[index].genero;
    filmes[index].nota = nota !== undefined ? nota : filmes[index].nota;

    res.status(200).json(filmes[index]);
});


app.delete('/filmes/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = filmes.findIndex(f => f.id === id);

    if (index === -1) {
        return res.status(404).json({ message: "Filme não encontrado." });
    }

    filmes.splice(index, 1);
    res.status(204).send();
});


app.listen(PORTA, () => {
    console.log(`Servidor rodando em http://localhost:${PORTA}`);
});
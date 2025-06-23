
const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');  
 
const app = express();
const PORTA = 3000;  
const DB_NAME = 'filmes.db';  
 
const db = new Database(DB_NAME, { verbose: console.log });

 
db.exec(`
    CREATE TABLE IF NOT EXISTS filmes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo TEXT NOT NULL,
        genero TEXT NOT NULL,
        nota REAL NOT NULL
    )
`);

 
app.use(cors());
 
app.use(express.json());

 
app.get('/filmes', (req, res) => {
    const { titulo } = req.query; //  
    let query = 'SELECT * FROM filmes';  
    let params = []; 

 
    if (titulo) {
        query += ' WHERE lower(titulo) LIKE ?';
        params.push(`%${titulo.toLowerCase()}%`);
    }

    try {
        
        const filmes = db.prepare(query).all(params);
        res.status(200).json(filmes);  
    } catch (err) {
        
        console.error('Erro ao buscar filmes:', err.message);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar filmes.' });
    }
});

 
app.get('/filmes/:id', (req, res) => {
    const id = parseInt(req.params.id);  

    try {
         
        const stmt = db.prepare('SELECT * FROM filmes WHERE id = ?');
        
        const filme = stmt.get(id);

         
        if (!filme) {
            return res.status(404).json({ message: "Filme não encontrado." });
        }
        res.status(200).json(filme); 
    } catch (err) {
        console.error('Erro ao buscar filme por ID:', err.message);
        res.status(500).json({ message: 'Erro interno do servidor ao buscar filme.' });
    }
});

 
app.post('/filmes', (req, res) => {
    const { titulo, genero, nota } = req.body; 
     
    if (!titulo || !genero || nota === undefined) {
        return res.status(400).json({ message: "Título, gênero e nota são obrigatórios." });
    }

 
    if (nota < 0 || nota > 10) {
        return res.status(400).json({ message: "A nota deve ser entre 0 e 10." });
    }

    try {
         
        const stmt = db.prepare('INSERT INTO filmes (titulo, genero, nota) VALUES (?, ?, ?)');
     

        const info = stmt.run(titulo, genero, nota);
      
        const novoFilme = { id: info.lastInsertRowid, titulo, genero, nota };
        res.status(201).json(novoFilme); 
    } catch (err) {
        console.error('Erro ao adicionar filme:', err.message);
        res.status(500).json({ message: 'Erro interno do servidor ao adicionar filme.' });
    }
});

 

app.put('/filmes/:id', (req, res) => {
    const id = parseInt(req.params.id);  
    const { titulo, genero, nota } = req.body;  

 
    if (nota !== undefined && (nota < 0 || nota > 10)) {
        return res.status(400).json({ message: "A nota deve ser entre 0 e 10." });
    }

    try {
       
        const existingFilme = db.prepare('SELECT * FROM filmes WHERE id = ?').get(id);
        if (!existingFilme) {
            return res.status(404).json({ message: "Filme não encontrado para atualização." });
        }

       
        let updates = [];  
        let params = [];  

        if (titulo !== undefined) {
            updates.push('titulo = ?');
            params.push(titulo);
        }
        if (genero !== undefined) {
            updates.push('genero = ?');
            params.push(genero);
        }
        if (nota !== undefined) {
            updates.push('nota = ?');
            params.push(nota);
        }

         
        if (updates.length === 0) {
            return res.status(400).json({ message: "Nenhum dado para atualizar fornecido." });
        }

        params.push(id); 


        const stmt = db.prepare(`UPDATE filmes SET ${updates.join(', ')} WHERE id = ?`);
        const info = stmt.run(params);


        if (info.changes === 0) {
            return res.status(200).json({ message: "Nenhuma alteração foi feita, dados idênticos." });
        }

        const filmeAtualizado = db.prepare('SELECT * FROM filmes WHERE id = ?').get(id);
        res.status(200).json(filmeAtualizado); // Retorna o filme atualizado
    } catch (err) {
        console.error('Erro ao atualizar filme:', err.message);
        res.status(500).json({ message: 'Erro interno do servidor ao atualizar filme.' });
    }
});


app.delete('/filmes/:id', (req, res) => {
    const id = parseInt(req.params.id); 

    try {
        
        const stmt = db.prepare('DELETE FROM filmes WHERE id = ?');
        const info = stmt.run(id);

        
        if (info.changes === 0) {
            return res.status(404).json({ message: "Filme não encontrado para exclusão." });
        }
        res.status(204).send(); 
    } catch (err) {
        console.error('Erro ao deletar filme:', err.message);
        res.status(500).json({ message: 'Erro interno do servidor ao deletar filme.' });
    }
});


app.listen(PORTA, () => {
    console.log(`Servidor rodando em http://localhost:${PORTA}`);
});


process.on('SIGINT', () => {
    db.close();
    console.log('Banco de dados fechado.');
    process.exit(0);
});

const express = require('express');
const session = require('express-session');
const cors = require('cors');
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3001; 
const DB_PATH = path.resolve(__dirname, '../database.sqlite');

let db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Error connecting to SQLite database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
        db.run(`CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            senha TEXT NOT NULL,
            papel TEXT DEFAULT 'user'
        );`, (err) => {
            if (err) {
                console.error("Error creating 'usuarios' table:", err.message);
            } else {
                console.log("Table 'usuarios' checked/created.");
                db.get("SELECT COUNT(*) as count FROM usuarios WHERE papel = 'admin'", async (err, row) => {
                    if (err) {
                        console.error("Error checking for admin:", err.message);
                        return;
                    }
                    if (row.count === 0) {
                        const adminEmail = 'admin@exemplo.com';
                        const adminSenhaHash = await bcrypt.hash('123456', 10);
                        db.run("INSERT INTO usuarios (email, senha, papel) VALUES (?, ?, ?)",
                            [adminEmail, adminSenhaHash, 'admin'],
                            function(err) {
                                if (err) {
                                    console.error("Error inserting default admin:", err.message);
                                } else {
                                    console.log(`Default admin user '${adminEmail}' created.`);
                                }
                            }
                        );
                    }
                });
            }
        });

        db.run(`CREATE TABLE IF NOT EXISTS filmes_series (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            titulo TEXT NOT NULL,
            genero TEXT,
            nota REAL
        );`, (err) => {
            if (err) {
                console.error("Error creating 'filmes_series' table:", err.message);
            } else {
                console.log("Table 'filmes_series' checked/created.");
            }
        });
    }
});

app.use(cors({
    origin: 'http://localhost:3000', 
    credentials: true
}));
app.use(express.json());

app.use(session({
    secret: 'sua_chave_secreta_muito_segura', 
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 
    }
}));

const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.usuario) {
        return next();
    }
    return res.status(401).json({ message: 'Não autorizado. Faça login para acessar.' });
};

const authorizeRole = (requiredRole) => {
    return (req, res, next) => {
        if (req.session && req.session.usuario && req.session.usuario.papel === requiredRole) {
            return next();
        }
        return res.status(403).json({ message: `Acesso negado. Você não tem permissão de '${requiredRole}'.` });
    };
};

app.get('/', (req, res) => {
    res.send(`
        <h1>Backend Server is Running!</h1>
        <p>Use the frontend to test user registration, login, and movie catalog management.</p>
        <p>Available Routes:</p>
        <ul>
            <li>POST /register</li>
            <li>POST /login</li>
            <li>POST /logout</li>
            <li>GET /session</li>
            <li>GET /api/filmes-series (Protected)</li>
            <li>POST /api/filmes-series (Protected)</li>
            <li>PUT /api/filmes-series/:id (Protected)</li>
            <li>DELETE /api/filmes-series/:id (Protected - Admin only)</li>
            <li>GET /api/filmes-series/search?q=... (Protected)</li>
        </ul>
    `);
});

app.post('/register', async (req, res) => {
    const { email, senha, papel } = req.body;
    if (!email || !senha) {
        return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
    }
    try {
        const hashedPassword = await bcrypt.hash(senha, 10);
        db.run("INSERT INTO usuarios (email, senha, papel) VALUES (?, ?, ?)",
            [email, hashedPassword, papel || 'user'],
            function(err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed')) {
                        return res.status(409).json({ message: 'Este email já está cadastrado.' });
                    }
                    console.error('Error registering user:', err.message);
                    return res.status(500).json({ message: 'Erro interno do servidor ao registrar usuário.' });
                }
                res.status(201).json({ message: 'Usuário cadastrado com sucesso!', userId: this.lastID });
            }
        );
    } catch (error) {
        console.error('Error hashing password:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

app.post('/login', (req, res) => {
    const { email, senha } = req.body;
    if (!email || !senha) {
        return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
    }
    db.get("SELECT * FROM usuarios WHERE email = ?", [email], async (err, user) => {
        if (err) {
            console.error('Error fetching user:', err.message);
            return res.status(500).json({ message: 'Erro interno do servidor.' });
        }
        if (!user) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }
        const isMatch = await bcrypt.compare(senha, user.senha);
        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }
        req.session.usuario = {
            id: user.id,
            email: user.email,
            papel: user.papel
        };
        res.status(200).json({ message: 'Login bem-sucedido!', user: { id: user.id, email: user.email, papel: user.papel } });
    });
});

app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).json({ message: 'Erro ao fazer logout.' });
        }
        res.clearCookie('connect.sid');
        res.status(200).json({ message: 'Logout bem-sucedido!' });
    });
});

app.get('/session', (req, res) => {
    if (req.session && req.session.usuario) {
        res.status(200).json({
            loggedIn: true,
            usuario: {
                id: req.session.usuario.id,
                email: req.session.usuario.email,
                papel: req.session.usuario.papel
            }
        });
    } else {
        res.status(200).json({ loggedIn: false });
    }
});


app.get('/api/filmes-series', isAuthenticated, (req, res) => {
    db.all("SELECT * FROM filmes_series", [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ data: rows });
    });
});

app.get('/api/filmes-series/search', isAuthenticated, (req, res) => {
    const query = req.query.q;
    if (!query) {
        return res.status(400).json({ message: 'O parâmetro de busca (q) é obrigatório.' });
    }
    const searchTerm = `%${query}%`;
    db.all("SELECT * FROM filmes_series WHERE titulo LIKE ?", [searchTerm], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ data: rows });
    });
});

app.post('/api/filmes-series', isAuthenticated, (req, res) => {
    const { titulo, genero, nota } = req.body;
    if (!titulo || !genero || nota === undefined) {
        return res.status(400).json({ message: "Título, gênero e nota são obrigatórios." });
    }
    db.run("INSERT INTO filmes_series (titulo, genero, nota) VALUES (?, ?, ?)",
        [titulo, genero, nota],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.status(201).json({ message: "Filme/Série adicionado com sucesso!", id: this.lastID });
        }
    );
});

app.put('/api/filmes-series/:id', isAuthenticated, (req, res) => {
    const { id } = req.params;
    const { titulo, genero, nota } = req.body;
    if (!titulo || !genero || nota === undefined) {
        return res.status(400).json({ message: "Título, gênero e nota são obrigatórios para atualização." });
    }
    db.run("UPDATE filmes_series SET titulo = ?, genero = ?, nota = ? WHERE id = ?",
        [titulo, genero, nota, id],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            if (this.changes === 0) {
                return res.status(404).json({ message: "Filme/Série não encontrado." });
            }
            res.json({ message: "Filme/Série atualizado com sucesso!" });
        }
    );
});

app.delete('/api/filmes-series/:id', isAuthenticated, authorizeRole('admin'), (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM filmes_series WHERE id = ?", id, function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: "Filme/Série não encontrado." });
        }
        res.json({ message: "Filme/Série deletado com sucesso!" });
    });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});

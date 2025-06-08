const express = require('express');
const app = express();
const port = 3000;

app.get('/produto', (req, res) => {
  const id = req.query.id;

  if (id === '1') {
    res.json({ nome: "Mouse", preco: 100 });
  } else if (id === '2') {
    res.json({ nome: "Teclado", preco: 200 });
  } else {
    res.status(404).send("Produto não encontrado");
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});

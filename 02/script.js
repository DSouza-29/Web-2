const display = document.getElementById('display');
const botoes = document.querySelectorAll('.btn');

let expressaoAtual = "";

function atualizarDisplay() {
  display.value = expressaoAtual;
}

function adicionarValor(valor) {
  const ultimoCaractere = expressaoAtual.slice(-1);

  if (
    ['+', '-', '*', '/'].includes(valor) &&
    ['+', '-', '*', '/'].includes(ultimoCaractere)
  ) {
    expressaoAtual = expressaoAtual.slice(0, -1) + valor;
  } else {
    expressaoAtual += valor;
  }
  atualizarDisplay();
}

function limparDisplay() {
  expressaoAtual = "";
  atualizarDisplay();
}

function calcularResultado() {
  try {
    if (/^[0-9+\-*/. ]+$/.test(expressaoAtual)) {
      const resultado = eval(expressaoAtual);
      expressaoAtual = resultado.toString();
      atualizarDisplay();
    } else {
      display.value = "Erro";
      expressaoAtual = "";
    }
  } catch (erro) {
    display.value = "Erro";
    expressaoAtual = "";
  }
}

function lidarComClique(evento) {
  const botao = evento.target.closest('button');
  if (!botao) return;

  const valor = botao.getAttribute('data-value');

  if (botao.classList.contains('numero') || botao.classList.contains('operador')) {
    adicionarValor(valor);
  } else if (botao.classList.contains('limpar')) {
    limparDisplay();
  } else if (botao.classList.contains('igual')) {
    calcularResultado();
  }
}

botoes.forEach(botao => {
  botao.addEventListener('click', lidarComClique);
});

let contador = 1;

document.getElementById("botao").addEventListener("click", () =>{
    contador++;
    document.getElementById("contador").innerText = contador;
});
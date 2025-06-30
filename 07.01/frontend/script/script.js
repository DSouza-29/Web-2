wdocument.addEventListener('DOMContentLoaded', () => {
   const API_URL = 'http://localhost:3001/api/filmes-series';

    const form = document.getElementById('filme-form');
    const filmeIdInput = document.getElementById('filme-id');
    const tituloInput = document.getElementById('titulo');
    const generoInput = document.getElementById('genero');
    const notaInput = document.getElementById('nota');
    const btnCadastrar = form.querySelector('.btn-add');
    const btnAtualizar = document.getElementById('btn-atualizar');
    const btnCancelar = document.getElementById('btn-cancelar');
    

    const listaFilmes = document.getElementById('lista-filmes');
    const buscaForm = document.getElementById('busca-form');
    const buscaInput = document.getElementById('busca-input');


    function renderizarFilmes(filmes) {
        listaFilmes.innerHTML = ''; 

        if (filmes.length === 0) {
            listaFilmes.innerHTML = '<p>Nenhum filme encontrado.</p>';
            return;
        }

        filmes.forEach(filme => {
            const item = document.createElement('div');
            item.className = 'filme-item';
            item.innerHTML = `
                <div class="filme-info">
                    <strong>${filme.titulo}</strong> (ID: ${filme.id}) <br>
                    Gênero: ${filme.genero} - Nota: ${filme.nota}
                </div>
                <div class="filme-actions">
                    <button class="btn-edit" onclick="prepararEdicao(${filme.id})">Editar</button>
                    <button class="btn-delete" onclick="deletarFilme(${filme.id})">Excluir</button>
                </div>
            `;
            listaFilmes.appendChild(item);
        });
    }

 
    async function carregarTodosFilmes() {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error('Erro ao buscar filmes');
            const filmes = await response.json();
            renderizarFilmes(filmes);
        } catch (error) {
            listaFilmes.innerHTML = `<p style="color: red;">${error.message}</p>`;
        }
    }


    async function buscarFilmePorNome(event) {
        event.preventDefault();
        const termoBusca = buscaInput.value;

        if (!termoBusca) {
            carregarTodosFilmes();
            return;
        }

        try {
            const response = await fetch(`${API_URL}?titulo=${encodeURIComponent(termoBusca)}`);
            if (!response.ok) throw new Error('Falha ao buscar filmes.');
            
            const filmesFiltrados = await response.json();
            renderizarFilmes(filmesFiltrados);

        } catch (error) {
            alert(`Erro: ${error.message}`);
        }
    }

    function resetarFormulario() {
        form.reset();
        filmeIdInput.value = '';
        btnAtualizar.style.display = 'none';
        btnCancelar.style.display = 'none';
        btnCadastrar.style.display = 'block';
    }

    window.prepararEdicao = async function(id) {
        try {
            const response = await fetch(`${API_URL}/${id}`);
            if (!response.ok) throw new Error('Filme não encontrado para edição.');
            const filme = await response.json();
            filmeIdInput.value = filme.id;
            tituloInput.value = filme.titulo;
            generoInput.value = filme.genero;
            notaInput.value = filme.nota;
            btnCadastrar.style.display = 'none';
            btnAtualizar.style.display = 'block';
            btnCancelar.style.display = 'block';
            window.scrollTo(0, 0);
        } catch (error) {
            alert(error.message);
        }
    };

    window.deletarFilme = async function(id) {
        if (confirm(`Tem certeza que deseja excluir o filme com ID ${id}?`)) {
            try {
                const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
                if (!response.ok && response.status !== 204) throw new Error('Falha ao excluir o filme.');
                await carregarTodosFilmes();
            } catch (error) {
                alert(error.message);
            }
        }
    };

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const id = filmeIdInput.value;
        const filmeData = {
            titulo: tituloInput.value,
            genero: generoInput.value,
            nota: parseFloat(notaInput.value)
        };
        const method = id ? 'PUT' : 'POST';
        const url = id ? `${API_URL}/${id}` : API_URL;
        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(filmeData)
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Ocorreu um erro.');
            }
            resetarFormulario();
            await carregarTodosFilmes();
        } catch (error) {
            alert(`Erro: ${error.message}`);
        }
    });

    btnCancelar.addEventListener('click', resetarFormulario);
    
    buscaForm.addEventListener('submit', buscarFilmePorNome);
    
    carregarTodosFilmes();
});
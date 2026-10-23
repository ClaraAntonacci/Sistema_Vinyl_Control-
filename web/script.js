const API_BASE_URL = 'http://localhost:3000';

let token = localStorage.getItem('vinyl_token') || null;
let usuarioLogado = null;
let discoEmEdicaoId = null;

try {
    usuarioLogado = JSON.parse(localStorage.getItem('vinyl_user')) || null;
} catch (erro) {
    localStorage.removeItem('vinyl_user');
}

const telaLogin = document.getElementById('tela-login');
const telaPrincipal = document.getElementById('tela-principal');
const telaDiscos = document.getElementById('tela-discos');
const telaAcervo = document.getElementById('tela-acervo');
const usuarioLogadoNome = document.getElementById('usuario-logado-nome');
const btnLogout = document.getElementById('btn-logout');

function alternarTela(telaVisivel) {
    const telas = [telaLogin, telaPrincipal, telaDiscos, telaAcervo];

    telas.forEach(tela => {
        if (tela) {
            tela.style.display = 'none';
        }
    });

    if (telaVisivel) {
        telaVisivel.style.display = 'block';
    }
}

function verificarAutenticacao() {
    if (token && usuarioLogado) {
        if (usuarioLogadoNome) {
            usuarioLogadoNome.textContent = usuarioLogado.nome || '';
        }

        alternarTela(telaPrincipal);
    } else {
        localStorage.removeItem('vinyl_token');
        localStorage.removeItem('vinyl_user');

        token = null;
        usuarioLogado = null;

        alternarTela(telaLogin);
    }
}

function cabecalhosAutenticacao() {
    return {
        'Authorization': `Bearer ${token}`
    };
}

async function lerResposta(response) {
    const texto = await response.text();

    if (!texto) {
        return {};
    }

    try {
        return JSON.parse(texto);
    } catch (erro) {
        throw new Error(
            `O servidor retornou uma resposta inválida. Código HTTP: ${response.status}`
        );
    }
}

function mostrarMensagemTabela(mensagem) {
    const tbody = document.getElementById('tabela-discos-body');

    if (!tbody) return;

    tbody.innerHTML = '';

    const tr = document.createElement('tr');
    const td = document.createElement('td');

    td.colSpan = 9;
    td.textContent = mensagem;

    tr.appendChild(td);
    tbody.appendChild(tr);
}

function mostrarErro(erro) {
    console.error(erro);
    alert(erro.message || 'Ocorreu um erro inesperado.');
}

function sair() {
    token = null;
    usuarioLogado = null;

    localStorage.removeItem('vinyl_token');
    localStorage.removeItem('vinyl_user');

    verificarAutenticacao();
}

async function fazerLogin(event) {
    event.preventDefault();

    const email = document.getElementById('login-email').value.trim();
    const senha = document.getElementById('login-senha').value;
    const botao = document.querySelector('#form-login button[type="submit"]');

    if (botao) {
        botao.disabled = true;
        botao.textContent = 'Entrando...';
    }

    try {
        const response = await fetch(`${API_BASE_URL}/usuarios/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, senha })
        });

        const dados = await lerResposta(response);

        if (!response.ok) {
            throw new Error(
                dados.mensagem || `Falha no login. Código HTTP: ${response.status}`
            );
        }

        if (!dados.token || !dados.usuario) {
            throw new Error('O servidor não retornou o token e os dados do usuário.');
        }

        token = dados.token;
        usuarioLogado = dados.usuario;

        localStorage.setItem('vinyl_token', token);
        localStorage.setItem('vinyl_user', JSON.stringify(usuarioLogado));

        verificarAutenticacao();
    } catch (erro) {
        mostrarErro(
            erro instanceof TypeError
                ? new Error(
                    'Não foi possível conectar ao backend. Verifique se o servidor está ligado, se a porta está correta e se o endereço da rota está certo.'
                )
                : erro
        );
    } finally {
        if (botao) {
            botao.disabled = false;
            botao.textContent = 'Entrar';
        }
    }
}

async function carregarTabelaDiscos(termoBusca = '') {
    const tbody = document.getElementById('tabela-discos-body');

    if (!tbody) return;

    mostrarMensagemTabela('Carregando catálogo...');

    try {
        const url = termoBusca
            ? `${API_BASE_URL}/discos/listar?termo=${encodeURIComponent(termoBusca)}`
            : `${API_BASE_URL}/discos/listar`;

        const response = await fetch(url, {
            headers: cabecalhosAutenticacao()
        });

        const discos = await lerResposta(response);

        if (!response.ok) {
            throw new Error(discos.mensagem || 'Erro ao carregar os discos.');
        }

        if (!Array.isArray(discos)) {
            throw new Error('A API não retornou uma lista válida de discos.');
        }

        tbody.innerHTML = '';

        if (discos.length === 0) {
            mostrarMensagemTabela('Nenhum disco encontrado.');
            return;
        }

        discos.forEach(disco => {
            const tr = document.createElement('tr');

            if (
                Number(disco.quantidadeEstoque) <=
                Number(disco.estoqueMinimo)
            ) {
                tr.style.backgroundColor = '#ffebe6';
                tr.style.color = '#cc3300';
            }

            const valores = [
                disco.id,
                disco.titulo,
                disco.artista,
                disco.genero,
                `R$ ${Number(disco.precoCusto).toFixed(2)}`,
                `R$ ${Number(disco.precoVenda).toFixed(2)}`,
                disco.quantidadeEstoque,
                disco.estoqueMinimo
            ];

            valores.forEach(valor => {
                const td = document.createElement('td');
                td.textContent = valor ?? '';
                tr.appendChild(td);
            });

            const tdAcoes = document.createElement('td');

            const btnEditar = document.createElement('button');
            btnEditar.type = 'button';
            btnEditar.className = 'btn-editar-row';
            btnEditar.dataset.id = disco.id;
            btnEditar.textContent = 'Editar';

            const btnExcluir = document.createElement('button');
            btnExcluir.type = 'button';
            btnExcluir.className = 'btn-excluir-row';
            btnExcluir.dataset.id = disco.id;
            btnExcluir.textContent = 'Excluir';

            tdAcoes.append(
                btnEditar,
                document.createTextNode(' '),
                btnExcluir
            );

            tr.appendChild(tdAcoes);
            tbody.appendChild(tr);
        });

        configurarAcoesTabela();
    } catch (erro) {
        mostrarErro(erro);
        mostrarMensagemTabela(erro.message);
    }
}

async function salvarDisco(event) {
    event.preventDefault();

    const dadosDisco = {
        titulo: document.getElementById('disco-titulo').value.trim(),
        artista: document.getElementById('disco-artista').value.trim(),
        genero: document.getElementById('disco-genero').value.trim(),
        precoCusto: Number(document.getElementById('disco-custo').value),
        precoVenda: Number(document.getElementById('disco-venda').value),
        quantidadeEstoque: Number(document.getElementById('disco-qtd').value),
        estoqueMinimo: Number(document.getElementById('disco-min').value)
    };

    const url = discoEmEdicaoId
        ? `${API_BASE_URL}/discos/editar/${discoEmEdicaoId}`
        : `${API_BASE_URL}/discos/cadastrar`;

    const metodo = discoEmEdicaoId ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: metodo,
            headers: {
                'Content-Type': 'application/json',
                ...cabecalhosAutenticacao()
            },
            body: JSON.stringify(dadosDisco)
        });

        const resposta = await lerResposta(response);

        if (!response.ok) {
            throw new Error(resposta.mensagem || 'Erro ao salvar o disco.');
        }

        alert(resposta.mensagem || 'Disco salvo com sucesso.');

        document.getElementById('form-disco').reset();
        document.getElementById('disco-id').value = '';
        discoEmEdicaoId = null;

        await carregarTabelaDiscos();
    } catch (erro) {
        mostrarErro(erro);
    }
}

function configurarAcoesTabela() {
    document.querySelectorAll('.btn-editar-row').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.id;

            try {
                const response = await fetch(
                    `${API_BASE_URL}/discos/buscar/${id}`,
                    { headers: cabecalhosAutenticacao() }
                );

                const dados = await lerResposta(response);

                if (!response.ok) {
                    throw new Error(dados.mensagem || 'Não foi possível buscar o disco.');
                }

                const disco = dados.disco || dados;
                discoEmEdicaoId = disco.id;

                document.getElementById('disco-id').value = disco.id;
                document.getElementById('disco-titulo').value = disco.titulo;
                document.getElementById('disco-artista').value = disco.artista;
                document.getElementById('disco-genero').value = disco.genero;
                document.getElementById('disco-custo').value = disco.precoCusto;
                document.getElementById('disco-venda').value = disco.precoVenda;
                document.getElementById('disco-qtd').value = disco.quantidadeEstoque;
                document.getElementById('disco-min').value = disco.estoqueMinimo;

                alternarTela(telaDiscos);

                document.getElementById('form-disco').scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            } catch (erro) {
                mostrarErro(erro);
            }
        });
    });

    document.querySelectorAll('.btn-excluir-row').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.id;

            if (!confirm('Deseja realmente remover este disco?')) return;

            try {
                const response = await fetch(
                    `${API_BASE_URL}/discos/excluir/${id}`,
                    {
                        method: 'DELETE',
                        headers: cabecalhosAutenticacao()
                    }
                );

                const dados = await lerResposta(response);

                if (!response.ok) {
                    throw new Error(dados.mensagem || 'Não foi possível excluir o disco.');
                }

                alert(dados.mensagem || 'Disco excluído com sucesso.');
                await carregarTabelaDiscos();
            } catch (erro) {
                mostrarErro(erro);
            }
        });
    });
}

async function buscarDiscos() {
    const termo = document.getElementById('input-busca').value.trim();
    await carregarTabelaDiscos(termo);
}

async function carregarSeletorDiscos() {
    const select = document.getElementById('select-mov-disco');

    if (!select) return;

    select.innerHTML = '<option value="">Carregando catálogo...</option>';

    try {
        const response = await fetch(`${API_BASE_URL}/discos/listar`, {
            headers: cabecalhosAutenticacao()
        });

        const discos = await lerResposta(response);

        if (!response.ok) {
            throw new Error(discos.mensagem || 'Erro ao carregar os discos.');
        }

        if (!Array.isArray(discos)) {
            throw new Error('A API não retornou uma lista válida de discos.');
        }

        select.innerHTML = '<option value="">-- Escolha um Álbum --</option>';

        discos.forEach(disco => {
            const option = document.createElement('option');

            option.value = disco.id;
            option.textContent =
                `${disco.titulo} - ${disco.artista} (Estoque: ${disco.quantidadeEstoque})`;

            select.appendChild(option);
        });
    } catch (erro) {
        select.innerHTML = '<option value="">Erro ao carregar os discos</option>';
        mostrarErro(erro);
    }
}

async function registrarMovimentacao(event) {
    event.preventDefault();

    const dadosMovimentacao = {
        discoId: Number(document.getElementById('select-mov-disco').value),
        tipoMovimentacao: document.getElementById('select-mov-tipo').value,
        quantidade: Number(document.getElementById('input-mov-qtd').value),
        dataMovimentacao: document.getElementById('input-mov-data').value
    };

    if (!dadosMovimentacao.discoId) {
        alert('Selecione um disco.');
        return;
    }

    if (
        !Number.isInteger(dadosMovimentacao.quantidade) ||
        dadosMovimentacao.quantidade <= 0
    ) {
        alert('Informe uma quantidade inteira maior que zero.');
        return;
    }

    if (!dadosMovimentacao.dataMovimentacao) {
        alert('Informe a data da movimentação.');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/movimentacoes/cadastrar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...cabecalhosAutenticacao()
            },
            body: JSON.stringify(dadosMovimentacao)
        });

        const resposta = await lerResposta(response);

        if (!response.ok) {
            throw new Error(
                resposta.mensagem || 'Erro ao registrar a movimentação.'
            );
        }

        if (resposta.alerta || resposta.estoqueAbaixoDoMinimo) {
            alert(
                `⚠️ ALERTA DE ESTOQUE!\n\n${
                    resposta.alerta || 'O estoque ficou abaixo do mínimo.'
                }`
            );
        } else {
            alert(resposta.mensagem || 'Movimentação registrada com sucesso.');
        }

        document.getElementById('form-movimentacao').reset();
        await carregarSeletorDiscos();
    } catch (erro) {
        mostrarErro(erro);
    }
}

function configurarEventos() {
    const formularioLogin = document.getElementById('form-login');
    const formularioDisco = document.getElementById('form-disco');
    const formularioMovimentacao = document.getElementById('form-movimentacao');
    const btnNavDiscos = document.getElementById('btn-nav-discos');
    const btnNavAcervo = document.getElementById('btn-nav-acervo');
    const btnBuscar = document.getElementById('btn-buscar');
    const inputBusca = document.getElementById('input-busca');

    if (formularioLogin) {
        formularioLogin.addEventListener('submit', fazerLogin);
    }

    if (formularioDisco) {
        formularioDisco.addEventListener('submit', salvarDisco);
    }

    if (formularioMovimentacao) {
        formularioMovimentacao.addEventListener('submit', registrarMovimentacao);
    }

    if (btnNavDiscos) {
        btnNavDiscos.addEventListener('click', () => {
            alternarTela(telaDiscos);
            carregarTabelaDiscos();
        });
    }

    if (btnNavAcervo) {
        btnNavAcervo.addEventListener('click', () => {
            alternarTela(telaAcervo);
            carregarSeletorDiscos();
        });
    }

    document.querySelectorAll('.btn-voltar').forEach(btn => {
        btn.addEventListener('click', () => alternarTela(telaPrincipal));
    });

    if (btnLogout) {
        btnLogout.addEventListener('click', sair);
    }

    if (btnBuscar) {
        btnBuscar.addEventListener('click', buscarDiscos);
    }

    if (inputBusca) {
        inputBusca.addEventListener('keydown', event => {
            if (event.key === 'Enter') {
                event.preventDefault();
                buscarDiscos();
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    configurarEventos();
    verificarAutenticacao();
});
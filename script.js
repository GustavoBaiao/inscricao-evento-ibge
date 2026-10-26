const selectEstado = document.getElementById('estado');
const mensagemErro = document.getElementById('mensagemErro');

const URL_ESTADOS = 'https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome';

function carregarEstados() {
    selectEstado.disabled = true;
    mensagemErro.textContent = '';
    mensagemErro.hidden = true;

    fetch(URL_ESTADOS)
        .then(resposta => {
            if (!resposta.ok) {
                throw new Error('Erro ao consultar os estados.');
            }

            return resposta.json();
        })
        .then(estados => {
            selectEstado.innerHTML = '<option value="">Selecione o estado</option>';

            estados.forEach(estado => {
                const opcao = document.createElement('option');
                opcao.value = estado.sigla;
                opcao.textContent = estado.nome;
                selectEstado.appendChild(opcao);
            });

            selectEstado.disabled = false;
        })
        .catch(() => {
            selectEstado.innerHTML = '<option value="">Estados indisponíveis</option>';
            mensagemErro.textContent = 'Não foi possível carregar os estados. Recarregue a página para tentar novamente.';
            mensagemErro.hidden = false;
        });
}

carregarEstados();

const selectCidade = document.getElementById('cidade');
const qtdCidades = document.getElementById('qtdCidades');
const pesquisaCidade = document.getElementById('pesquisaCidade');
let cidadesDoEstado = [];
let consultaCidadesAtual = 0;

selectEstado.addEventListener('change', () => {
    const uf = selectEstado.value;
    const numeroConsulta = ++consultaCidadesAtual;

    cidadesDoEstado = [];
    pesquisaCidade.value = '';
    pesquisaCidade.disabled = true;
    selectCidade.disabled = true;
    selectCidade.innerHTML = '<option value="">Escolha um estado primeiro</option>';
    qtdCidades.textContent = '';
    mensagemErro.textContent = '';
    mensagemErro.hidden = true;

    if (uf === '') return;

    selectCidade.innerHTML = '<option value="">Carregando...</option>';

    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`)
        .then(resposta => {
            if (!resposta.ok) {
                throw new Error('Erro ao consultar as cidades.');
            }

            return resposta.json();
        })
        .then(cidades => {
            if (numeroConsulta !== consultaCidadesAtual) return;

            cidadesDoEstado = cidades;
            preencherCidades(cidadesDoEstado);
            pesquisaCidade.disabled = cidades.length === 0;
            qtdCidades.textContent = `${uf} possui ${cidades.length} cidades.`;
        })
        .catch(() => {
            if (numeroConsulta !== consultaCidadesAtual) return;

            selectCidade.innerHTML = '<option value="">Cidades indisponíveis</option>';
            mensagemErro.textContent = 'Não foi possível carregar as cidades. Selecione o estado novamente para tentar.';
            mensagemErro.hidden = false;
        });
});

const formInscricao = document.getElementById('formInscricao');
const campoNome = document.getElementById('nome');
const resumo = document.getElementById('resumo');

formInscricao.addEventListener('submit', evento => {
    evento.preventDefault();

    const nome = campoNome.value.trim();
    const cidade = selectCidade.value;
    const uf = selectEstado.value;

    resumo.textContent = '';
    mensagemErro.textContent = '';
    mensagemErro.hidden = true;

    if (nome === '') {
        mensagemErro.textContent = 'Preencha seu nome.';
        mensagemErro.hidden = false;
        campoNome.focus();
        return;
    }

    if (selectEstado.disabled || selectCidade.disabled || uf === '' || cidade === '') {
        mensagemErro.textContent = 'Selecione um estado e uma cidade antes de se inscrever.';
        mensagemErro.hidden = false;
        return;
    }

    resumo.textContent = `${nome}, de ${cidade}/${uf}, inscrito com sucesso`;
});

formInscricao.addEventListener('input', () => {
    resumo.textContent = '';
});

formInscricao.addEventListener('change', () => {
    resumo.textContent = '';
});

function normalizarTexto(texto) {
    return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function preencherCidades(cidades) {
    const cidadeSelecionada = selectCidade.value;
    const textoInicial = cidades.length === 0 ? 'Nenhuma cidade encontrada' : 'Selecione a cidade';
    selectCidade.replaceChildren(new Option(textoInicial, ''));

    cidades.forEach(cidade => {
        selectCidade.appendChild(new Option(cidade.nome, cidade.nome));
    });

    if (cidades.some(cidade => cidade.nome === cidadeSelecionada)) {
        selectCidade.value = cidadeSelecionada;
    }

    selectCidade.disabled = cidades.length === 0;
}

pesquisaCidade.addEventListener('input', () => {
    const termo = normalizarTexto(pesquisaCidade.value);
    const cidadesFiltradas = cidadesDoEstado.filter(cidade =>
        normalizarTexto(cidade.nome).includes(termo)
    );

    preencherCidades(cidadesFiltradas);
});

function limparFormulario() {
    formInscricao.reset();
    consultaCidadesAtual++;
    cidadesDoEstado = [];
    selectEstado.value = '';
    pesquisaCidade.value = '';
    pesquisaCidade.disabled = true;
    selectCidade.replaceChildren(new Option('Escolha um estado primeiro', ''));
    selectCidade.disabled = true;
    qtdCidades.textContent = '';
    resumo.textContent = '';
    mensagemErro.textContent = '';
    mensagemErro.hidden = true;
}

limparFormulario();
window.addEventListener('pageshow', limparFormulario);

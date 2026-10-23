
const prisma = require("../data/prisma");

const listarDiscos = async (req, res) => {
    try {
        const termo = typeof req.query.termo === "string"
            ? req.query.termo.trim()
            : "";

        const discos = await prisma.disco.findMany({
            where: termo
                ? {
                    OR: [
                        { titulo: { contains: termo } },
                        { artista: { contains: termo } },
                        { genero: { contains: termo } }
                    ]
                }
                : {},
            orderBy: {
                titulo: "asc"
            }
        });

        return res.status(200).json(discos);
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            mensagem: "Erro ao listar discos"
        });
    }
};

const buscarDisco = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                mensagem: "ID de disco inválido"
            });
        }

        const disco = await prisma.disco.findUnique({
            where: { id }
        });

        if (!disco) {
            return res.status(404).json({
                mensagem: "Disco não encontrado"
            });
        }

        return res.status(200).json(disco);
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            mensagem: "Erro ao buscar disco"
        });
    }
};

const validarDadosDisco = (dados) => {
    const {
        titulo,
        artista,
        genero,
        precoCusto,
        precoVenda,
        quantidadeEstoque,
        estoqueMinimo
    } = dados;

    if (
        typeof titulo !== "string" || !titulo.trim() ||
        typeof artista !== "string" || !artista.trim() ||
        typeof genero !== "string" || !genero.trim()
    ) {
        return "Título, artista e gênero são obrigatórios";
    }

    const custo = Number(precoCusto);
    const venda = Number(precoVenda);
    const estoque = Number(quantidadeEstoque);
    const minimo = Number(estoqueMinimo);

    if (
        precoCusto === "" || precoCusto === undefined ||
        !Number.isFinite(custo) || custo < 0
    ) {
        return "O preço de custo deve ser um número válido maior ou igual a zero";
    }

    if (
        precoVenda === "" || precoVenda === undefined ||
        !Number.isFinite(venda) || venda < 0
    ) {
        return "O preço de venda deve ser um número válido maior ou igual a zero";
    }

    if (
        quantidadeEstoque === "" || quantidadeEstoque === undefined ||
        !Number.isInteger(estoque) || estoque < 0
    ) {
        return "A quantidade em estoque deve ser um inteiro maior ou igual a zero";
    }

    if (
        estoqueMinimo === "" || estoqueMinimo === undefined ||
        !Number.isInteger(minimo) || minimo < 0
    ) {
        return "O estoque mínimo deve ser um inteiro maior ou igual a zero";
    }

    return null;
};

const cadastrarDisco = async (req, res) => {
    try {
        const erro = validarDadosDisco(req.body);

        if (erro) {
            return res.status(400).json({ mensagem: erro });
        }

        const {
            titulo,
            artista,
            genero,
            precoCusto,
            precoVenda,
            quantidadeEstoque,
            estoqueMinimo
        } = req.body;

        const disco = await prisma.disco.create({
            data: {
                titulo: titulo.trim(),
                artista: artista.trim(),
                genero: genero.trim(),
                precoCusto: Number(precoCusto),
                precoVenda: Number(precoVenda),
                quantidadeEstoque: Number(quantidadeEstoque),
                estoqueMinimo: Number(estoqueMinimo)
            }
        });

        return res.status(201).json({
            mensagem: "Disco cadastrado com sucesso",
            disco
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            mensagem: "Erro ao cadastrar disco"
        });
    }
};

const editarDisco = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                mensagem: "ID de disco inválido"
            });
        }

        const discoExistente = await prisma.disco.findUnique({
            where: { id }
        });

        if (!discoExistente) {
            return res.status(404).json({
                mensagem: "Disco não encontrado"
            });
        }

        const campos = [
            "titulo",
            "artista",
            "genero",
            "precoCusto",
            "precoVenda",
            "quantidadeEstoque",
            "estoqueMinimo"
        ];

        const dados = {};

        for (const campo of campos) {
            if (req.body[campo] !== undefined) {
                dados[campo] = req.body[campo];
            }
        }

        if (Object.keys(dados).length === 0) {
            return res.status(400).json({
                mensagem: "Informe ao menos um campo para alterar"
            });
        }

        const dadosCompletos = {
            titulo: discoExistente.titulo,
            artista: discoExistente.artista,
            genero: discoExistente.genero,
            precoCusto: discoExistente.precoCusto,
            precoVenda: discoExistente.precoVenda,
            quantidadeEstoque: discoExistente.quantidadeEstoque,
            estoqueMinimo: discoExistente.estoqueMinimo,
            ...dados
        };

        const erro = validarDadosDisco(dadosCompletos);

        if (erro) {
            return res.status(400).json({ mensagem: erro });
        }

        const disco = await prisma.disco.update({
            where: { id },
            data: {
                ...dados,
                ...(dados.titulo !== undefined
                    ? { titulo: dados.titulo.trim() }
                    : {}),
                ...(dados.artista !== undefined
                    ? { artista: dados.artista.trim() }
                    : {}),
                ...(dados.genero !== undefined
                    ? { genero: dados.genero.trim() }
                    : {}),
                ...(dados.precoCusto !== undefined
                    ? { precoCusto: Number(dados.precoCusto) }
                    : {}),
                ...(dados.precoVenda !== undefined
                    ? { precoVenda: Number(dados.precoVenda) }
                    : {}),
                ...(dados.quantidadeEstoque !== undefined
                    ? { quantidadeEstoque: Number(dados.quantidadeEstoque) }
                    : {}),
                ...(dados.estoqueMinimo !== undefined
                    ? { estoqueMinimo: Number(dados.estoqueMinimo) }
                    : {})
            }
        });

        return res.status(200).json({
            mensagem: "Disco atualizado com sucesso",
            disco
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            mensagem: "Erro ao editar disco"
        });
    }
};

const excluirDisco = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                mensagem: "ID de disco inválido"
            });
        }

        const disco = await prisma.disco.findUnique({
            where: { id }
        });

        if (!disco) {
            return res.status(404).json({
                mensagem: "Disco não encontrado"
            });
        }

        await prisma.disco.delete({
            where: { id }
        });

        return res.status(200).json({
            mensagem: "Disco excluído com sucesso"
        });
    } catch (error) {
        console.error(error);

        if (error.code === "P2003" || error.code === "P2014") {
            return res.status(409).json({
                mensagem: "Não é possível excluir um disco que possui movimentações registradas"
            });
        }

        return res.status(500).json({
            mensagem: "Erro ao excluir disco"
        });
    }
};

module.exports = {
    listarDiscos,
    buscarDisco,
    cadastrarDisco,
    editarDisco,
    excluirDisco
};

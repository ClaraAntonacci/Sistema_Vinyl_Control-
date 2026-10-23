
const prisma = require("../data/prisma");

const listarMovimentacoes = async (req, res) => {
    try {
        const movimentacoes =
            await prisma.movimentacaoEstoque.findMany({
                include: {
                    disco: true,
                    usuario: {
                        select: {
                            id: true,
                            nome: true,
                            email: true
                        }
                    }
                },
                orderBy: {
                    dataMovimentacao: "desc"
                }
            });

        return res.status(200).json(movimentacoes);
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            mensagem: "Erro ao listar movimentações"
        });
    }
};

const buscarMovimentacao = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                mensagem: "ID de movimentação inválido"
            });
        }

        const movimentacao =
            await prisma.movimentacaoEstoque.findUnique({
                where: { id },
                include: {
                    disco: true,
                    usuario: {
                        select: {
                            id: true,
                            nome: true,
                            email: true
                        }
                    }
                }
            });

        if (!movimentacao) {
            return res.status(404).json({
                mensagem: "Movimentação não encontrada"
            });
        }

        return res.status(200).json(movimentacao);
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            mensagem: "Erro ao buscar movimentação"
        });
    }
};

const cadastrarMovimentacao = async (req, res) => {
    try {
        const {
            tipoMovimentacao,
            quantidade,
            discoId,
            dataMovimentacao,
            observacao
        } = req.body;

        if (
            !tipoMovimentacao ||
            quantidade === undefined ||
            quantidade === "" ||
            discoId === undefined ||
            discoId === "" ||
            !dataMovimentacao
        ) {
            return res.status(400).json({
                mensagem: "Tipo, quantidade, disco e data são obrigatórios"
            });
        }

        if (
            tipoMovimentacao !== "entrada" &&
            tipoMovimentacao !== "saida"
        ) {
            return res.status(400).json({
                mensagem: "O tipo deve ser entrada ou saida"
            });
        }

        const quantidadeNumero = Number(quantidade);
        const discoIdNumero = Number(discoId);
        const usuarioIdNumero = Number(req.usuario.id);

        if (
            !Number.isInteger(quantidadeNumero) ||
            quantidadeNumero <= 0
        ) {
            return res.status(400).json({
                mensagem: "A quantidade deve ser um inteiro maior que zero"
            });
        }

        if (
            !Number.isInteger(discoIdNumero) ||
            discoIdNumero <= 0
        ) {
            return res.status(400).json({
                mensagem: "ID do disco inválido"
            });
        }

        if (
            !Number.isInteger(usuarioIdNumero) ||
            usuarioIdNumero <= 0
        ) {
            return res.status(401).json({
                mensagem: "Usuário autenticado inválido"
            });
        }

        if (
            typeof dataMovimentacao !== "string" ||
            !/^\d{4}-\d{2}-\d{2}$/.test(dataMovimentacao)
        ) {
            return res.status(400).json({
                mensagem: "A data deve estar no formato AAAA-MM-DD"
            });
        }

        const data = new Date(`${dataMovimentacao}T00:00:00.000Z`);

        if (
            Number.isNaN(data.getTime()) ||
            data.toISOString().slice(0, 10) !== dataMovimentacao
        ) {
            return res.status(400).json({
                mensagem: "Informe uma data válida"
            });
        }

        if (
            observacao !== undefined &&
            observacao !== null &&
            typeof observacao !== "string"
        ) {
            return res.status(400).json({
                mensagem: "A observação deve ser um texto"
            });
        }

        if (
            typeof observacao === "string" &&
            observacao.length > 250
        ) {
            return res.status(400).json({
                mensagem: "A observação deve ter no máximo 250 caracteres"
            });
        }

        const resultado = await prisma.$transaction(async (tx) => {
            const disco = await tx.disco.findUnique({
                where: {
                    id: discoIdNumero
                }
            });

            if (!disco) {
                const erro = new Error("Disco não encontrado");
                erro.status = 404;
                throw erro;
            }

            const usuario = await tx.usuario.findUnique({
                where: {
                    id: usuarioIdNumero
                }
            });

            if (!usuario) {
                const erro = new Error("Usuário não encontrado");
                erro.status = 401;
                throw erro;
            }

            let novoEstoque;

            if (tipoMovimentacao === "entrada") {
                novoEstoque =
                    disco.quantidadeEstoque + quantidadeNumero;
            } else {
                if (disco.quantidadeEstoque < quantidadeNumero) {
                    const erro = new Error(
                        `Estoque insuficiente. Estoque atual: ${disco.quantidadeEstoque}`
                    );
                    erro.status = 400;
                    throw erro;
                }

                novoEstoque =
                    disco.quantidadeEstoque - quantidadeNumero;
            }

            const discoAtualizado = await tx.disco.update({
                where: {
                    id: discoIdNumero
                },
                data: {
                    quantidadeEstoque: novoEstoque
                }
            });

            const movimentacao =
                await tx.movimentacaoEstoque.create({
                    data: {
                        tipoMovimentacao,
                        quantidade: quantidadeNumero,
                        dataMovimentacao: data,
                        observacao: observacao?.trim() || null,
                        discoId: discoIdNumero,
                        usuarioId: usuarioIdNumero
                    },
                    include: {
                        disco: true,
                        usuario: {
                            select: {
                                id: true,
                                nome: true,
                                email: true
                            }
                        }
                    }
                });

            return {
                movimentacao,
                discoAtualizado
            };
        });

        const estoqueAbaixoDoMinimo =
            tipoMovimentacao === "saida" &&
            resultado.discoAtualizado.quantidadeEstoque <
                resultado.discoAtualizado.estoqueMinimo;

        return res.status(201).json({
            mensagem: "Movimentação registrada com sucesso",
            movimentacao: resultado.movimentacao,
            estoqueAtual: resultado.discoAtualizado.quantidadeEstoque,
            estoqueAbaixoDoMinimo,
            alerta: estoqueAbaixoDoMinimo
                ? `Atenção: o estoque ficou abaixo do mínimo de ${resultado.discoAtualizado.estoqueMinimo} unidades`
                : null
        });
    } catch (error) {
        console.error(error);

        if (error.status) {
            return res.status(error.status).json({
                mensagem: error.message
            });
        }

        return res.status(500).json({
            mensagem: "Erro ao cadastrar movimentação"
        });
    }
};

module.exports = {
    listarMovimentacoes,
    buscarMovimentacao,
    cadastrarMovimentacao
};

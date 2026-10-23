
const prisma = require("../data/prisma");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const cadastrarUsuario = async (req, res) => {
    try {
        const { nome, email, senha } = req.body;

        if (
            typeof nome !== "string" || !nome.trim() ||
            typeof email !== "string" || !email.trim() ||
            typeof senha !== "string" || !senha
        ) {
            return res.status(400).json({
                mensagem: "Nome, email e senha são obrigatórios"
            });
        }

        const emailNormalizado = email.trim().toLowerCase();

        const existente = await prisma.usuario.findUnique({
            where: { email: emailNormalizado }
        });

        if (existente) {
            return res.status(409).json({
                mensagem: "Este email já está cadastrado"
            });
        }

        const senhaHash = crypto
            .createHash("sha256")
            .update(senha)
            .digest("hex");

        const usuario = await prisma.usuario.create({
            data: {
                nome: nome.trim(),
                email: emailNormalizado,
                senha: senhaHash
            },
            select: {
                id: true,
                nome: true,
                email: true
            }
        });

        return res.status(201).json({
            mensagem: "Usuário cadastrado com sucesso",
            usuario
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            mensagem: "Erro ao cadastrar usuário"
        });
    }
};

const listarUsuarios = async (req, res) => {
    try {
        const usuarios = await prisma.usuario.findMany({
            select: {
                id: true,
                nome: true,
                email: true
            },
            orderBy: {
                nome: "asc"
            }
        });

        return res.status(200).json(usuarios);
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            mensagem: "Erro ao listar usuários"
        });
    }
};

const buscarUsuario = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                mensagem: "ID de usuário inválido"
            });
        }

        const usuario = await prisma.usuario.findUnique({
            where: { id },
            select: {
                id: true,
                nome: true,
                email: true
            }
        });

        if (!usuario) {
            return res.status(404).json({
                mensagem: "Usuário não encontrado"
            });
        }

        return res.status(200).json(usuario);
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            mensagem: "Erro ao buscar usuário"
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, senha } = req.body;

        if (
            typeof email !== "string" || !email.trim() ||
            typeof senha !== "string" || !senha
        ) {
            return res.status(400).json({
                mensagem: "Informe o email e a senha"
            });
        }

        const usuario = await prisma.usuario.findUnique({
            where: {
                email: email.trim().toLowerCase()
            }
        });

        if (!usuario) {
            return res.status(401).json({
                mensagem: "Email ou senha inválidos"
            });
        }

        const senhaHash = crypto
            .createHash("sha256")
            .update(senha)
            .digest("hex");

        if (senhaHash !== usuario.senha) {
            return res.status(401).json({
                mensagem: "Email ou senha inválidos"
            });
        }

        if (!process.env.SECRET_JWT) {
            return res.status(500).json({
                mensagem: "A chave de autenticação não está configurada"
            });
        }

        const token = jwt.sign(
            {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email
            },
            process.env.SECRET_JWT,
            {
                expiresIn: "8h"
            }
        );

        return res.status(200).json({
            mensagem: "Login realizado com sucesso",
            token,
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email
            }
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            mensagem: "Erro ao realizar login"
        });
    }
};

module.exports = {
    cadastrarUsuario,
    listarUsuarios,
    buscarUsuario,
    login
};

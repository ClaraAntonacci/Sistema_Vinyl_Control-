
const express = require("express");

const {
    listarMovimentacoes,
    buscarMovimentacao,
    cadastrarMovimentacao
} = require("../controllers/movimentacaoEstoque.controller");

const verificarToken = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/listar", verificarToken, listarMovimentacoes);
router.get("/buscar/:id", verificarToken, buscarMovimentacao);
router.post("/cadastrar", verificarToken, cadastrarMovimentacao);

module.exports = router;

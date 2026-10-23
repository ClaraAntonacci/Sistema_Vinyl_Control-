
const express = require("express");

const {
    listarDiscos,
    buscarDisco,
    cadastrarDisco,
    editarDisco,
    excluirDisco
} = require("../controllers/disco.controller");

const verificarToken = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/listar", verificarToken, listarDiscos);
router.get("/buscar/:id", verificarToken, buscarDisco);

router.post("/cadastrar", verificarToken, cadastrarDisco);
router.put("/editar/:id", verificarToken, editarDisco);
router.delete("/excluir/:id", verificarToken, excluirDisco);

module.exports = router;

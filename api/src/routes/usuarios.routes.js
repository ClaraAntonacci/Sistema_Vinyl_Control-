
const express = require("express");

const {
    listarUsuarios,
    buscarUsuario,
    cadastrarUsuario,
    login
} = require("../controllers/usuario.controller");

const router = express.Router();

router.post("/login", login);
router.post("/cadastrar", cadastrarUsuario);

router.get("/listar", listarUsuarios);
router.get("/buscar/:id", buscarUsuario);

module.exports = router;

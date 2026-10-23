
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const usuarioRoutes = require("./src/routes/usuarios.routes");
const discoRoutes = require("./src/routes/discos.routes");
const movimentacaoEstoqueRoutes =
    require("./src/routes/movimentacoesEstoque.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.status(200).json({
        mensagem: "API Vinyl Control funcionando!"
    });
});

app.use("/usuarios", usuarioRoutes);
app.use("/discos", discoRoutes);
app.use("/movimentacoes", movimentacaoEstoqueRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor Vinyl Control rodando na porta ${PORT}`);
});

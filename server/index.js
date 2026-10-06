import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SPTransService } from "./sptrans.js";
import { MemoryCache } from "./cache.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const SPTRANS_TOKEN = process.env.SPTRANS_TOKEN || "";

// Configurações e Middlewares
app.use(cors());
app.use(express.json());

// Servir frontend estático na pasta public
app.use(express.static(path.join(__dirname, "../public")));

// Instância do cliente SPTrans e Caches
const sptrans = new SPTransService(SPTRANS_TOKEN);
// Cache de 12 segundos para posição e previsão
const cache = new MemoryCache(12);

// Inicializa a autenticação com a SPTrans
sptrans.authenticate().catch((err) => {
  console.error("[BusAqui] Falha na inicialização do serviço SPTrans:", err.message);
});

// Middleware auxiliar de tratamento de erros
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Rota de status do sistema e modo atual (demo vs oficial)
app.get("/api/status", (req, res) => {
  res.json({
    status: "online",
    time: new Date().toISOString(),
    ...sptrans.getModeInfo()
  });
});

/**
 * GET /api/linhas?q=termo
 * Mapeia para /Linha/Buscar?termosBusca=
 */
app.get(
  "/api/linhas",
  asyncHandler(async (req, res) => {
    const termo = req.query.q || "";
    const cacheKey = `linhas_${termo.trim().toLowerCase()}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const data = await sptrans.buscarLinhas(termo);
    // Cache de linhas pode durar mais (ex: 60s) pois as linhas mudam raramente
    cache.set(cacheKey, data, 60);
    res.json(data);
  })
);

/**
 * GET /api/posicao/:codigoLinha
 * Mapeia para /Posicao/Linha?codigoLinha=
 * Cache de 10-15s
 */
app.get(
  "/api/posicao/:codigoLinha",
  asyncHandler(async (req, res) => {
    const { codigoLinha } = req.params;
    const cacheKey = `posicao_${codigoLinha}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json({ ...cached, cached: true });
    }

    const data = await sptrans.buscarPosicao(codigoLinha);
    cache.set(cacheKey, data, 12);
    res.json(data);
  })
);

/**
 * GET /api/paradas?q=termo
 * Mapeia para /Parada/Buscar?termosBusca=
 */
app.get(
  "/api/paradas",
  asyncHandler(async (req, res) => {
    const termo = req.query.q || "";
    const cacheKey = `paradas_${termo.trim().toLowerCase()}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const data = await sptrans.buscarParadas(termo);
    cache.set(cacheKey, data, 60);
    res.json(data);
  })
);

/**
 * GET /api/paradas/linha/:codigoLinha
 * Mapeia para /Parada/BuscarParadasPorLinha?codigoLinha=
 */
app.get(
  "/api/paradas/linha/:codigoLinha",
  asyncHandler(async (req, res) => {
    const { codigoLinha } = req.params;
    const cacheKey = `paradas_linha_${codigoLinha}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const data = await sptrans.buscarParadasPorLinha(codigoLinha);
    cache.set(cacheKey, data, 60);
    res.json(data);
  })
);

/**
 * GET /api/previsao/parada/:codigoParada
 * Mapeia para /Previsao/Parada?codigoParada=
 * Cache de 12s
 */
app.get(
  "/api/previsao/parada/:codigoParada",
  asyncHandler(async (req, res) => {
    const { codigoParada } = req.params;
    const cacheKey = `prev_parada_${codigoParada}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json({ ...cached, cached: true });
    }

    const data = await sptrans.buscarPrevisaoParada(codigoParada);
    cache.set(cacheKey, data, 12);
    res.json(data);
  })
);

/**
 * GET /api/previsao/linha/:codigoLinha
 * Mapeia para /Previsao/Linha?codigoLinha=
 * Cache de 12s
 */
app.get(
  "/api/previsao/linha/:codigoLinha",
  asyncHandler(async (req, res) => {
    const { codigoLinha } = req.params;
    const cacheKey = `prev_linha_${codigoLinha}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json({ ...cached, cached: true });
    }

    const data = await sptrans.buscarPrevisaoLinha(codigoLinha);
    cache.set(cacheKey, data, 12);
    res.json(data);
  })
);

// Tratamento de erro 404
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "Endpoint não encontrado" });
  }
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// Middleware global de erro
app.use((err, req, res, next) => {
  console.error("[BusAqui Erro]", err.stack || err.message);
  res.status(500).json({
    error: "Erro interno no servidor ou na comunicação com a SPTrans.",
    message: err.message
  });
});

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚌 SeuBusAqui - Sistema de Ônibus em Tempo Real`);
  console.log(`🌐 Servidor rodando em: http://localhost:${PORT}`);
  console.log(`⚙️  Status SPTrans: ${sptrans.getModeInfo().message}`);
  console.log(`===============================================`);
});

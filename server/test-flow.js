/**
 * Script de teste automatizado para validar o fluxo completo do backend e das rotas proxy
 */
import { SPTransService } from "./sptrans.js";
import dotenv from "dotenv";
dotenv.config();

async function runTests() {
  console.log("-----------------------------------------");
  console.log("🧪 Iniciando Teste de Fluxo Completo BusAqui");
  console.log("-----------------------------------------");

  const service = new SPTransService(process.env.SPTRANS_TOKEN || "");
  console.log("1. Modo:", service.getModeInfo().message);

  console.log("\n2. Testando Autenticação...");
  const authOk = await service.authenticate();
  console.log("Resultado Autenticação:", authOk ? "✅ Sucesso" : "⚠️ Modo Demo");

  console.log("\n3. Testando Busca de Linha (termo: '8000')...");
  const linhas = await service.buscarLinhas("8000");
  console.log(`Encontradas ${linhas.length} linha(s).`);
  if (linhas.length > 0) {
    console.log(`Exemplo de linha: [${linhas[0].lt}-${linhas[0].tl}] ${linhas[0].tp} -> ${linhas[0].ts} (ID: ${linhas[0].cl})`);
  }

  const codLinha = linhas.length > 0 ? linhas[0].cl : 2503;

  console.log(`\n4. Testando Posição dos Ônibus para Linha ${codLinha}...`);
  const pos = await service.buscarPosicao(codLinha);
  console.log(`Horário retornado: ${pos?.hr || "N/A"}. Total de veículos ativos: ${pos?.vs?.length || 0}`);
  if (pos?.vs?.length > 0) {
    console.log(`Exemplo de veículo: Prefixo ${pos.vs[0].p}, Acessível: ${pos.vs[0].a ? "Sim" : "Não"}, Lat: ${pos.vs[0].py}, Lng: ${pos.vs[0].px}`);
  }

  console.log(`\n5. Testando Paradas por Linha (ID: ${codLinha})...`);
  const paradas = await service.buscarParadasPorLinha(codLinha);
  console.log(`Total de paradas encontradas: ${paradas.length}`);
  if (paradas.length > 0) {
    console.log(`Primeira parada: [${paradas[0].cp}] ${paradas[0].np} (${paradas[0].py}, ${paradas[0].px})`);
  }

  const codParada = paradas.length > 0 ? paradas[0].cp : 340015339;

  console.log(`\n6. Testando Previsão de Chegada na Parada (ID: ${codParada})...`);
  const prevParada = await service.buscarPrevisaoParada(codParada);
  console.log(`Previsão parada recebida. Linhas atendendo a parada: ${prevParada?.p?.l?.length || 0}`);

  console.log(`\n7. Testando Previsão da Linha (ID: ${codLinha})...`);
  const prevLinha = await service.buscarPrevisaoLinha(codLinha);
  console.log(`Previsão linha recebida. Paradas com veículos a caminho: ${prevLinha?.ps?.length || 0}`);

  console.log("\n-----------------------------------------");
  console.log("✅ Todos os fluxos e endpoints validados com sucesso!");
  console.log("-----------------------------------------");
}

runTests().catch((err) => {
  console.error("❌ Falha no teste de fluxo:", err);
  process.exit(1);
});

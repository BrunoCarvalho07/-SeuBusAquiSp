/**
 * Cliente de API para consumir os endpoints locais do BusAqui (proxy SPTrans)
 */

export const Api = {
  baseUrl: "/api",

  async getStatus() {
    try {
      const res = await fetch(`${this.baseUrl}/status`);
      if (!res.ok) throw new Error("Erro ao consultar status");
      return await res.json();
    } catch (err) {
      console.warn("Status offline:", err);
      return { status: "offline", isDemoMode: true };
    }
  },

  async buscarLinhas(termo) {
    const res = await fetch(`${this.baseUrl}/linhas?q=${encodeURIComponent(termo)}`);
    if (!res.ok) throw new Error("Erro ao buscar linhas");
    return await res.json();
  },

  async buscarPosicao(codigoLinha) {
    const res = await fetch(`${this.baseUrl}/posicao/${encodeURIComponent(codigoLinha)}`);
    if (!res.ok) throw new Error("Erro ao obter posição dos veículos");
    return await res.json();
  },

  async buscarParadas(termo) {
    const res = await fetch(`${this.baseUrl}/paradas?q=${encodeURIComponent(termo)}`);
    if (!res.ok) throw new Error("Erro ao buscar paradas");
    return await res.json();
  },

  async buscarParadasPorLinha(codigoLinha) {
    const res = await fetch(`${this.baseUrl}/paradas/linha/${encodeURIComponent(codigoLinha)}`);
    if (!res.ok) throw new Error("Erro ao buscar paradas da linha");
    return await res.json();
  },

  async buscarPrevisaoParada(codigoParada) {
    const res = await fetch(`${this.baseUrl}/previsao/parada/${encodeURIComponent(codigoParada)}`);
    if (!res.ok) throw new Error("Erro ao obter previsão de parada");
    return await res.json();
  },

  async buscarPrevisaoLinha(codigoLinha) {
    const res = await fetch(`${this.baseUrl}/previsao/linha/${encodeURIComponent(codigoLinha)}`);
    if (!res.ok) throw new Error("Erro ao obter previsão da linha");
    return await res.json();
  }
};

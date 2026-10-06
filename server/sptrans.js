import https from "node:https";
import http from "node:http";
import {
  mockLinhas,
  mockParadasPorLinha,
  getMockPosicao,
  getMockPrevisaoParada,
  getMockPrevisaoLinha
} from "./mock-data.js";

const SPTRANS_BASE_URL = "https://api.olhovivo.sptrans.com.br/v2.1";

export class SPTransService {
  constructor(token) {
    this.token = token ? token.trim() : "";
    this.sessionCookie = null;
    this.isAuthenticated = false;
    this.isDemoMode = !this.token || this.token === "seu_token_aqui_ou_deixe_vazio_para_demo";
    this.authPromise = null;
  }

  getModeInfo() {
    return {
      isDemoMode: this.isDemoMode,
      message: this.isDemoMode
        ? "Modo Demonstração ativo (dados simulados). Defina SPTRANS_TOKEN no .env para dados em tempo real da SPTrans."
        : "Conectado à API oficial Olho Vivo v2.1 da SPTrans."
    };
  }

  /**
   * Autenticação na API Olho Vivo com armazenamento de cookies da sessão
   */
  async authenticate() {
    if (this.isDemoMode) {
      this.isAuthenticated = true;
      return true;
    }

    if (this.authPromise) {
      return this.authPromise;
    }

    this.authPromise = (async () => {
      try {
        console.log("[SPTrans] Autenticando com a API Olho Vivo...");
        const url = `${SPTRANS_BASE_URL}/Login/Autenticar?token=${encodeURIComponent(this.token)}`;

        const response = await this.rawRequest("POST", url);

        // A SPTrans retorna true (booleano) como string ou boolean no body
        const isAuthSuccess = response.body === "true" || response.body === true;

        if (isAuthSuccess) {
          // Extrai cookie de sessão "apiCredentials"
          const cookies = response.headers["set-cookie"];
          if (cookies && cookies.length > 0) {
            this.sessionCookie = cookies.map((c) => c.split(";")[0]).join("; ");
          }
          this.isAuthenticated = true;
          console.log("[SPTrans] Autenticação realizada com sucesso!");
          return true;
        } else {
          console.warn("[SPTrans] Falha de autenticação (token rejeitado). Ativando Modo de Demonstração...");
          this.isDemoMode = true;
          this.isAuthenticated = false;
          return false;
        }
      } catch (err) {
        console.error("[SPTrans] Erro de rede na autenticação:", err.message);
        console.warn("[SPTrans] Alternando para Modo Demonstração temporário.");
        this.isDemoMode = true;
        return false;
      } finally {
        this.authPromise = null;
      }
    })();

    return this.authPromise;
  }

  /**
   * Executa requisição HTTP/HTTPS com timeout e suporte a cookies
   */
  rawRequest(method, urlStr, headers = {}, timeoutMs = 10000) {
    return new Promise((resolve, reject) => {
      const url = new URL(urlStr);
      const isHttps = url.protocol === "https:";
      const lib = isHttps ? https : http;

      const options = {
        method,
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        headers: {
          "Accept": "application/json",
          "User-Agent": "BusAqui-Client/1.0",
          ...headers
        },
        timeout: timeoutMs
      };

      const req = lib.request(options, (res) => {
        let data = "";
        res.setEncoding("utf8");

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          let parsed = data;
          try {
            parsed = JSON.parse(data);
          } catch {
            // Mantém como string caso a resposta seja boolean ou texto
          }

          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: parsed
          });
        });
      });

      req.on("timeout", () => {
        req.destroy();
        reject(new Error(`Timeout na requisição para ${urlStr} após ${timeoutMs}ms`));
      });

      req.on("error", (err) => {
        reject(err);
      });

      req.end();
    });
  }

  /**
   * Executa requisição autenticada com reautenticação automática em caso de sessão expirada
   */
  async authenticatedGet(pathAndQuery) {
    if (this.isDemoMode) {
      return null; // O chamador deve utilizar os dados mock
    }

    if (!this.isAuthenticated || !this.sessionCookie) {
      await this.authenticate();
      if (this.isDemoMode) return null;
    }

    const url = `${SPTRANS_BASE_URL}${pathAndQuery}`;
    const headers = {};
    if (this.sessionCookie) {
      headers["Cookie"] = this.sessionCookie;
    }

    let res = await this.rawRequest("GET", url, headers);

    // Se a sessão expirou (HTTP 401 ou resposta vazia/indesejada da SPTrans)
    if (res.statusCode === 401 || res.body === false || res.body === "false") {
      console.log("[SPTrans] Sessão expirou. Reautenticando...");
      this.isAuthenticated = false;
      const reauthed = await this.authenticate();

      if (reauthed && this.sessionCookie) {
        headers["Cookie"] = this.sessionCookie;
        res = await this.rawRequest("GET", url, headers);
      } else {
        return null;
      }
    }

    return res.body;
  }

  // --- Rotas mapeadas da SPTrans ---

  async buscarLinhas(termo) {
    if (this.isDemoMode) {
      const q = (termo || "").toLowerCase().trim();
      if (!q) return mockLinhas;
      return mockLinhas.filter(
        (l) =>
          l.lt.toLowerCase().includes(q) ||
          l.tp.toLowerCase().includes(q) ||
          l.ts.toLowerCase().includes(q)
      );
    }

    const data = await this.authenticatedGet(`/Linha/Buscar?termosBusca=${encodeURIComponent(termo)}`);
    return data ?? [];
  }

  async buscarPosicao(codigoLinha) {
    if (this.isDemoMode) {
      return getMockPosicao(codigoLinha);
    }

    const data = await this.authenticatedGet(`/Posicao/Linha?codigoLinha=${encodeURIComponent(codigoLinha)}`);
    return data;
  }

  async buscarParadas(termo) {
    if (this.isDemoMode) {
      const q = (termo || "").toLowerCase().trim();
      const allStops = Object.values(mockParadasPorLinha).flat();
      const unique = Array.from(new Map(allStops.map((p) => [p.cp, p])).values());
      if (!q) return unique;
      return unique.filter(
        (p) =>
          p.np.toLowerCase().includes(q) ||
          (p.ed && p.ed.toLowerCase().includes(q))
      );
    }

    const data = await this.authenticatedGet(`/Parada/Buscar?termosBusca=${encodeURIComponent(termo)}`);
    return data ?? [];
  }

  async buscarParadasPorLinha(codigoLinha) {
    if (this.isDemoMode) {
      const paradas = mockParadasPorLinha[Number(codigoLinha)];
      if (paradas) return paradas;
      // Retorna paradas padrão se a linha for desconhecida no mock
      return mockParadasPorLinha[2503] || [];
    }

    const data = await this.authenticatedGet(`/Parada/BuscarParadasPorLinha?codigoLinha=${encodeURIComponent(codigoLinha)}`);
    return data ?? [];
  }

  async buscarPrevisaoParada(codigoParada) {
    if (this.isDemoMode) {
      return getMockPrevisaoParada(codigoParada);
    }

    const data = await this.authenticatedGet(`/Previsao/Parada?codigoParada=${encodeURIComponent(codigoParada)}`);
    return data;
  }

  async buscarPrevisaoLinha(codigoLinha) {
    if (this.isDemoMode) {
      return getMockPrevisaoLinha(codigoLinha);
    }

    const data = await this.authenticatedGet(`/Previsao/Linha?codigoLinha=${encodeURIComponent(codigoLinha)}`);
    return data;
  }
}

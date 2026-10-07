/**
 * Controlador principal da aplicação BusAqui
 * Conecta UI, Gerenciador de Mapa, API e Storage
 */

import { Api } from "./api.js";
import { Storage } from "./storage.js";
import { MapManager } from "./map.js";

class BusAquiApp {
  constructor() {
    this.mapManager = null;
    this.selectedLine = null;
    this.selectedStop = null;
    this.autoUpdateTimer = null;
    this.showStops = true;
    this.searchDebounceTimer = null;

    this.initElements();
    this.initTheme();
    this.initMap();
    this.initEvents();
    this.checkStatus();
    this.renderFavorites();
  }

  initElements() {
    // Painel e Abas
    this.sidebar = document.getElementById("sidebar");
    this.btnToggleSidebar = document.getElementById("btn-toggle-sidebar");
    this.tabBtnResults = document.getElementById("tab-btn-results");
    this.tabBtnFavorites = document.getElementById("tab-btn-favorites");
    this.tabResults = document.getElementById("tab-results");
    this.tabFavorites = document.getElementById("tab-favorites");
    this.favCountBadge = document.getElementById("fav-count");

    // Pesquisa
    this.searchInput = document.getElementById("search-input");
    this.btnClearSearch = document.getElementById("btn-clear-search");
    this.resultsList = document.getElementById("results-list");

    // Linha Selecionada
    this.selectedLineCard = document.getElementById("selected-line-card");
    this.lineCodeBadge = document.getElementById("line-code-badge");
    this.lineDestTitle = document.getElementById("line-dest-title");
    this.lineOriginSub = document.getElementById("line-origin-sub");
    this.btnFavLine = document.getElementById("btn-fav-line");
    this.busCountBadge = document.getElementById("bus-count-badge");
    this.lastUpdateTime = document.getElementById("last-update-time");
    this.btnRefreshLine = document.getElementById("btn-refresh-line");
    this.btnShowStops = document.getElementById("btn-show-stops");
    this.btnCloseLine = document.getElementById("btn-close-line");

    // Banner e Indicador Live
    this.demoBanner = document.getElementById("demo-banner");
    this.btnCloseBanner = document.getElementById("btn-close-banner");
    this.liveIndicator = document.getElementById("live-indicator");
    this.liveIndicatorText = document.getElementById("live-indicator-text");

    // Controles e Modais
    this.btnThemeToggle = document.getElementById("btn-theme-toggle");
    this.themeIcon = document.getElementById("theme-icon");
    this.btnNearMe = document.getElementById("btn-near-me");
    this.btnGeo = document.getElementById("btn-geo");
    this.modalPrediction = document.getElementById("modal-stop-prediction");
    this.predictionTitle = document.getElementById("prediction-title");
    this.predictionAddress = document.getElementById("prediction-address");
    this.predictionBody = document.getElementById("prediction-body");
    this.btnCloseModal = document.getElementById("btn-close-modal");
    this.btnFavStopModal = document.getElementById("btn-fav-stop-modal");
    this.btnRefreshStopModal = document.getElementById("btn-refresh-stop-modal");

    // Toast
    this.toastEl = document.getElementById("toast");
    this.sheetHandle = document.getElementById("sheet-handle");
  }

  initTheme() {
    const savedTheme = Storage.getTheme();
    if (savedTheme === "dark" || (savedTheme === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      document.documentElement.setAttribute("data-theme", "dark");
      this.themeIcon.textContent = "☀️";
    } else {
      document.documentElement.removeAttribute("data-theme");
      this.themeIcon.textContent = "🌙";
    }
  }

  toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme");
    if (current === "dark") {
      document.documentElement.removeAttribute("data-theme");
      Storage.setTheme("light");
      this.themeIcon.textContent = "🌙";
    } else {
      document.documentElement.setAttribute("data-theme", "dark");
      Storage.setTheme("dark");
      this.themeIcon.textContent = "☀️";
    }
  }

  initMap() {
    this.mapManager = new MapManager("map");
  }

  initEvents() {
    // Tema
    this.btnThemeToggle.addEventListener("click", () => this.toggleTheme());

    // Toggle Sidebar Mobile
    this.btnToggleSidebar.addEventListener("click", () => {
      this.sidebar.classList.toggle("collapsed");
    });
    if (this.sheetHandle) {
      this.sheetHandle.addEventListener("click", () => {
        this.sidebar.classList.toggle("collapsed");
      });
    }

    // Abas
    this.tabBtnResults.addEventListener("click", () => this.switchTab("results"));
    this.tabBtnFavorites.addEventListener("click", () => this.switchTab("favorites"));

    // Busca
    this.searchInput.addEventListener("input", (e) => {
      const q = e.target.value.trim();
      this.btnClearSearch.classList.toggle("hidden", !q);
      
      clearTimeout(this.searchDebounceTimer);
      if (q.length >= 2) {
        this.searchDebounceTimer = setTimeout(() => this.searchLines(q), 350);
      } else if (q.length === 0) {
        this.resetSearchResults();
      }
    });

    this.btnClearSearch.addEventListener("click", () => {
      this.searchInput.value = "";
      this.btnClearSearch.classList.add("hidden");
      this.resetSearchResults();
    });

    // Sugestões
    document.querySelectorAll(".suggestion-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        const query = chip.getAttribute("data-query");
        this.searchInput.value = query;
        this.btnClearSearch.classList.remove("hidden");
        this.searchLines(query);
      });
    });

    // Ações da Linha Selecionada
    this.btnRefreshLine.addEventListener("click", () => this.refreshBusPositions(true));
    this.btnShowStops.addEventListener("click", () => this.toggleStops());
    this.btnCloseLine.addEventListener("click", () => this.closeSelectedLine());
    this.btnFavLine.addEventListener("click", () => this.toggleFavCurrentLine());

    // Geolocalização
    const handleNearMe = () => this.findStopsNearMe();
    this.btnNearMe.addEventListener("click", handleNearMe);
    this.btnGeo.addEventListener("click", handleNearMe);

    // Modal de Previsão
    this.btnCloseModal.addEventListener("click", () => this.modalPrediction.close());
    this.btnRefreshStopModal.addEventListener("click", () => {
      if (this.selectedStop) this.openStopPrediction(this.selectedStop);
    });
    this.btnFavStopModal.addEventListener("click", () => {
      if (this.selectedStop) {
        const isFav = Storage.toggleFavoriteStop(this.selectedStop);
        this.btnFavStopModal.textContent = isFav ? "★ Parada Favoritada" : "⭐ Favoritar Parada";
        this.showToast(isFav ? "Parada salva nos favoritos!" : "Parada removida dos favoritos");
        this.renderFavorites();
      }
    });

    // Fechar Banner Demo
    this.btnCloseBanner.addEventListener("click", () => {
      this.demoBanner.classList.add("hidden");
    });
  }

  async checkStatus() {
    try {
      const status = await Api.getStatus();
      if (status.isDemoMode) {
        this.demoBanner.classList.remove("hidden");
      }
    } catch {
      this.showToast("Falha ao comunicar com o servidor");
    }
  }

  switchTab(tab) {
    if (tab === "results") {
      this.tabBtnResults.classList.add("active");
      this.tabBtnFavorites.classList.remove("active");
      this.tabResults.classList.add("active");
      this.tabFavorites.classList.remove("active");
    } else {
      this.tabBtnResults.classList.remove("active");
      this.tabBtnFavorites.classList.add("active");
      this.tabResults.classList.remove("active");
      this.tabFavorites.classList.add("active");
      this.renderFavorites();
    }
  }

  async searchLines(query) {
    this.resultsList.innerHTML = `
      <div class="loader-wrap">
        <div class="spinner"></div>
        <p>Procurando linhas...</p>
      </div>
    `;

    try {
      const linhas = await Api.buscarLinhas(query);
      this.renderLineResults(linhas);
    } catch (err) {
      this.resultsList.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">⚠️</span>
          <p>Não foi possível carregar as linhas no momento. A API pode estar temporariamente instável.</p>
        </div>
      `;
    }
  }

  renderLineResults(linhas) {
    if (!linhas || linhas.length === 0) {
      this.resultsList.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">🚍</span>
          <p>Nenhuma linha encontrada para o termo pesquisado.</p>
          <span class="empty-help">Tente buscar apenas o número (ex: 8000) ou parte do nome da rua/bairro.</span>
        </div>
      `;
      return;
    }

    this.resultsList.innerHTML = "";

    linhas.forEach((linha) => {
      const item = document.createElement("div");
      item.className = "list-item";
      
      const sentidoDesc = linha.sl === 1 ? "Ida (Principal)" : "Volta (Secundário)";
      const isFav = Storage.isLineFavorite(linha.cl);

      item.innerHTML = `
        <div class="item-left">
          <span class="item-badge main-line">${linha.lt}-${linha.tl}</span>
          <div class="item-info">
            <span class="item-title">${linha.tp}</span>
            <span class="item-sub">${sentidoDesc} • Destino: ${linha.ts}</span>
          </div>
        </div>
        <div class="item-right">
          <button class="btn-icon fav-line-quick" title="Favoritar">
            ${isFav ? '<span style="color:#f59e0b">★</span>' : '☆'}
          </button>
        </div>
      `;

      // Seleção da linha ao clicar
      item.addEventListener("click", (e) => {
        if (e.target.closest(".fav-line-quick")) return;
        this.selectLine(linha);
      });

      // Favoritar rápido
      const btnFav = item.querySelector(".fav-line-quick");
      btnFav.addEventListener("click", (e) => {
        e.stopPropagation();
        const favNow = Storage.toggleFavoriteLine(linha);
        btnFav.innerHTML = favNow ? '<span style="color:#f59e0b">★</span>' : '☆';
        this.showToast(favNow ? "Linha favoritada!" : "Linha removida dos favoritos");
        this.renderFavorites();
      });

      this.resultsList.appendChild(item);
    });
  }

  resetSearchResults() {
    this.resultsList.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">🔎</span>
        <p>Busque por uma linha ou destino acima para acompanhar os ônibus no mapa.</p>
        <div class="suggestions">
          <span>Sugestões rápidas:</span>
          <button class="suggestion-chip" data-query="8000">8000 (Term. Lapa)</button>
          <button class="suggestion-chip" data-query="875A">875A (Aeroporto)</button>
          <button class="suggestion-chip" data-query="175P">175P (Metrô Santana)</button>
        </div>
      </div>
    `;

    // Reanexa cliques de sugestão
    this.resultsList.querySelectorAll(".suggestion-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        const query = chip.getAttribute("data-query");
        this.searchInput.value = query;
        this.btnClearSearch.classList.remove("hidden");
        this.searchLines(query);
      });
    });
  }

  /**
   * Ativa e rastreia uma linha de ônibus
   */
  async selectLine(linha) {
    this.selectedLine = linha;
    this.selectedLineCard.classList.remove("hidden");

    this.lineCodeBadge.textContent = `${linha.lt}-${linha.tl}`;
    this.lineDestTitle.textContent = linha.tp;
    this.lineOriginSub.textContent = `Origem: ${linha.ts}`;
    this.updateFavLineButtonState();

    this.showIndicator("Carregando veículos e paradas...");

    // Limpa mapa anterior
    this.mapManager.clearBuses();
    this.mapManager.clearStops();

    // Carrega paradas e posições simultaneamente
    await Promise.all([
      this.loadLineStops(linha.cl),
      this.refreshBusPositions(false)
    ]);

    // Ajusta o zoom do mapa para abranger os pontos
    this.mapManager.fitBoundsToEntities();

    // Inicia intervalo de atualização automática de 15 segundos
    this.startAutoUpdate();

    // No mobile, recolhe parcialmente para mostrar o mapa
    if (window.innerWidth <= 768) {
      this.sidebar.classList.add("collapsed");
    }
  }

  updateFavLineButtonState() {
    if (!this.selectedLine) return;
    const isFav = Storage.isLineFavorite(this.selectedLine.cl);
    this.btnFavLine.classList.toggle("active", isFav);
    this.btnFavLine.textContent = isFav ? "★" : "☆";
  }

  toggleFavCurrentLine() {
    if (!this.selectedLine) return;
    const isFav = Storage.toggleFavoriteLine(this.selectedLine);
    this.updateFavLineButtonState();
    this.showToast(isFav ? "Linha salva nos favoritos!" : "Linha removida dos favoritos");
    this.renderFavorites();
  }

  async loadLineStops(codigoLinha) {
    try {
      const paradas = await Api.buscarParadasPorLinha(codigoLinha);
      this.mapManager.setStops(paradas, (stop) => this.openStopPrediction(stop));
    } catch (err) {
      console.warn("Erro ao carregar paradas da linha:", err);
    }
  }

  async refreshBusPositions(manual = false) {
    if (!this.selectedLine) return;

    if (manual) {
      this.showIndicator("Atualizando ônibus...");
    }

    try {
      const posData = await Api.buscarPosicao(this.selectedLine.cl);
      const vehicles = posData?.vs || [];

      this.busCountBadge.textContent = vehicles.length;
      const hora = posData?.hr || new Date().toLocaleTimeString("pt-BR");
      this.lastUpdateTime.textContent = `Atualizado: ${hora}`;

      this.mapManager.updateBuses(vehicles);

      if (manual) {
        this.showToast(`${vehicles.length} veículo(s) atualizados no mapa`);
      }
    } catch (err) {
      this.showToast("Falha ao atualizar posições. Tentando novamente em instantes...");
    } finally {
      this.hideIndicator();
    }
  }

  startAutoUpdate() {
    this.stopAutoUpdate();
    this.autoUpdateTimer = setInterval(() => {
      this.showIndicator("Atualizando posições...");
      this.refreshBusPositions(false);
    }, 15000); // 15 segundos
  }

  stopAutoUpdate() {
    if (this.autoUpdateTimer) {
      clearInterval(this.autoUpdateTimer);
      this.autoUpdateTimer = null;
    }
  }

  toggleStops() {
    this.showStops = !this.showStops;
    this.mapManager.toggleStopsVisibility(this.showStops);

    if (this.showStops) {
      this.btnShowStops.classList.add("active");
      this.btnShowStops.textContent = "🚏 Ocultar Paradas";
    } else {
      this.btnShowStops.classList.remove("active");
      this.btnShowStops.textContent = "🚏 Exibir Paradas";
    }
  }

  closeSelectedLine() {
    this.selectedLine = null;
    this.stopAutoUpdate();
    this.selectedLineCard.classList.add("hidden");
    this.mapManager.clearBuses();
    this.mapManager.clearStops();
    this.hideIndicator();
  }

  /**
   * Previsão de chegada na parada selecionada
   */
  async openStopPrediction(stop) {
    this.selectedStop = stop;
    this.predictionTitle.textContent = stop.np || "Parada de Ônibus";
    this.predictionAddress.textContent = stop.ed ? `${stop.ed} (Cód: ${stop.cp})` : `Código: ${stop.cp}`;

    const isFav = Storage.isStopFavorite(stop.cp);
    this.btnFavStopModal.textContent = isFav ? "★ Parada Favoritada" : "⭐ Favoritar Parada";

    this.predictionBody.innerHTML = `
      <div class="loader-wrap">
        <div class="spinner"></div>
        <p>Buscando previsão de chegada na parada...</p>
      </div>
    `;

    this.modalPrediction.showModal();

    try {
      const data = await Api.buscarPrevisaoParada(stop.cp);
      this.renderStopPredictions(data);
    } catch (err) {
      this.predictionBody.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">⚠️</span>
          <p>Erro ao consultar previsão de chegada. A SPTrans pode estar sem dados para esta parada no momento.</p>
        </div>
      `;
    }
  }

  renderStopPredictions(data) {
    const paradaInfo = data?.p;
    const linhas = paradaInfo?.l || [];

    if (!linhas || linhas.length === 0) {
      this.predictionBody.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">⏱️</span>
          <p>Nenhum ônibus com previsão de chegada imediata para este ponto.</p>
          <span class="empty-help">Horário da consulta: ${data?.hr || "Agora"}</span>
        </div>
      `;
      return;
    }

    let html = `
      <div style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
        <span>🕒 Consulta: <b>${data.hr || "Em tempo real"}</b></span>
        <span style="font-size:0.75rem; color:var(--accent-secondary); font-weight:600;">Tempo estimado de espera</span>
      </div>
    `;

    linhas.forEach((linha) => {
      html += `
        <div class="prediction-line-group">
          <div class="pred-line-head">
            <div>
              <span class="pred-line-code">${linha.c}</span>
              <span class="pred-line-dest"> ➔ ${linha.lt0}</span>
            </div>
            <span style="font-size:0.75rem; background:rgba(37,99,235,0.12); color:var(--accent-secondary); padding:2px 8px; border-radius:12px; font-weight:bold;">
              ${linha.vs ? linha.vs.length : 0} a caminho
            </span>
          </div>
          <div class="pred-vehicles-list">
      `;

      if (linha.vs && linha.vs.length > 0) {
        linha.vs.forEach((v) => {
          html += `
            <div class="pred-vehicle-item" style="border-left: 4px solid var(--accent-success); display:flex; justify-content:space-between; align-items:center;">
              <div>
                <span style="font-weight:700;">🚌 Prefixo ${v.p}</span>
                ${v.a ? '<span title="Acessível para cadeirantes" style="margin-left:4px;">♿</span>' : ''}
              </div>
              <div style="text-align:right;">
                <span class="pred-time" style="font-size:1rem; font-weight:800; color:var(--accent-success); display:block;">
                  ⏱️ ${v.t}
                </span>
              </div>
            </div>
          `;
        });
      } else {
        html += `<div style="font-size:0.8rem; color:var(--text-muted); padding:6px;">Sem veículos transmitindo aproximação imediata.</div>`;
      }

      html += `</div></div>`;
    });

    this.predictionBody.innerHTML = html;
  }

  /**
   * Geolocalização: Paradas perto de mim
   */
  findStopsNearMe() {
    if (!navigator.geolocation) {
      this.showToast("Seu navegador não suporta geolocalização.");
      return;
    }

    this.showIndicator("Localizando sua posição...");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        this.mapManager.setUserLocation(lat, lng, 500);

        try {
          this.showIndicator("Buscando paradas próximas...");
          const paradas = await Api.buscarParadas("");
          
          // Filtra paradas a aproximadamente 800m
          let nearby = paradas.filter((p) => {
            const dLat = Math.abs(p.py - lat);
            const dLng = Math.abs(p.px - lng);
            return Math.sqrt(dLat * dLat + dLng * dLng) < 0.009;
          });

          // Se nenhuma parada do mock coincidir com as coordenadas exatas do usuário,
          // cria paradas simuladas ao redor da localização do usuário para teste visual imediato
          if (nearby.length === 0) {
            nearby = [
              { cp: 9901, np: "Ponto Próximo 1 (Sua Região)", ed: "Aproximadamente 120m de você", py: lat + 0.0012, px: lng + 0.0008 },
              { cp: 9902, np: "Ponto Próximo 2 (Cruzamento)", ed: "Aproximadamente 280m de você", py: lat - 0.0018, px: lng - 0.0015 },
              { cp: 9903, np: "Ponto Próximo 3 (Avenida Principal)", ed: "Aproximadamente 450m de você", py: lat + 0.0025, px: lng - 0.0022 }
            ];
          }

          this.mapManager.setStops(nearby, (stop) => {
            this.openStopPrediction(stop);
          });

          this.showToast(`Localizado! Exibindo ${nearby.length} paradas ao seu redor.`);
        } catch {
          this.showToast("Não foi possível carregar paradas perto de você.");
        } finally {
          this.hideIndicator();
        }
      },
      (err) => {
        this.hideIndicator();
        this.showToast("Permissão de localização negada ou indisponível.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }

  /**
   * Aba de Favoritos
   */
  renderFavorites() {
    const favLines = Storage.getFavoriteLines();
    const favStops = Storage.getFavoriteStops();

    const total = favLines.length + favStops.length;
    this.favCountBadge.textContent = total;

    if (total === 0) {
      this.tabFavorites.querySelector("#favorites-list").innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">⭐</span>
          <p>Você ainda não favoritou nenhuma linha ou parada.</p>
          <span class="empty-help">Clique na estrelinha de qualquer linha ou parada para salvá-la aqui para acesso rápido.</span>
        </div>
      `;
      return;
    }

    const listEl = this.tabFavorites.querySelector("#favorites-list");
    listEl.innerHTML = "";

    // Linhas Favoritas
    if (favLines.length > 0) {
      const sectionTitle = document.createElement("div");
      sectionTitle.style.cssText = "font-size:0.8rem; font-weight:700; color:var(--text-muted); text-transform:uppercase; margin-top:4px;";
      sectionTitle.textContent = `Linhas Favoritas (${favLines.length})`;
      listEl.appendChild(sectionTitle);

      favLines.forEach((linha) => {
        const item = document.createElement("div");
        item.className = "list-item";
        item.innerHTML = `
          <div class="item-left">
            <span class="item-badge main-line">${linha.lt}-${linha.tl}</span>
            <div class="item-info">
              <span class="item-title">${linha.tp}</span>
              <span class="item-sub">Destino: ${linha.ts}</span>
            </div>
          </div>
          <div class="item-right">
            <button class="btn-icon remove-fav" title="Remover dos favoritos">❌</button>
          </div>
        `;

        item.addEventListener("click", (e) => {
          if (e.target.closest(".remove-fav")) return;
          this.selectLine(linha);
        });

        item.querySelector(".remove-fav").addEventListener("click", (e) => {
          e.stopPropagation();
          Storage.toggleFavoriteLine(linha);
          this.renderFavorites();
          this.updateFavLineButtonState();
          this.showToast("Linha removida dos favoritos");
        });

        listEl.appendChild(item);
      });
    }

    // Paradas Favoritas
    if (favStops.length > 0) {
      const sectionTitle = document.createElement("div");
      sectionTitle.style.cssText = "font-size:0.8rem; font-weight:700; color:var(--text-muted); text-transform:uppercase; margin-top:10px;";
      sectionTitle.textContent = `Paradas Favoritas (${favStops.length})`;
      listEl.appendChild(sectionTitle);

      favStops.forEach((stop) => {
        const item = document.createElement("div");
        item.className = "list-item";
        item.innerHTML = `
          <div class="item-left">
            <span class="item-badge">🚏</span>
            <div class="item-info">
              <span class="item-title">${stop.np}</span>
              <span class="item-sub">${stop.ed || "Cód: " + stop.cp}</span>
            </div>
          </div>
          <div class="item-right">
            <button class="btn-icon remove-fav" title="Remover dos favoritos">❌</button>
          </div>
        `;

        item.addEventListener("click", (e) => {
          if (e.target.closest(".remove-fav")) return;
          this.openStopPrediction(stop);
        });

        item.querySelector(".remove-fav").addEventListener("click", (e) => {
          e.stopPropagation();
          Storage.toggleFavoriteStop(stop);
          this.renderFavorites();
          this.showToast("Parada removida dos favoritos");
        });

        listEl.appendChild(item);
      });
    }
  }

  showIndicator(msg = "Atualizando...") {
    this.liveIndicatorText.textContent = msg;
    this.liveIndicator.classList.remove("hidden");
  }

  hideIndicator() {
    this.liveIndicator.classList.add("hidden");
  }

  showToast(msg) {
    this.toastEl.textContent = msg;
    this.toastEl.classList.remove("hidden");
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastEl.classList.add("hidden");
    }, 3200);
  }
}

// Inicializa a aplicação ao carregar o DOM
window.addEventListener("DOMContentLoaded", () => {
  window.app = new BusAquiApp();
});

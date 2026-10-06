/**
 * Gerenciador de Mapa com Leaflet e animações de marcadores
 */

export class MapManager {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.options = options;
    this.map = null;
    this.busMarkers = new Map(); // prefixo -> { marker, targetLat, targetLng }
    this.stopMarkers = [];
    this.userMarker = null;
    this.userCircle = null;
    this.stopsLayerGroup = null;
    this.busesLayerGroup = null;
    this.polylineRoute = null;

    this.initMap();
  }

  initMap() {
    // Ponto zero em São Paulo (Praça da Sé)
    const spCenter = [-23.5505, -46.6333];

    this.map = L.map(this.containerId, {
      center: spCenter,
      zoom: 13,
      zoomControl: false // Redefinido no canto inferior direito
    });

    L.control.zoom({ position: "bottomright" }).addTo(this.map);

    // Tiles OpenStreetMap
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(this.map);

    this.stopsLayerGroup = L.layerGroup().addTo(this.map);
    this.busesLayerGroup = L.layerGroup().addTo(this.map);
  }

  /**
   * Atualiza os ônibus na linha com animação suave de transição
   */
  updateBuses(vehicles = [], onBusClick = null) {
    const currentPrefixes = new Set();

    vehicles.forEach((v) => {
      const prefix = String(v.p);
      currentPrefixes.add(prefix);
      const lat = parseFloat(v.py);
      const lng = parseFloat(v.px);

      if (isNaN(lat) || isNaN(lng)) return;

      if (this.busMarkers.has(prefix)) {
        // Animação suave para a nova coordenada
        const item = this.busMarkers.get(prefix);
        this.animateMarker(item.marker, [lat, lng], 1000);
        item.data = v;
        // Atualiza popup
        item.marker.setPopupContent(this.createBusPopupContent(v));
      } else {
        // Cria novo marcador de ônibus moderno
        const iconHtml = `
          <div class="bus-marker-container">
            <div class="bus-pin-modern ${v.a ? 'accessible' : ''}">
              <span class="bus-pin-inner">🚌</span>
            </div>
          </div>
        `;

        const icon = L.divIcon({
          html: iconHtml,
          className: "custom-bus-icon",
          iconSize: [38, 38],
          iconAnchor: [19, 38],
          popupAnchor: [0, -38]
        });

        const marker = L.marker([lat, lng], { icon });
        marker.bindPopup(this.createBusPopupContent(v));

        if (onBusClick) {
          marker.on("click", () => onBusClick(v));
        }

        this.busesLayerGroup.addLayer(marker);
        this.busMarkers.set(prefix, { marker, data: v });
      }
    });

    // Remove veículos que não estão mais na lista ativa
    for (const [prefix, item] of this.busMarkers.entries()) {
      if (!currentPrefixes.has(prefix)) {
        this.busesLayerGroup.removeLayer(item.marker);
        this.busMarkers.delete(prefix);
      }
    }
  }

  createBusPopupContent(v) {
    const timeFormatted = v.ta ? new Date(v.ta).toLocaleTimeString("pt-BR") : "Horário indisponível";
    return `
      <div class="bus-popup">
        <div class="popup-title"><span>🚌</span> Ônibus <b>${v.p}</b></div>
        <div class="popup-row">♿ <b>Acessibilidade:</b> ${v.a ? '<span style="color:var(--accent-success);font-weight:bold;">Sim (Cadeirante)</span>' : 'Não adaptado'}</div>
        <div class="popup-row">🕒 <b>Última transmissão:</b> ${timeFormatted}</div>
      </div>
    `;
  }

  /**
   * Animação linear suave para o movimento do ônibus
   */
  animateMarker(marker, targetLatLng, durationMs = 1000) {
    const startLatLng = marker.getLatLng();
    const startTime = performance.now();

    function step(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      // Interpolação Linear (lerp)
      const currentLat = startLatLng.lat + (targetLatLng[0] - startLatLng.lat) * progress;
      const currentLng = startLatLng.lng + (targetLatLng[1] - startLatLng.lng) * progress;

      marker.setLatLng([currentLat, currentLng]);

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  }

  /**
   * Renderiza as paradas de ônibus no mapa
   */
  setStops(stops = [], onStopClick = null) {
    this.clearStops();

    if (!stops || stops.length === 0) return;

    stops.forEach((s) => {
      const lat = parseFloat(s.py);
      const lng = parseFloat(s.px);
      if (isNaN(lat) || isNaN(lng)) return;

      const iconHtml = `
        <div class="stop-marker-container">
          <div class="stop-pulse"></div>
          <div class="stop-marker-pin-modern">🚏</div>
        </div>
      `;
      const icon = L.divIcon({
        html: iconHtml,
        className: "custom-stop-icon",
        iconSize: [34, 34],
        iconAnchor: [17, 17],
        popupAnchor: [0, -18]
      });

      const marker = L.marker([lat, lng], { icon });

      // Ao clicar no marcador da parada, aciona diretamente a consulta de previsão dos próximos ônibus
      marker.on("click", () => {
        if (onStopClick) {
          onStopClick(s);
        }
      });

      // Tooltip amigável ao passar o mouse ou tocar
      marker.bindTooltip(`<b>🚏 ${s.np}</b><br><small style="color:#2563eb;font-weight:600;">👉 Toque para ver horários e próximos ônibus</small>`, {
        direction: "top",
        offset: [0, -14]
      });

      this.stopsLayerGroup.addLayer(marker);
      this.stopMarkers.push(marker);
    });
  }

  clearBuses() {
    this.busesLayerGroup.clearLayers();
    this.busMarkers.clear();
  }

  clearStops() {
    this.stopsLayerGroup.clearLayers();
    this.stopMarkers = [];
  }

  toggleStopsVisibility(visible) {
    if (visible) {
      if (!this.map.hasLayer(this.stopsLayerGroup)) {
        this.map.addLayer(this.stopsLayerGroup);
      }
    } else {
      if (this.map.hasLayer(this.stopsLayerGroup)) {
        this.map.removeLayer(this.stopsLayerGroup);
      }
    }
  }

  /**
   * Ajusta os limites do mapa para enquadrar marcadores
   */
  fitBoundsToEntities() {
    const latLngs = [];

    // Adiciona posições de ônibus
    for (const item of this.busMarkers.values()) {
      latLngs.push(item.marker.getLatLng());
    }

    // Adiciona paradas
    this.stopMarkers.forEach((m) => {
      latLngs.push(m.getLatLng());
    });

    if (latLngs.length > 0) {
      const bounds = L.latLngBounds(latLngs);
      this.map.fitBounds(bounds, {
        padding: [60, 60],
        maxZoom: 16
      });
    }
  }

  /**
   * Mostra localização do usuário com círculo de precisão
   */
  setUserLocation(lat, lng, radius = 500) {
    if (this.userMarker) {
      this.map.removeLayer(this.userMarker);
    }
    if (this.userCircle) {
      this.map.removeLayer(this.userCircle);
    }

    const iconHtml = `<div class="user-marker-pin"></div>`;
    const icon = L.divIcon({
      html: iconHtml,
      className: "custom-user-icon",
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    this.userMarker = L.marker([lat, lng], { icon }).addTo(this.map);
    this.userCircle = L.circle([lat, lng], {
      radius,
      color: "#10b981",
      fillColor: "#10b981",
      fillOpacity: 0.12,
      weight: 1
    }).addTo(this.map);

    this.map.setView([lat, lng], 15);
  }
}

/**
 * Gerenciador de Favoritos e Preferências via localStorage
 */

const STORAGE_KEYS = {
  FAV_LINES: "busaqui_fav_lines",
  FAV_STOPS: "busaqui_fav_stops",
  THEME: "busaqui_theme"
};

export const Storage = {
  getFavoriteLines() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FAV_LINES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  isLineFavorite(cl) {
    const list = this.getFavoriteLines();
    return list.some((l) => Number(l.cl) === Number(cl));
  },

  toggleFavoriteLine(lineObj) {
    let list = this.getFavoriteLines();
    const exists = list.some((l) => Number(l.cl) === Number(lineObj.cl));

    if (exists) {
      list = list.filter((l) => Number(l.cl) !== Number(lineObj.cl));
    } else {
      list.push({
        cl: lineObj.cl,
        lt: lineObj.lt,
        tl: lineObj.tl,
        tp: lineObj.tp,
        ts: lineObj.ts,
        sl: lineObj.sl
      });
    }

    localStorage.setItem(STORAGE_KEYS.FAV_LINES, JSON.stringify(list));
    return !exists;
  },

  getFavoriteStops() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FAV_STOPS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  isStopFavorite(cp) {
    const list = this.getFavoriteStops();
    return list.some((s) => Number(s.cp) === Number(cp));
  },

  toggleFavoriteStop(stopObj) {
    let list = this.getFavoriteStops();
    const exists = list.some((s) => Number(s.cp) === Number(stopObj.cp));

    if (exists) {
      list = list.filter((s) => Number(s.cp) !== Number(stopObj.cp));
    } else {
      list.push({
        cp: stopObj.cp,
        np: stopObj.np,
        ed: stopObj.ed,
        py: stopObj.py,
        px: stopObj.px
      });
    }

    localStorage.setItem(STORAGE_KEYS.FAV_STOPS, JSON.stringify(list));
    return !exists;
  },

  getTheme() {
    return localStorage.getItem(STORAGE_KEYS.THEME) || "auto";
  },

  setTheme(theme) {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }
};

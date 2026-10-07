/**
 * Dados simulados realistas para o Modo de Demonstração (quando SPTRANS_TOKEN não estiver configurado).
 * Abrange linhas conhecidas de São Paulo (8000-10, 875A-10, 175P-10, 208V-10), paradas e veículos em movimento.
 */

export const mockLinhas = [
  {
    cl: 2503,
    lc: false,
    lt: "8000",
    sl: 1,
    tl: 10,
    tp: "TERM. LAPA",
    ts: "PCA. RAMOS DE AZEVEDO"
  },
  {
    cl: 34102,
    lc: false,
    lt: "8000",
    sl: 2,
    tl: 10,
    tp: "PCA. RAMOS DE AZEVEDO",
    ts: "TERM. LAPA"
  },
  {
    cl: 1050,
    lc: false,
    lt: "875A",
    sl: 1,
    tl: 10,
    tp: "PERDIZES",
    ts: "AEROPORTO"
  },
  {
    cl: 32050,
    lc: false,
    lt: "875A",
    sl: 2,
    tl: 10,
    tp: "AEROPORTO",
    ts: "PERDIZES"
  },
  {
    cl: 1750,
    lc: false,
    lt: "175P",
    sl: 1,
    tl: 10,
    tp: "METRO SANTANA",
    ts: "ANA ROSA"
  },
  {
    cl: 2080,
    lc: false,
    lt: "208V",
    sl: 1,
    tl: 10,
    tp: "TERM. PQ. D. PEDRO II",
    ts: "TERM. AE CARVALHO"
  },
  {
    cl: 3725,
    lc: false,
    lt: "3725",
    sl: 1,
    tl: 10,
    tp: "METRO CARRAO",
    ts: "TERM. VILA CARRAO"
  },
  {
    cl: 37252,
    lc: false,
    lt: "3725",
    sl: 2,
    tl: 10,
    tp: "TERM. VILA CARRAO",
    ts: "METRO CARRAO"
  }
];

export const mockParadasPorLinha = {
  // 8000-10 (Lapa -> Ramos)
  2503: [
    { cp: 340015339, np: "R. Guaicurus, 1150 (Terminal Lapa)", ed: "R. Guaicurus", py: -23.5186, px: -46.7001 },
    { cp: 340015340, np: "R. Clélia, 560", ed: "Rua Clélia", py: -23.5244, px: -46.6872 },
    { cp: 340015341, np: "Av. Francisco Matarazzo, 1000", ed: "Av Francisco Matarazzo", py: -23.5288, px: -46.6733 },
    { cp: 340015342, np: "Pça. Charles Miller", ed: "Pça Charles Miller", py: -23.5411, px: -46.6624 },
    { cp: 340015343, np: "Av. São João, 1200", ed: "Av São João", py: -23.5385, px: -46.6479 },
    { cp: 340015344, np: "Pça. Ramos de Azevedo", ed: "Pça Ramos de Azevedo", py: -23.5458, px: -46.6382 }
  ],
  // 8000-10 volta
  34102: [
    { cp: 340015344, np: "Pça. Ramos de Azevedo", ed: "Pça Ramos de Azevedo", py: -23.5458, px: -46.6382 },
    { cp: 340015343, np: "Av. São João, 1200", ed: "Av São João", py: -23.5385, px: -46.6479 },
    { cp: 340015341, np: "Av. Francisco Matarazzo, 1000", ed: "Av Francisco Matarazzo", py: -23.5288, px: -46.6733 },
    { cp: 340015339, np: "R. Guaicurus, 1150 (Terminal Lapa)", ed: "R. Guaicurus", py: -23.5186, px: -46.7001 }
  ],
  // 875A-10
  1050: [
    { cp: 340016001, np: "R. Cardoso de Almeida, 800", ed: "Rua Cardoso de Almeida", py: -23.5380, px: -46.6670 },
    { cp: 340016002, np: "Av. Paulista (MASP)", ed: "Av Paulista, 1578", py: -23.5614, px: -46.6559 },
    { cp: 340016003, np: "Av. 23 de Maio, altura Paraíso", ed: "Av 23 de Maio", py: -23.5750, px: -46.6450 },
    { cp: 340016004, np: "Aeroporto de Congonhas", ed: "Av Washington Luís", py: -23.6261, px: -46.6565 }
  ],
  // 3725-10 (Metrô Carrão)
  3725: [
    { cp: 340017001, np: "Terminal Metrô Carrão", ed: "Rua Melo Freire", py: -23.5388, px: -46.5642 },
    { cp: 340017002, np: "Rua Cantagalo, 1400", ed: "Rua Cantagalo", py: -23.5412, px: -46.5580 },
    { cp: 340017003, np: "Av. Conselheiro Carrão, 1800", ed: "Av Conselheiro Carrão", py: -23.5470, px: -46.5490 },
    { cp: 340017004, np: "Terminal Vila Carrão", ed: "Av Dezenove de Janeiro", py: -23.5535, px: -46.5410 }
  ]
};

// Veículos base com deslocamento incremental em cada chamada
let stepDelta = 0;

export function getMockPosicao(codigoLinha) {
  stepDelta = (stepDelta + 0.0003) % 0.01;
  const now = new Date();
  const timeStr = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  if (Number(codigoLinha) === 2503 || Number(codigoLinha) === 34102) {
    return {
      hr: timeStr,
      vs: [
        {
          p: "11234",
          a: true,
          ta: now.toISOString(),
          py: -23.5244 + Math.sin(Date.now() / 15000) * 0.003,
          px: -46.6872 + Math.cos(Date.now() / 15000) * 0.003
        },
        {
          p: "11589",
          a: false,
          ta: now.toISOString(),
          py: -23.5385 + Math.cos(Date.now() / 12000) * 0.002,
          px: -46.6479 + Math.sin(Date.now() / 12000) * 0.002
        },
        {
          p: "11902",
          a: true,
          ta: now.toISOString(),
          py: -23.5190 + Math.sin(Date.now() / 18000) * 0.0015,
          px: -46.6990 + Math.cos(Date.now() / 18000) * 0.0015
        }
      ]
    };
  }

  // Linha 875A ou padrão
  return {
    hr: timeStr,
    vs: [
      {
        p: "22045",
        a: true,
        ta: now.toISOString(),
        py: -23.5614 + Math.sin(Date.now() / 14000) * 0.002,
        px: -46.6559 + Math.cos(Date.now() / 14000) * 0.002
      },
      {
        p: "22118",
        a: true,
        ta: now.toISOString(),
        py: -23.5780 + Math.cos(Date.now() / 16000) * 0.003,
        px: -46.6460 + Math.sin(Date.now() / 16000) * 0.003
      }
    ]
  };
}

export function getMockPrevisaoParada(codigoParada) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  return {
    hr: timeStr,
    p: {
      cp: Number(codigoParada),
      np: "Parada Simulada BusAqui",
      py: -23.5505,
      px: -46.6333,
      l: [
        {
          cl: 2503,
          c: "8000-10",
          lt0: "TERM. LAPA",
          lt1: "PCA. RAMOS DE AZEVEDO",
          qv: 2,
          sl: 1,
          vs: [
            { p: "11234", t: "05 min", a: true, ta: now.toISOString(), py: -23.5244, px: -46.6872 },
            { p: "11589", t: "14 min", a: false, ta: now.toISOString(), py: -23.5385, px: -46.6479 }
          ]
        },
        {
          cl: 1050,
          c: "875A-10",
          lt0: "PERDIZES",
          lt1: "AEROPORTO",
          qv: 1,
          sl: 1,
          vs: [
            { p: "22045", t: "08 min", a: true, ta: now.toISOString(), py: -23.5614, px: -46.6559 }
          ]
        }
      ]
    }
  };
}

export function getMockPrevisaoLinha(codigoLinha) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  return {
    hr: timeStr,
    ps: [
      {
        cp: 340015340,
        np: "R. Clélia, 560",
        py: -23.5244,
        px: -46.6872,
        vs: [
          { p: "11234", t: "04 min", a: true, ta: now.toISOString(), py: -23.5244, px: -46.6872 }
        ]
      },
      {
        cp: 340015343,
        np: "Av. São João, 1200",
        py: -23.5385,
        px: -46.6479,
        vs: [
          { p: "11589", t: "12 min", a: false, ta: now.toISOString(), py: -23.5385, px: -46.6479 }
        ]
      }
    ]
  };
}

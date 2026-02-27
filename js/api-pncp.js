const API_BASE = "https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao";

const ApiPNCP = {
  onlyDigits: (s) => (s || "").replace(/\D+/g, ""),

  isAAAAMMDD: (s) => /^\d{8}$/.test(s),

  normalizeModalidades: (value) => {
    const raw = (value || "").split(",").map(s => s.trim()).filter(Boolean);
    const nums = raw.map(s => ApiPNCP.onlyDigits(s)).filter(s => s.length > 0);
    return Array.from(new Set(nums));
  },

  buildUrl: ({dataInicial, dataFinal, codigoModalidadeContratacao, pagina=1, tamanhoPagina=50}) => {
    const u = new URL(API_BASE);
    u.searchParams.set("dataInicial", dataInicial);
    u.searchParams.set("dataFinal", dataFinal);
    u.searchParams.set("codigoModalidadeContratacao", codigoModalidadeContratacao);
    u.searchParams.set("pagina", String(pagina));
    u.searchParams.set("tamanhoPagina", String(tamanhoPagina));
    return u.toString();
  },

  fetchJsonWithTimeout: async (url, ms=20000) => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    try {
      const resp = await fetch(url, { signal: ctrl.signal });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return await resp.json();
    } finally {
      clearTimeout(t);
    }
  },

  pick: (obj, keys) => {
    for (const k of keys){
      if (obj && obj[k] !== undefined && obj[k] !== null && String(obj[k]).trim() !== "") return obj[k];
    }
    return "";
  }
};